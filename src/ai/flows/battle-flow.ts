
'use server';
/**
 * @fileOverview An AI flow that pits two AI models against each other for a given prompt.
 *
 * - runBattleFlow - A function that handles the AI battle process.
 * - BattleFlowInput - The input type for the runBattleFlow function.
 * - BattleFlowOutput - The return type for the runBattleFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MODELS } from '@/lib/constants';

const BattleFlowInputSchema = z.object({
  prompt: z.string(),
  modelAId: z.string(),
  modelBId: z.string(),
});
export type BattleFlowInput = z.infer<typeof BattleFlowInputSchema>;

const BattleFlowOutputSchema = z.object({
  responseA: z.string(),
  responseB: z.string(),
});
export type BattleFlowOutput = z.infer<typeof BattleFlowOutputSchema>;

const battleFlow = ai.defineFlow(
  {
    name: 'battleFlow',
    inputSchema: BattleFlowInputSchema,
    outputSchema: BattleFlowOutputSchema,
  },
  async ({ prompt, modelAId, modelBId }) => {
    const modelA = MODELS.find(m => m.id === modelAId);
    const modelB = MODELS.find(m => m.id === modelBId);

    if (!modelA || !modelB) {
      throw new Error('One or both selected models are invalid.');
    }

    const [resultA, resultB] = await Promise.all([
      ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        system: modelA.persona,
        prompt: prompt,
        output: { format: 'text' },
      }),
      ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        system: modelB.persona,
        prompt: prompt,
        output: { format: 'text' },
      })
    ]);

    return {
      responseA: resultA.text,
      responseB: resultB.text,
    };
  }
);

export async function runBattleFlow(input: BattleFlowInput): Promise<BattleFlowOutput> {
  return await battleFlow(input);
}
