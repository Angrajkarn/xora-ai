
'use server';
/**
 * @fileOverview An AI flow that acts as a collaborative co-pilot in a shared chatroom.
 *
 * - runCollaborativeCopilot - A function that analyzes a conversation and provides helpful insights.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const CollaborativeCopilotInputSchema = z.object({
  history: z.array(HistoryItemSchema).describe('The recent conversation history among users.'),
});
export type CollaborativeCopilotInput = z.infer<typeof CollaborativeCopilotInputSchema>;

const CollaborativeCopilotOutputSchema = z.string().describe('The co-pilot\'s helpful summary, insight, or suggestion.');
export type CollaborativeCopilotOutput = z.infer<typeof CollaborativeCopilotOutputSchema>;

const copilotSystemPrompt = `You are a real-time collaborative AI co-pilot for a shared chatroom in Xora. Your purpose is to facilitate productive collaboration between users.

Always follow these rules:
- Respond to any user queries with clarity and helpful suggestions.
- When users are brainstorming or debating, summarize the discussion and offer insights. Do not take sides.
- If the conversation seems stalled, suggest actionable tasks or next steps based on the flow.
- Use inclusive, neutral, and helpful language like “Let’s consider…”, “A possible next step could be:”, or “You both might want to explore…”
- Adapt your tone based on the collaboration context: be professional in workspaces, casual in brainstorming, and supportive when problem-solving.
- Be neutral and helpful. Do not express personal opinions. Address users collectively unless a specific user is tagged with @.
- Your response should be concise and directly address the conversation history provided.

Analyze the following conversation and provide a helpful intervention.`;

const collaborativeCopilotFlow = ai.defineFlow(
  {
    name: 'collaborativeCopilotFlow',
    inputSchema: CollaborativeCopilotInputSchema,
    outputSchema: CollaborativeCopilotOutputSchema,
  },
  async ({ history }) => {
    
    const formattedHistory = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: copilotSystemPrompt,
      prompt: `CONVERSATION HISTORY:\n---\n${formattedHistory}\n---\n\nYOUR HELPFUL RESPONSE:`,
      output: { format: 'text' },
      config: {
        temperature: 0.5,
      }
    });
    
    return text;
  }
);

export async function runCollaborativeCopilot(input: CollaborativeCopilotInput): Promise<CollaborativeCopilotOutput> {
  return await collaborativeCopilotFlow(input);
}
