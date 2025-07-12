
'use server';
/**
 * @fileOverview An AI flow that analyzes data and a prompt to generate chart visualizations.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { parseCsvDataTool } from '../tools/csv-parser-tool';
import { ChartDataSchema } from '../schemas/chart-data-schema';

const ChartGeneratorInputSchema = z.object({
  prompt: z.string().describe("The user's request for visualization (e.g., 'show sales vs month')."),
  csvData: z.string().optional().describe("The raw string data from a CSV file."),
});
export type ChartGeneratorInput = z.infer<typeof ChartGeneratorInputSchema>;
export type ChartGeneratorOutput = z.infer<typeof ChartDataSchema>;

const chartGeneratorSystemPrompt = `You are a powerful data visualization AI. Your task is to analyze user prompts and provided data (if any) to generate a valid JSON object for rendering a chart.

**Instructions:**

1.  **Analyze the Prompt:** Understand what the user wants to visualize.
2.  **Process Data:**
    *   If raw CSV data is provided, you MUST use the \`parseCsvData\` tool to convert it into structured JSON.
    *   Analyze the column headers and data types from the parsed JSON.
3.  **Choose Chart Type:** Based on the data and prompt, select the best chart type ('bar', 'line', 'area', 'pie').
    *   **Line/Area:** Good for time-series data (e.g., sales over months).
    *   **Bar:** Good for comparing distinct categories (e.g., sales per product).
    *   **Pie:** Good for showing proportions of a whole (e.g., market share). Use only for a small number of categories.
4.  **Identify Keys:**
    *   Determine the \`dataKey\`: the main categorical or time-series axis (e.g., 'month', 'productName').
    *   Determine the \`categories\`: the numerical values to be plotted (e.g., 'sales', 'revenue', 'users').
5.  **Generate Config:** Create a configuration object for the chart. Assign a unique, visually appealing hex color for each category.
6.  **Create Title & Description:** Write a clear, concise title for the chart and a brief description summarizing the key insight.
7.  **Final Output:** Your final response MUST be a single, valid JSON object that strictly adheres to the provided Zod schema. Do not include any other text, markdown, or explanations.`;


const chartGeneratorFlow = ai.defineFlow(
  {
    name: 'chartGeneratorFlow',
    inputSchema: ChartGeneratorInputSchema,
    outputSchema: ChartDataSchema,
  },
  async ({ prompt, csvData }) => {
    let toolInput = prompt;
    if (csvData) {
        toolInput += `\n\nCSV Data to analyze:\n"""\n${csvData}\n"""`;
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: chartGeneratorSystemPrompt,
      prompt: toolInput,
      output: { schema: ChartDataSchema },
      tools: [parseCsvDataTool],
    });
    
    if (!output) {
      throw new Error('Chart generation failed to produce an output.');
    }
    
    return output;
  }
);

export async function runChartGeneratorFlow(input: ChartGeneratorInput): Promise<ChartGeneratorOutput> {
    return await chartGeneratorFlow(input);
}
