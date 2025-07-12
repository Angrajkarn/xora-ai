
'use server';

/**
 * @fileOverview A productivity assistant flow that uses tools to manage schedules, tasks, and notes.
 * 
 * - productivityAssistantFlow - The main flow function.
 * - runProductivityAssistantFlow - An exported wrapper for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createCalendarEvent, createTodoistTask, createNotionPage } from '../tools/productivity-tools';

const ProductivityAssistantInputSchema = z.object({
  prompt: z.string().describe('The user\'s request.'),
});
export type ProductivityAssistantInput = z.infer<typeof ProductivityAssistantInputSchema>;

const ProductivityAssistantOutputSchema = z.string().describe('The confirmation or response from the assistant.');

const assistantSystemPrompt = `You are a highly intelligent AI productivity assistant integrated with tools like Google Calendar, Notion, and Todoist. Your job is to help the user organize their schedule, meetings, deadlines, and personal tasks with precision.

You must:
- Understand and extract time, date, event details, priorities, and duration from natural language.
- If the user requests scheduling (e.g., "Book a meeting with Alex tomorrow at 5 PM"), use the 'createCalendarEvent' tool with all relevant details.
- For tasks ("Remind me to send the report by Thursday"), use the 'createTodoistTask' tool, extracting the title, deadline, and priority.
- For notes ("Create a Notion page for 'Website Redesign Plan'"), use the 'createNotionPage' tool.
- If any required information for a tool is missing (e.g., time for a meeting), you MUST ask a smart, clarifying question to get the necessary details from the user. Do not make up information.
- Once a tool has been successfully called, confirm the action in a friendly, concise tone based on the tool's output. For example: "Done. I've scheduled the meeting with Alex." or "I've added 'Submit Tax Returns' to your Todoist."
- If the prompt is a general question or doesn't map to a tool, answer it conversationally as a helpful assistant.
`;

const productivityAssistantFlow = ai.defineFlow(
  {
    name: 'productivityAssistantFlow',
    inputSchema: ProductivityAssistantInputSchema,
    outputSchema: ProductivityAssistantOutputSchema,
  },
  async ({ prompt }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: assistantSystemPrompt,
      prompt: prompt,
      tools: [createCalendarEvent, createTodoistTask, createNotionPage],
      output: {
        format: 'text'
      }
    });

    return text;
  }
);

export async function runProductivityAssistantFlow(input: ProductivityAssistantInput): Promise<string> {
    return await productivityAssistantFlow(input);
}
