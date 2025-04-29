import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calculator,
  CalendarRange,
  Code,
  Goal,
  Hash,
  Sunrise,
  Trophy,
  Zap,
} from "lucide-react";
import GameQuests from "../components/game-quests";
import { Game, Quest } from "../types";
import { useEffect, useState } from "react";
import { playerQueryOptions, questQueryOptions } from "../query";
import { ResponsiveLine } from "@nivo/line";

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

  return Math.sqrt(xp / 1250 + 12.25) - 2.5;
}

function getXpFromNetworkLevel(level: number) {
  // Credit to "nathanfranke" on the Hypixel forums for this equation! Thank you!
  // https://hypixel.net/threads/guide-network-level-equations.3412241/
  level--;
  return level * (1250 * level + 8750);
}

function RouteComponent() {
  const [dailyChallenges, setDailyChallenges] = useState<string>("10");
  const [selectedQuests, setSelectedQuests] = useState<Quest[]>([]);
  const [expectedDate, setExpectedDate] = useState<Date | undefined>();
  const [graphData, setGraphData] = useState<
    {
      x: Date;
      y: number;
    }[]
  >([]);
  const { username } = Route.useParams();
  const questQuery = useQuery(questQueryOptions);
  const playerQuery = useQuery(playerQueryOptions(username));
  const [targetLevel, setTargetLevel] = useState<number>(
    Math.ceil(Math.floor(getNetworkLevelFromXp(playerQuery.data.xp)) / 50) * 50
  );

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

  useEffect(() => {
    function calculateExpectedDate(): Date | undefined {
      if (!targetLevel) {
        return undefined;
      }

      const targetXp = getXpFromNetworkLevel(targetLevel);

      console.log(targetXp);

      const neededXp = targetXp - playerQuery.data.xp;

      if (neededXp <= 0) {
        return undefined;
      }

      let remainingXp = neededXp;
      console.log("Remaining XP:", remainingXp);
      console.log("Daily XP:", dailyXp);
      console.log("Weekly XP:", weeklyXp);

      const dateFormatter = Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
      });

      const dateCursor = new Date();
      const newGraphData = [];

      let i;
      for (i = 0; i < 10 * 365 && remainingXp >= 0; i++) {
        remainingXp -= dailyXp;
        // Assume the player gets all of their weekly quests on the last day of the week (in EST)
        if (dateFormatter.format(dateCursor) == "Thursday") {
          remainingXp -= weeklyXp;
        }

        const level = Math.floor(getNetworkLevelFromXp(targetXp - remainingXp));
        if (
          (!newGraphData.length &&
            level > Math.floor(getNetworkLevelFromXp(playerQuery.data.xp))) ||
          (newGraphData.length &&
            level > newGraphData[newGraphData.length - 1].y)
        ) {
          newGraphData.push({
            x: new Date(dateCursor),
            y: level,
          });
        }
        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      if (i == 10 * 365) {
        return undefined;
      }

      setGraphData(newGraphData);
      return dateCursor;
    }

    setExpectedDate(calculateExpectedDate());
  }, [
    targetLevel,
    dailyChallenges,
    selectedQuests,
    playerQuery.data.xp,
    dailyXp,
    weeklyXp,
  ]);

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
              Network Level{" "}
              {Math.floor(getNetworkLevelFromXp(playerQuery.data.xp))}
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
          <label
            htmlFor="dailyChallenges"
            className="flex gap-x-2 text-xl items-center"
          >
            <Zap size={24} /> Daily Challenges
          </label>
          <input
            type="number"
            autoFocus
            id="targetLevel"
            className="text-xl max-w-2xl border border-gray-300 rounded-md shadow-sm py-2 px-4"
            value={targetLevel}
            onChange={(e) => setTargetLevel(+e.target.value || 0)}
          />
          <input
            type="number"
            min={0}
            max={10}
            id="dailyChallenges"
            value={dailyChallenges}
            className="text-xl max-w-2xl border border-gray-300 rounded-md shadow-sm py-2 px-4"
            onChange={(e) => setDailyChallenges(e.target.value)}
          />
        </div>
        <div className="h-96 w-full border border-gray-300 rounded-md shadow-sm py-2 px-4">
          <ResponsiveLine
            enableGridX={false}
            yScale={{
              min: Math.floor(getNetworkLevelFromXp(playerQuery.data.xp)),
              max: targetLevel + 1,
              type: "linear",
            }}
            xScale={{
              min: graphData[0]?.x,
              max: graphData[graphData.length - 1]?.x,
              type: "time",
              format: "%Y-%m-%d",
            }}
            axisLeft={{
              legend: "Network Level",
              legendOffset: -40,
              legendPosition: "middle",
            }}
            tooltip={({ point }) => (
              <div className="bg-white px-2 py-1 rounded-sm shadow-md flex items-center gap-x-2">
                <Trophy size={14} className="text-purple-700/90" />{" "}
                <div>
                  <span className="text-purple-700/90">{point.data.y}</span>:{" "}
                  {point.data.x.toLocaleDateString()}
                </div>
              </div>
            )}
            axisBottom={{ tickRotation: -20, format: "%Y-%m-%d" }}
            animate
            curve="cardinal"
            data={[
              {
                data: graphData,
                id: "1",
              },
            ]}
            isFocusable
            enableArea
            areaBaselineValue={Math.floor(
              getNetworkLevelFromXp(playerQuery.data.xp)
            )}
            useMesh
            margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
            colors={["#8d18dd"]}
          />
        </div>
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
              {expectedDate?.toLocaleDateString() || "?"}
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
