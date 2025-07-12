
'use server';

import { ai } from '@/ai/genkit';
import * as z from 'zod';

// Tool to create a calendar event
export const createCalendarEvent = ai.defineTool(
  {
    name: 'createCalendarEvent',
    description: 'Creates a new event in Google Calendar.',
    inputSchema: z.object({
      title: z.string().describe('The title of the event.'),
      description: z.string().optional().describe('A brief description of the event.'),
      startTime: z.string().describe('The start time of the event in ISO 8601 format.'),
      endTime: z.string().describe('The end time of the event in ISO 8601 format.'),
      attendees: z.array(z.string().email()).optional().describe('A list of attendee email addresses.'),
      location: z.string().optional().describe('The physical location or video call link (e.g., Zoom).'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    console.log(`Scheduling event: ${input.title}`);
    // In a real application, you would integrate with the Google Calendar API here.
    return `Event "${input.title}" has been successfully scheduled.`;
  }
);

// Tool to create a task in Todoist
export const createTodoistTask = ai.defineTool(
  {
    name: 'createTodoistTask',
    description: 'Adds a new task to Todoist.',
    inputSchema: z.object({
      title: z.string().describe('The content of the task.'),
      dueDate: z.string().optional().describe('The due date for the task in YYYY-MM-DD format.'),
      priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional().describe('The priority of the task (P1=High, P4=Low).'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    console.log(`Creating Todoist task: ${input.title}`);
    // In a real application, you would integrate with the Todoist API here.
    return `Task "${input.title}" has been added to Todoist.`;
  }
);

// Tool to create a Notion page
export const createNotionPage = ai.defineTool(
  {
    name: 'createNotionPage',
    description: 'Creates a new page in a Notion database.',
    inputSchema: z.object({
      title: z.string().describe('The title of the Notion page.'),
      content: z.string().optional().describe('The content of the page, can be plain text or Markdown.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    console.log(`Creating Notion page: ${input.title}`);
    // In a real application, you would integrate with the Notion API here.
    return `Notion page "${input.title}" has been created.`;
  }
);
