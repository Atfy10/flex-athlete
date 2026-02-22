export type SportDto = {
  id: number;
  name: string;
  description?: string;
  category: SportCategory;
  isRequireHealthTest: boolean;
};

export type SportCategory = "Individual" | "Team";
