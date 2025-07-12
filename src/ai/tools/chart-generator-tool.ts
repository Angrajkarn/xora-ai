
'use server';

import { ai } from '@/ai/genkit';
import * as z from 'zod';
import { runChartGeneratorFlow } from '../flows/chart-generator-flow';
import { ChartDataSchema } from '../schemas/chart-data-schema';

const ChartGeneratorToolInputSchema = z.object({
  prompt: z.string().describe("The user's prompt related to visualization."),
  csvData: z.string().describe('The raw text content of the CSV file provided by the user.'),
});

export const generateChartTool = ai.defineTool(
  {
    name: 'generateChart',
    description: "Generates a chart from a user's prompt and provided CSV data. Use this tool ONLY when the user explicitly asks to visualize data or create a chart AND has uploaded a CSV file.",
    inputSchema: ChartGeneratorToolInputSchema,
    outputSchema: ChartDataSchema,
  },
  async (input) => {
    return await runChartGeneratorFlow(input);
  }
);
