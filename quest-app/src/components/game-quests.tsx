import { ChevronDown, ChevronUp } from "lucide-react";
import { Game, Quest } from "../types";
import { useState } from "react";

export default function GameQuests({
  game,
  toggleQuest,
  selectedQuests,
}: {
  game: Game;
  toggleQuest: (quest: Quest) => void;
  selectedQuests: Quest[];
}) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const selectedQuestCount = game.quests.filter((quest) =>
    selectedQuests.includes(quest)
  ).length;

  return (
    <div className="rounded-lg shadow-sm">
      <div
        className="flex justify-between my-4 mx-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-xl">{game.name}</h3>
        <div className="flex gap-x-4 items-center">
          <p>
            {selectedQuestCount}
            <span className="mx-0.5">/</span>
            {game.quests.length}
          </p>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>
      {expanded && (
        <div className="mx-4">
          <ul className="flex flex-col divide-y divide-gray-200">
            {game.quests.map((quest) => (
              <li
                key={quest.name}
                className="p-4 flex items-center gap-x-4 justify-between cursor-default"
                onClick={() => toggleQuest(quest)}
              >
                <div className="flex items-center gap-x-4">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={selectedQuests
                      .map((q) => q.name)
                      .includes(quest.name)}
                    onChange={() => toggleQuest(quest)}
                  />
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
