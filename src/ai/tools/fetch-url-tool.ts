'use server';

import { ai } from '@/ai/genkit';
import * as z from 'zod';
import * as cheerio from 'cheerio';

export const fetchUrlTool = ai.defineTool(
    {
        name: 'fetchUrlContent',
        description: 'Fetches and returns the text content of a given URL. Use this tool when the user provides a URL and asks to analyze, summarize, or answer questions about its content.',
        inputSchema: z.object({
            url: z.string().url().describe('The URL of the webpage to fetch.'),
        }),
        outputSchema: z.string().describe('The extracted text content of the webpage.'),
    },
    async ({ url }) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            const html = await response.text();
            const $ = cheerio.load(html);

            // Remove script, style, and other non-content tags
            $('script, style, nav, header, footer, aside, noscript, svg, img, link').remove();
            
            let text = $('body').text();
            
            // Clean up whitespace
            text = text.replace(/\s\s+/g, ' ').trim();
            
            // Limit content size to avoid overly large contexts
            const MAX_LENGTH = 20000;
            if (text.length > MAX_LENGTH) {
                text = text.substring(0, MAX_LENGTH) + '... [content truncated]';
            }

            return text;
        } catch (error: any) {
            console.error(`Error fetching URL content: ${error.message}`);
            return `Error: Could not retrieve content from the URL. ${error.message}`;
        }
    }
);
