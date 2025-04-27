from enum import Enum
from fastapi import FastAPI, status, HTTPException
from dotenv import load_dotenv
import aiohttp
import asyncio
import os
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

app = FastAPI()
load_dotenv()

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
    return [
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
                    "daily": next((True for requirement in quest["requirements"] if requirement["type"] == "DailyResetQuestRequirement"), False)
                }
                for quest in sorted(quest_list, key=lambda q: q["name"])
            ],
        }
        for game_slug, quest_list in quest_data["quests"].items()
    ]


class Player(BaseModel):
    uuid: str
    username: str
    xp: int
    quests_completed: int


@app.get("/player")
async def player_route(username: str) -> Player:
    api_key = os.getenv('HYPIXEL_API_KEY')
    async with aiohttp.ClientSession() as session:
        mojang_request = await session.get(f"https://api.mojang.com/users/profiles/minecraft/{username}")
        data = await mojang_request.json()
        if mojang_request.status != status.HTTP_200_OK:
            raise HTTPException(status_code=404, detail=data["errorMessage"])
        
        uuid, username = data["id"], data["name"]

        hypixel_request = await session.get(f"https://api.hypixel.net/v2/player?key={api_key}&uuid={uuid}")
        data = await hypixel_request.json()

        xp = data["player"]["networkExp"]
        quests_completed = sum(len(quest["completions"]) for quest in data["player"]["quests"].values() if "completions" in quest)

    return Player(
        uuid=uuid,
        username=username,
        xp=xp,
        quests_completed=quests_completed
    )



