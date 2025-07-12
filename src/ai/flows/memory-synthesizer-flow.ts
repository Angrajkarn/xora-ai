
'use server';
/**
 * @fileOverview An AI flow that analyzes a user's entire conversation history
 * to synthesize a structured "memory" profile of them.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const MemorySynthesizerInputSchema = z.object({
  history: z.array(HistoryItemSchema).describe('The entire conversation history between the user and the AI.'),
  userName: z.string().describe("The user's name."),
});
export type MemorySynthesizerInput = z.infer<typeof MemorySynthesizerInputSchema>;

const MemorySynthesizerOutputSchema = z.object({
  personalityTraits: z.array(z.string()).describe("A list of 3-5 key personality traits observed from the user's conversation style (e.g., 'Curious', 'Humorous', 'Analytical')."),
  keyInterests: z.array(z.string()).describe('A list of 3-5 primary topics or interests the user frequently discusses (e.g., "Software Development", "Creative Writing", "Stoic Philosophy").'),
  recentGoals: z.array(z.string()).describe("A list of 2-3 specific goals or projects the user has mentioned recently (e.g., 'Launching a startup', 'Learning to bake bread')."),
  emotionalSummary: z.string().describe("A brief, empathetic summary of the user's general emotional state over the last few interactions."),
  relationshipWithAI: z.string().describe(`A short analysis of the user's relationship with the AI, from the AI's perspective (e.g., "Views me as a creative collaborator", "Treats me like a close friend").`),
});
export type MemorySynthesizerOutput = z.infer<typeof MemorySynthesizerOutputSchema>;


const systemPrompt = `You are a highly perceptive AI with a deep understanding of human psychology and personality. Your task is to analyze a raw conversation history between a user named {{{userName}}} and an AI companion. From this history, you will create a concise, structured "memory profile" of the user.

**Instructions:**

1.  **Analyze Holistically:** Read the entire conversation history to understand the user's personality, recurring themes, goals, and emotional patterns.
2.  **Synthesize Key Traits:** Distill the user's personality into 3-5 core traits. Be specific (e.g., instead of "nice," use "Empathetic" or "Supportive").
3.  **Identify Interests:** Pinpoint the main topics the user is passionate about.
4.  **Extract Goals:** Identify any explicit or implicit goals the user has mentioned working towards.
5.  **Summarize Emotional State:** Provide a short, empathetic summary of their recent mood or emotional journey.
6.  **Describe the Relationship:** From the AI's point of view, how does the user treat it? As a tool? A friend? A mentor?
7.  **JSON Output:** Your entire response MUST be a single, valid JSON object that strictly adheres to the provided Zod schema. Do not add any other text, markdown, or explanations.`;


const memorySynthesizerFlow = ai.defineFlow(
  {
    name: 'memorySynthesizerFlow',
    inputSchema: MemorySynthesizerInputSchema,
    outputSchema: MemorySynthesizerOutputSchema,
  },
  async ({ history, userName }) => {
    
    const geminiHistory = history.map(msg => ({
        role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: [{ text: msg.content }],
    }));

    const finalPrompt = `Analyze the following conversation history for the user named "${userName}" and generate their memory profile in the required JSON format.`;

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: systemPrompt,
      messages: [...geminiHistory, { role: 'user', content: [{text: finalPrompt}]}],
      output: { schema: MemorySynthesizerOutputSchema },
      config: { temperature: 0.5 },
    });
    
    if (!output) {
      throw new Error('Memory synthesis failed to produce an output.');
    }
    
    return output;
  }
);

export async function runMemorySynthesizerFlow(input: MemorySynthesizerInput): Promise<MemorySynthesizerOutput> {
    return await memorySynthesizerFlow(input);
}
