
'use server';

import { ai } from '@/ai/genkit';
import * as z from 'zod';
import * as Papa from 'papaparse';

export const parseCsvDataTool = ai.defineTool(
    {
        name: 'parseCsvData',
        description: 'Parses raw CSV text data into a JSON array of objects. Use this tool when you need to analyze or process structured data provided in CSV format.',
        inputSchema: z.string().describe('The raw text content of the CSV file.'),
        outputSchema: z.array(z.record(z.any())).describe('An array of objects representing the parsed CSV rows.'),
    },
    async (csvText) => {
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true, // Automatically convert numbers and booleans
                complete: (results) => {
                    if (results.errors.length) {
                        console.error("CSV Parsing errors:", results.errors);
                        reject(new Error(results.errors.map(e => e.message).join(', ')));
                    } else {
                        // Limit to first 500 rows for performance
                        resolve(results.data.slice(0, 500) as Record<string, any>[]);
                    }
                },
                error: (error: Error) => {
                    console.error("CSV Parsing failed:", error);
                    reject(error);
                }
            });
        });
    }
);
