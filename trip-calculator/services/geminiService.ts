import { Trip } from "../types";

export const generateTripReport = async (trips: Trip[], query: string): Promise<string> => {
  // Mock response for now as we removed the heavy GenAI dependency for the prototype
  console.log("Analyzing trips...", trips.length);
  return `[AI Analysis Placeholder]
  
  Based on your query "${query}", here is a summary:
  - Total Trips: ${trips.length}
  - Completed: ${trips.filter(t => t.status === 'COMPLETED').length}
  
  (AI features are currently disabled in this lightweight build)`;
};
