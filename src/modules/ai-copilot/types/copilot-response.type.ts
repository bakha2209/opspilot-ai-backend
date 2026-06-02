export type CopilotResponse = {
  answer: string;
  recommendedActions: {
    type: string;
    label: string;
    payload: Record<string, any>;
  }[];
};
