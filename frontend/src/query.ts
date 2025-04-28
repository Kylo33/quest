import { queryOptions } from "@tanstack/react-query";

export const questQueryOptions = queryOptions({
  queryKey: ["quests"],
  staleTime: 6 * 60 * 60_000,
  queryFn: () =>
    fetch(`${import.meta.env.VITE_BACKEND_URL}/quests`).then((res) =>
      res.json()
    ),
});

export function playerQueryOptions(username: string) {
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
