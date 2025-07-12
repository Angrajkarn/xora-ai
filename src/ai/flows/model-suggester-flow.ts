
'use server';

/**
 * @fileOverview An AI flow that suggests the best model for a given prompt.
 * 
 * - runModelSuggester - A function that handles the model suggestion process.
 * - ModelSuggesterInput - The input type for the runModelSuggester function.
 * - ModelSuggesterOutput - The return type for the runModelSuggester function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MODELS } from '@/lib/constants';

const ModelSuggesterInputSchema = z.object({
  prompt: z.string(),
});
export type ModelSuggesterInput = z.infer<typeof ModelSuggesterInputSchema>;

const ModelSuggesterOutputSchema = z.object({
  suggestedModelId: z.string().describe('The ID of the suggested model (e.g., chat-gpt, gemini, aihub).'),
  reason: z.string().describe('A very brief explanation for why this model was suggested.'),
});
export type ModelSuggesterOutput = z.infer<typeof ModelSuggesterOutputSchema>;

const modelDescriptions = MODELS.map(m => `* **${m.name} (id: ${m.id})**: ${m.description} Best for: ${m.persona}`).join('\n');

const suggesterSystemPrompt = `You are an expert AI model router. Your job is to analyze a user's prompt and suggest the best AI model to handle it based on the available models and their strengths.

Your response MUST be a valid JSON object adhering to the specified schema. Only output the JSON.

**Available Models:**
${modelDescriptions}

**Analysis Instructions:**
1. Read the user's prompt carefully.
2. Identify the core intent (e.g., coding, creative writing, factual question, conversation, task management, health query, travel planning).
3. Compare the intent against the strengths of the available models.
4. Select the single best model ID.
5. Provide a very short, user-facing reason for your choice (max 5 words).

**Examples:**
User Prompt: "Write a python script to parse a CSV file"
Your JSON output: { "suggestedModelId": "blackbox", "reason": "Best for code generation." }

User Prompt: "I'm feeling a bit down today, can we talk?"
Your JSON output: { "suggestedModelId": "therapist", "reason": "For empathetic conversation." }

User Prompt: "remind me to call the dentist tomorrow at 10am"
Your JSON output: { "suggestedModelId": "productivity-assistant", "reason": "For managing tasks & reminders." }

User Prompt: "I want to be more productive and stop procrastinating"
Your JSON output: { "suggestedModelId": "motivator", "reason": "For a motivational boost." }

User Prompt: "How do I structure a pitch deck for a seed funding round?"
Your JSON output: { "suggestedModelId": "career-coach", "reason": "For startup and career advice." }

User Prompt: "Find an error in this C# code snippet."
Your JSON output: { "suggestedModelId": "developer-helper", "reason": "For debugging code." }

User Prompt: "Plan a 5-day budget trip to Goa."
Your JSON output: { "suggestedModelId": "travel-planner-ai", "reason": "For detailed travel planning." }

User Prompt: "What are the legal implications of a non-disclosure agreement?"
Your JSON output: { "suggestedModelId": "lawyer", "reason": "For legal information." }

User Prompt: "What should I post for Diwali?"
Your JSON output: { "suggestedModelId": "indian-cultural-assistant", "reason": "For culturally relevant content." }

User Prompt: "Can you give me feedback on this UI mockup?"
Your JSON output: { "suggestedModelId": "designer", "reason": "For design feedback." }

User Prompt: "Explain photosynthesis to a 10 year old."
Your JSON output: { "suggestedModelId": "teacher", "reason": "For educational explanations." }
`;

const modelSuggesterFlow = ai.defineFlow({
  name: 'modelSuggesterFlow',
  inputSchema: ModelSuggesterInputSchema,
  outputSchema: ModelSuggesterOutputSchema,
}, async ({ prompt }) => {
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    system: suggesterSystemPrompt,
    prompt: `User Prompt: "${prompt}"`,
    output: { schema: ModelSuggesterOutputSchema },
    config: {
        temperature: 0.1,
    }
  });
  if (!output) {
      throw new Error("Model suggester failed to generate a response.");
  }
  return output;
});

export async function runModelSuggester(input: ModelSuggesterInput): Promise<ModelSuggesterOutput> {
  return modelSuggesterFlow(input);
}
