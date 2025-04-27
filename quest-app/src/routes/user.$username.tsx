import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Code } from "lucide-react";
import GameQuests from "../components/game-quests";
import { Game } from "../types";

const questQueryOptions = queryOptions({
  queryKey: ["quests"],
  staleTime: 15 * 60_000,
  queryFn: () =>
    fetch("http://localhost:8000/quests").then((res) => res.json()),
});

function playerQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["player", username.toLowerCase()],
    staleTime: 15_000,
    queryFn: () =>
      fetch(
        `http://localhost:8000/player?username=${username.toLocaleLowerCase()}`
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

function getNetworkLevel(xp: number) {
  // Credit to "nathanfranke" on the Hypixel forums for this equation! Thank you!
  // https://hypixel.net/threads/guide-network-level-equations.3412241/

  return Math.floor(Math.sqrt(xp / 1250 + 12.25) - 3.5);
}

function RouteComponent() {
  const { username } = Route.useParams();
  const questQuery = useQuery(questQueryOptions);
  const playerQuery = useQuery(playerQueryOptions(username));

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
              Network Level {getNetworkLevel(playerQuery.data.xp)}
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
      <main className="flex flex-col gap-2 max-w-2xl mx-auto my-4">
        <div className="bg-purple-300 h-96 w-full rounded-lg"></div>
        {questQuery.data.map((game: Game) => (
          <GameQuests game={game} />
        ))}
      </main>
    </>
  );
}
