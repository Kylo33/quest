import { ChevronDown, ChevronUp } from "lucide-react";
import { Game } from "../types";
import { useState } from "react";

export default function GameQuests({ game }: { game: Game }) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="rounded-lg shadow-sm">
      <div
        className="flex justify-between my-2 mx-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-xl">{game.name}</h3>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </div>
      {expanded && (
        <div className="mx-4">
          <ul className="flex flex-col divide-y divide-gray-200">
            {game.quests.map((quest) => (
              <li className="p-4 flex items-center gap-x-4 justify-between">
                <div className="flex items-center gap-x-4">
                  <input type="checkbox" className="size-4" />
                  <div>
                    <h4 className="text-lg">{quest.name}</h4>
                    <p className="text-black/50">{quest.description}</p>
                  </div>
                </div>
                <p className="text-purple-700/90">{quest.xp} xp</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
