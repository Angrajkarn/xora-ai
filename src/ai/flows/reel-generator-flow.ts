
'use server';

/**
 * @fileOverview A flow for automatically generating a short-form video reel from a topic.
 * This flow orchestrates script writing, image generation, and voiceover creation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { textToSpeech } from './tts-flow';

// --- INPUT SCHEMA ---
const ReelGeneratorInputSchema = z.object({
  topic: z.string().describe('The topic or idea for the reel.'),
});
export type ReelGeneratorInput = z.infer<typeof ReelGeneratorInputSchema>;


// --- OUTPUT SCHEMA ---
const SceneSchema = z.object({
  scene: z.number().describe('The scene number, starting from 1.'),
  script: z.string().describe('The voiceover script for this scene (1-2 sentences).'),
  imageUrl: z.string().url().describe('The URL of the generated image for this scene.'),
});

const ReelGeneratorOutputSchema = z.object({
  title: z.string().describe('A catchy title for the reel.'),
  scenes: z.array(SceneSchema).describe('An array of scenes with their scripts and image URLs.'),
  audioDataUri: z.string().describe('The data URI of the full voiceover audio file.'),
});
export type ReelGeneratorOutput = z.infer<typeof ReelGeneratorOutputSchema>;


// --- INTERNAL SCHEMAS ---
const InternalSceneScriptSchema = z.object({
  scene: z.number().describe('The scene number, starting from 1.'),
  script: z.string().describe('The voiceover script for this scene (1-2 sentences).'),
  imagePrompt: z.string().describe('A descriptive, photorealistic prompt for a text-to-image model to generate the visual for this scene. The prompt should be concise and focus on creating a visually appealing image.'),
});

const InternalScriptOutputSchema = z.object({
  title: z.string().describe('A catchy title for the reel (max 5 words).'),
  scenes: z.array(InternalSceneScriptSchema).min(3).max(5).describe('An array of 3 to 5 scenes.'),
});


const reelGeneratorFlow = ai.defineFlow(
  {
    name: 'reelGeneratorFlow',
    inputSchema: ReelGeneratorInputSchema,
    outputSchema: ReelGeneratorOutputSchema,
  },
  async ({ topic }) => {
    // 1. Generate the script and image prompts in one go.
    const scriptSystemPrompt = `You are a viral social media video scriptwriter. Your task is to create a short, engaging script for a 30-second reel based on the user's topic. The output must be a valid JSON object.

**Instructions:**
1.  **Title:** Create a short, catchy title for the reel.
2.  **Scenes:** Break the script into 3 to 5 distinct scenes.
3.  **Scene Script:** For each scene, write 1-2 concise sentences for the voiceover. The tone should be engaging and clear.
4.  **Image Prompts:** For each scene, write a high-quality, descriptive text-to-image prompt. The image should be visually stunning and directly relate to the scene's script. Aim for photorealistic or cinematic styles.
5.  **JSON Output:** Your entire response must be a single, valid JSON object that adheres to the provided schema. Do not include any other text.`;

    const { output: scriptOutput } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: scriptSystemPrompt,
      prompt: `Generate a reel script for the topic: "${topic}"`,
      output: { schema: InternalScriptOutputSchema },
      config: { temperature: 0.7 },
    });

    if (!scriptOutput || !scriptOutput.scenes || scriptOutput.scenes.length === 0) {
      throw new Error('Failed to generate a valid script.');
    }

    // 2. Generate voiceover and images in parallel.
    const fullScript = scriptOutput.scenes.map(s => s.script).join(' ');
    
    const ttsPromise = textToSpeech({ text: fullScript, voice: 'Umbriel' });

    const imagePromises = scriptOutput.scenes.map(scene =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Cinematic, high-resolution, viral social media reel still: ${scene.imagePrompt}`,
        config: { responseModalities: ['IMAGE', 'TEXT'] },
      })
    );

    const [ttsResult, ...imageResults] = await Promise.all([ttsPromise, ...imagePromises]);
    
    // 3. Assemble the final output.
    const finalScenes = scriptOutput.scenes.map((scene, index) => {
      const imageUrl = imageResults[index]?.media?.url;
      if (!imageUrl) {
        // Fallback or error handling for a single failed image
        console.warn(`Image generation failed for scene ${scene.scene}. Using placeholder.`);
        return {
          ...scene,
          imageUrl: `https://placehold.co/1080x1920.png`,
        };
      }
      return {
        scene: scene.scene,
        script: scene.script,
        imageUrl,
      };
    });

    return {
      title: scriptOutput.title,
      scenes: finalScenes,
      audioDataUri: ttsResult.media,
    };
  }
);

export async function runReelGeneratorFlow(input: ReelGeneratorInput): Promise<ReelGeneratorOutput> {
  return await reelGeneratorFlow(input);
}
