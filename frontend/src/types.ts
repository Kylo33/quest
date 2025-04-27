export type Quest = {
  name: string;
  xp: number;
  daily: boolean;
  description: string;
};

export type Game = {
  name: string;
  quests: Quest[];
};
