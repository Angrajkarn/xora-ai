
'use server';
/**
 * @fileOverview A creative copilot flow for generating images.
 *
 * - runCreativeCopilotFlow - Generates an image based on a prompt and optional sketch.
 * - CreativeCopilotInput - The input type for the flow.
 * - CreativeCopilotOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CreativeCopilotInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the image to be generated.'),
  fileDataUri: z.string().optional().describe("A sketch or image provided by the user as a data URI for image-to-image generation."),
});
export type CreativeCopilotInput = z.infer<typeof CreativeCopilotInputSchema>;

const CreativeCopilotOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
  text: z.string().describe('A brief description of what was generated.'),
});
export type CreativeCopilotOutput = z.infer<typeof CreativeCopilotOutputSchema>;

export async function runCreativeCopilotFlow(input: CreativeCopilotInput): Promise<CreativeCopilotOutput> {
  return creativeCopilotFlow(input);
}

const creativeCopilotFlow = ai.defineFlow(
  {
    name: 'creativeCopilotFlow',
    inputSchema: CreativeCopilotInputSchema,
    outputSchema: CreativeCopilotOutputSchema,
  },
  async ({prompt, fileDataUri}) => {
    
    const generationPrompt: any[] = [{text: `Generate an image based on this prompt: "${prompt}"`}];
    if (fileDataUri) {
        generationPrompt.unshift({media: {url: fileDataUri}});
        generationPrompt.push({text: "\n\nUse the provided image as a strong reference or sketch to create the new image."});
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: generationPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {
      imageUrl: media.url,
      text: `Here is the image I generated for you.`,
    };
  }
);
