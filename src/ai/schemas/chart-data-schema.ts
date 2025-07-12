import { z } from 'zod';

export const ChartDataSchema = z.object({
    type: z.enum(['bar', 'line', 'area', 'pie']).describe('The suggested chart type.'),
    data: z.array(z.record(z.any())).describe('The structured data for the chart.'),
    config: z.record(z.object({
        label: z.string(),
        color: z.string().describe("A hex color code, e.g., '#8884d8'"),
    })).describe('Configuration for each data category, including label and color.'),
    dataKey: z.string().describe('The key in the data objects that represents the main axis label (e.g., month, year).'),
    categories: z.array(z.string()).describe('An array of keys for the data categories to be plotted.'),
    title: z.string().optional().describe('A descriptive title for the chart.'),
    description: z.string().optional().describe('A brief summary or insight about the data shown in the chart.'),
});
