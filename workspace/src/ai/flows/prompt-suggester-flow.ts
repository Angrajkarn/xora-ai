
'use server';
/**
 * @fileOverview An AI flow that generates personalized prompt suggestions.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as LucideIcons from 'lucide-react';

const PromptSuggestionInputSchema = z.object({
  chatTopics: z.array(z.string()).describe('A list of the user\'s recent chat topics to base suggestions on. Can be empty for new users.'),
});
export type PromptSuggestionInput = z.infer<typeof PromptSuggestionInputSchema>;

const SuggestionSchema = z.object({
  text: z.string().describe('The suggested prompt text. Should be concise and actionable.'),
  icon: z.string().describe("A relevant icon name in PascalCase from the lucide-react library (e.g., 'PenLine', 'BarChart3', 'Lightbulb')."),
});

const PromptSuggestionOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).length(4).describe('An array of exactly 4 prompt suggestions.'),
});
export type PromptSuggestionOutput = z.infer<typeof PromptSuggestionOutputSchema>;


const systemPrompt = `You are a creative AI assistant that helps users discover what they can do. Your task is to generate 4 inspiring and diverse prompt suggestions.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze User History:** If a list of recent chat topics is provided, generate follow-up prompts that are topically related but explore new angles. The suggestions should feel like a natural next step.
2.  **Handle New Users:** If the list of chat topics is empty, generate 4 high-quality, general-purpose starter prompts. These should cover a diverse range of use cases: one creative (e.g., PenLine, Clapperboard), one technical (e.g., Code, Terminal), one analytical/business (e.g., Lightbulb, BarChart3), and one fun/personal (e.g., Heart, Map).
3.  **Actionable & Specific:** Prompts should be specific and ready-to-use. Avoid generic prompts like "Write a story." Instead, use "Write a short story about a detective who lives on a space station."
4.  **Icon Selection:** For each prompt, you MUST select a relevant and appropriate icon name from the lucide-react library, in PascalCase format (e.g., 'PenLine', 'Lightbulb'). Do not invent icon names.
5.  **Tone & Content:** Keep suggestions professional, creative, or educational. Strictly avoid generating overly personal, romantic, or relationship-focused prompts (e.g., about girlfriends, boyfriends, partners).
6.  **JSON Output:** Your entire response must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any other text, markdown, or explanations.`;

const promptSuggestionFlow = ai.defineFlow(
  {
    name: 'promptSuggestionFlow',
    inputSchema: PromptSuggestionInputSchema,
    outputSchema: PromptSuggestionOutputSchema,
  },
  async ({ chatTopics }) => {
    
    let prompt;
    if (chatTopics.length > 0) {
      prompt = `Generate 4 personalized prompt suggestions based on these recent chat topics: ${chatTopics.join(', ')}.`;
    } else {
      prompt = 'Generate 4 diverse, high-quality starter prompts for a new user.';
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: systemPrompt,
      prompt: prompt,
      output: { schema: PromptSuggestionOutputSchema },
      config: { temperature: 0.8 },
    });
    
    if (!output) {
      throw new Error('Prompt suggestion generation failed.');
    }
    
    // Validate the icon names from the AI and fallback to a default if needed
    const validIconKeys = Object.keys(LucideIcons);
    const validatedSuggestions = output.suggestions.map(suggestion => {
        // A simple check to see if the key exists in the lucide-react exports
        const isValidIcon = validIconKeys.includes(suggestion.icon);
        return {
            ...suggestion,
            icon: isValidIcon ? suggestion.icon : 'Sparkles', // Fallback to a default icon
        };
    });

    return {
      suggestions: validatedSuggestions,
    };
  }
);

export async function runPromptSuggestionFlow(input: PromptSuggestionInput): Promise<PromptSuggestionOutput> {
    return await promptSuggestionFlow(input);
}
