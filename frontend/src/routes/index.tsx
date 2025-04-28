import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useState } from "react";
import { questQueryOptions } from "../query";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(questQueryOptions);
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/user/$username",
      params: { username },
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <form className="flex flex-col gap-y-2" onSubmit={onSubmit}>
        <label
          className="text-xl text-gray-700 flex gap-x-2 items-center"
          htmlFor="username"
        >
          <User /> Username
        </label>
        <input
          type="text"
          value={username}
          id="username"
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          className="text-xl max-w-2xl border border-gray-300 rounded-md shadow-sm py-2 px-4"
        />
      </form>
    </div>
  );
}
