import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calculator,
  CalendarRange,
  Code,
  Goal,
  Hash,
  Sunrise,
  Zap,
} from "lucide-react";
import GameQuests from "../components/game-quests";
import { Game, Quest } from "../types";
import { useState } from "react";

const questQueryOptions = queryOptions({
  queryKey: ["quests"],
  staleTime: 15 * 60_000,
  queryFn: () =>
    fetch(`${import.meta.env.VITE_BACKEND_URL}/quests`).then((res) =>
      res.json()
    ),
});

function playerQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["player", username.toLowerCase()],
    staleTime: 15_000,
    queryFn: () =>
      fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/player?username=${username.toLocaleLowerCase()}`
      ).then((res) => res.json()),
  });
}

export const Route = createFileRoute("/user/$username")({
  component: RouteComponent,
  loader: async ({ params, context: { queryClient } }) => {
    // queryClient.prefetchQuery(playerQueryOptions(params.username));
    await queryClient.ensureQueryData(questQueryOptions);
    await queryClient.ensureQueryData(playerQueryOptions(params.username));
  },
});

function getNetworkLevelFromXp(xp: number) {
  // Credit to "nathanfranke" on the Hypixel forums for this equation! Thank you!
  // https://hypixel.net/threads/guide-network-level-equations.3412241/

  return Math.floor(Math.sqrt(xp / 1250 + 12.25) - 3.5) + 1;
}

function getXpFromNetworkLevel(level: number) {
  // Credit to "nathanfranke" on the Hypixel forums for this equation! Thank you!
  // https://hypixel.net/threads/guide-network-level-equations.3412241/

  return level * (1250 * level + 8750);
}

function RouteComponent() {
  const [targetLevel, setTargetLevel] = useState<number | undefined>();
  const [dailyChallenges, setDailyChallenges] = useState<string>("10");
  const [selectedQuests, setSelectedQuests] = useState<Quest[]>([]);
  const { username } = Route.useParams();
  const questQuery = useQuery(questQueryOptions);
  const playerQuery = useQuery(playerQueryOptions(username));

  function toggleQuest(quest: Quest) {
    if (!selectedQuests.map((q) => q.name).includes(quest.name)) {
      setSelectedQuests([...selectedQuests, quest]);
    } else {
      setSelectedQuests(selectedQuests.filter((q) => q.name != quest.name));
    }
  }

  const dailyXp =
    selectedQuests
      .filter((q) => q.daily)
      .map((q) => q.xp)
      .reduce((t, n) => t + n, 0) +
    (+dailyChallenges || 0) * 3700;

  const weeklyXp = selectedQuests
    .filter((q) => !q.daily)
    .map((q) => q.xp)
    .reduce((t, n) => t + n, 0);

  function calculateExpectedDate(): string {
    if (!targetLevel) {
      return "";
    }

    const neededXp = getXpFromNetworkLevel(targetLevel) - playerQuery.data.xp;

    if (neededXp <= 0) {
      return "";
    }

    let remainingXp = neededXp;

    const dateFormatter = Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
    });

    const dateCursor = new Date();

    let i;
    for (i = 0; i < 10 * 365 && remainingXp >= 0; i++) {
      remainingXp -= dailyXp;
      // Assume the player gets all of their weekly quests on the last day of the week (in EST)
      if (dateFormatter.format(dateCursor) == "Thursday") {
        remainingXp -= weeklyXp;
      }

      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    if (i == 10 * 365) {
      return "";
    }

    return dateCursor.toDateString();
  }

  const expectedDate = calculateExpectedDate();

  return (
    <>
      <header className="flex p-6 justify-between relative shadow-sm">
        <Link
          to="/"
          className="flex gap-x-4 items-center hover:bg-purple-300 transition-all duration-300 rounded-full px-4 py-2"
        >
          <ArrowLeft />
          <p className="text-lg">Back</p>
        </Link>
        <section className="flex justify-between items-center gap-x-8 max-w-2xl mx-auto flex-1 absolute inset-0">
          <h2 className="text-2xl">{playerQuery.data.username}</h2>
          <div className="flex gap-x-2">
            <div className="bg-purple-700/90 rounded-full text-white px-4 py-1">
              Quests {playerQuery.data.quests_completed}
            </div>
            <div className="bg-purple-700/90 rounded-full text-white px-4 py-1">
              Network Level {getNetworkLevelFromXp(playerQuery.data.xp)}
            </div>
          </div>
        </section>
        <a
          href="https://github.com/kylo33/quest"
          className="flex gap-x-4 items-center hover:bg-purple-300 transition-all duration-300 rounded-full px-4 py-2"
        >
          <Code />
        </a>
      </header>
      <main className="flex flex-col gap-6 max-w-2xl mx-auto my-4">
        <div className="grid gap-x-4 gap-y-2 grid-cols-2">
          <label
            className="flex gap-x-2 text-xl items-center"
            htmlFor="targetLevel"
          >
            <Goal size={24} /> Target Level
          </label>
          <h3 className="flex gap-x-2 text-xl items-center">
            <Zap size={24} /> Daily Challenges
          </h3>
          <input
            type="number"
            autoFocus
            id="targetLevel"
            className="text-xl max-w-2xl border border-gray-300 rounded-md shadow-sm py-2 px-4"
            value={targetLevel}
            onChange={(e) => setTargetLevel(+e.target.value || undefined)}
          />
          <input
            type="number"
            min={0}
            max={10}
            autoFocus
            id="targetLevel"
            value={dailyChallenges}
            className="text-xl max-w-2xl border border-gray-300 rounded-md shadow-sm py-2 px-4"
            onChange={(e) => setDailyChallenges(e.target.value)}
          />
        </div>
        <div className="bg-purple-300 h-96 w-full rounded-lg"></div>
        <div className="flex justify-between divide-x divide-gray-200">
          <div className="flex flex-1 flex-col gap-y-2 items-center">
            <h3 className="flex gap-x-2 text-lg text-gray-600 items-center">
              <Hash size={24} /> Daily Quests
            </h3>
            <p className="text-xl py-2 px-4 text-center flex flex-1 justify-center items-center">
              {selectedQuests.filter((quest) => quest.daily).length}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-y-2 items-center">
            <h3 className="flex gap-x-2 text-lg text-gray-600 items-center">
              <Sunrise size={24} /> Daily XP
            </h3>
            <p className="text-xl py-2 px-4 text-center flex flex-1 justify-center items-center">
              {dailyXp.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-y-2 items-center">
            <h3 className="flex gap-x-2 text-lg text-gray-600 items-center">
              <CalendarRange size={24} /> Weekly XP
            </h3>
            <p className="text-xl py-2 px-4 flex flex-1 text-center justify-center items-center">
              {weeklyXp.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-y-2 items-center">
            <h3 className="flex gap-x-2 text-lg text-gray-600 items-center">
              <Calculator size={24} />
              Expected Date
            </h3>
            <p className="text-xl py-2 px-4 text-center flex flex-1 justify-center items-center">
              {expectedDate.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {questQuery.data.map((game: Game) => (
            <GameQuests
              key={game.name}
              game={game}
              toggleQuest={toggleQuest}
              selectedQuests={selectedQuests}
            />
          ))}
        </div>
      </main>
    </>
  );
}
