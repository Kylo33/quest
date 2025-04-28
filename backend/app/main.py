from enum import Enum
from typing import Tuple
from fastapi import FastAPI, status, HTTPException
from dotenv import load_dotenv
import aiohttp
import asyncio
import os
from fastapi.middleware.cors import CORSMiddleware
import redis
import json

from pydantic import BaseModel

app = FastAPI()
load_dotenv()
hypixel_api_key = os.getenv("HYPIXEL_API_KEY")
r = redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)

origins = [
    "http://quest.renntg.com",
    "https://quest.renntg.com",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Quest(BaseModel):
    xp: int
    name: str
    description: str
    daily: bool


class Game(BaseModel):
    name: str
    quests: list[Quest]


async def get_resource(session: aiohttp.ClientSession, type: str):
    return await (
        await session.get(f"https://api.hypixel.net/v2/resources/{type}")
    ).json()


@app.get("/quests")
async def quest_route() -> list[Game]:
    cache_key = "quest:all"

    if data_str := r.get(cache_key):
        return json.loads(data_str)

    # Fetch game + quest data simultaneously
    async with aiohttp.ClientSession() as session:
        quest_data, games_data = await asyncio.gather(
            get_resource(session, "quests"),
            get_resource(session, "games"),
        )

    # Make a dict from game slug to human-readable name
    slug_to_name = {
        game_object["databaseName"].lower(): game_object["name"]
        for game_object in games_data["games"].values()
    }

    # Parse the quests
    data = [
        {
            "name": slug_to_name[game_slug],
            "quests": [
                {
                    "name": quest["name"],
                    "description": quest["description"],
                    "xp": next(
                        (
                            reward["amount"]
                            for reward in quest["rewards"]
                            if reward["type"] == "MultipliedExperienceReward"
                        ),
                        0,
                    ),
                    "daily": next(
                        (
                            True
                            for requirement in quest["requirements"]
                            if requirement["type"] == "DailyResetQuestRequirement"
                        ),
                        False,
                    ),
                }
                for quest in sorted(quest_list, key=lambda q: q["name"])
            ],
        }
        for game_slug, quest_list in quest_data["quests"].items()
    ]
    
    r.set(cache_key, json.dumps(data), ex=(6*60*60))

    return data


class Player(BaseModel):
    uuid: str
    username: str
    xp: int
    quests_completed: int


async def call_mojang(username: str, session: aiohttp.ClientSession) -> Tuple[str, str]:
    cache_key = f"mojang-profile:{username.lower()}"
    if data := r.hgetall(cache_key):
        return data["id"], data["name"]

    mojang_request = await session.get(
        f"https://api.mojang.com/users/profiles/minecraft/{username}"
    )

    data = await mojang_request.json()

    r.hset(cache_key, mapping={
        "id": data["id"],
        "name": data["name"],
    })
    r.expire(cache_key, 6 * 60 * 60)

    return data["id"], data["name"]

async def get_player_data(uuid: str, session: aiohttp.ClientSession):
    cache_key = f"hypixel-player:{uuid}"
    if data_str := r.get(cache_key):
        return json.loads(data_str)

    hypixel_request = await session.get(
        f"https://api.hypixel.net/v2/player?key={hypixel_api_key}&uuid={uuid}"
    )
    data = await hypixel_request.json()

    r.set(cache_key, json.dumps(data), ex=60)
    
    return data

@app.get("/player")
async def player_route(username: str) -> Player:
    async with aiohttp.ClientSession() as session:
        uuid, username = await call_mojang(username, session)
        data = await get_player_data(uuid, session)

        xp = data["player"]["networkExp"]
        quests_completed = sum(
            len(quest["completions"])
            for quest in data["player"]["quests"].values()
            if "completions" in quest
        )

    return Player(
        uuid=uuid,
        username=username,
        xp=xp,
        quests_completed=quests_completed,
    )
