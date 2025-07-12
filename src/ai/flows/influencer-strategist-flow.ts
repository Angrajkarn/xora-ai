
'use server';
/**
 * @fileOverview An AI flow for generating a 7-day social media content plan.
 * This flow creates a strategy, writes captions, and generates images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- INPUT SCHEMA ---
const InfluencerStrategistInputSchema = z.object({
  topic: z.string().describe('The brand, product, or topic for the content plan.'),
});
export type InfluencerStrategistInput = z.infer<typeof InfluencerStrategistInputSchema>;

// --- OUTPUT SCHEMA ---
const DayPlanSchema = z.object({
  day: z.string().describe('The day of the week (e.g., Monday).'),
  theme: z.string().describe('The content theme for the day (e.g., Motivational Monday).'),
  caption: z.string().describe('The full social media caption for the post.'),
  hashtags: z.string().describe('A string of relevant hashtags, starting with #.'),
  imageUrl: z.string().url().describe('The URL of the generated image for this post.'),
});

const InfluencerStrategistOutputSchema = z.object({
  strategyTitle: z.string().describe('A catchy title for the overall 7-day strategy.'),
  plan: z.array(DayPlanSchema),
});
export type InfluencerStrategistOutput = z.infer<typeof InfluencerStrategistOutputSchema>;

// --- INTERNAL SCHEMA ---
const InternalDayPlanSchema = z.object({
  day: z.string(),
  theme: z.string(),
  caption: z.string(),
  hashtags: z.string(),
  imagePrompt: z.string().describe('A detailed, visually rich prompt for an image generation model, tailored to the caption and theme.'),
});

const InternalStrategySchema = z.object({
    strategyTitle: z.string(),
    weeklyPlan: z.array(InternalDayPlanSchema).length(7),
});

const influencerStrategistFlow = ai.defineFlow(
  {
    name: 'influencerStrategistFlow',
    inputSchema: InfluencerStrategistInputSchema,
    outputSchema: InfluencerStrategistOutputSchema,
  },
  async ({ topic }) => {
    // 1. Generate the 7-day strategy, captions, and image prompts.
    const strategySystemPrompt = `You are a world-class social media marketing strategist. Your task is to create a complete, 7-day content plan for a given topic. The output must be a valid JSON object.

**Instructions:**
1.  **Strategy Title:** Create a short, catchy title for the overall content strategy.
2.  **Daily Plan:** Generate a plan for 7 days, from Monday to Sunday.
3.  **Daily Theme:** Assign a creative theme for each day (e.g., "Myth-Busting Monday," "Wellness Wednesday," "Feature Friday").
4.  **Engaging Captions:** Write a compelling, engaging social media caption for each day that fits the theme.
5.  **Hashtags:** Provide a set of 3-5 relevant, popular hashtags for each post.
6.  **Detailed Image Prompts:** For each day, create a highly descriptive, visually stunning prompt for a text-to-image model. The prompt should capture the essence of the day's theme and caption, aiming for a photorealistic or cinematic style.
7.  **JSON Output:** Your entire response MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any other text or explanations.`;

    const { output: strategyOutput } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: strategySystemPrompt,
      prompt: `Generate a 7-day content plan for the topic: "${topic}"`,
      output: { schema: InternalStrategySchema },
      config: { temperature: 0.8 },
    });

    if (!strategyOutput || !strategyOutput.weeklyPlan || strategyOutput.weeklyPlan.length !== 7) {
      throw new Error('Failed to generate a valid 7-day strategy.');
    }
    
    // 2. Generate all images in parallel.
    const imagePromises = strategyOutput.weeklyPlan.map(dayPlan =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Social media post, cinematic, high-resolution, photorealistic: ${dayPlan.imagePrompt}`,
        config: { responseModalities: ['IMAGE', 'TEXT'] },
      })
    );
    
    const imageResults = await Promise.all(imagePromises);

    // 3. Assemble the final output.
    const finalPlan = strategyOutput.weeklyPlan.map((dayPlan, index) => {
        const imageUrl = imageResults[index]?.media?.url;
        if (!imageUrl) {
            console.warn(`Image generation failed for ${dayPlan.day}. Using placeholder.`);
            return {
                ...dayPlan,
                imageUrl: `https://placehold.co/1080x1080.png`,
            };
        }
        return {
            ...dayPlan,
            imageUrl,
        }
    });
    
    return {
      strategyTitle: strategyOutput.strategyTitle,
      plan: finalPlan,
    };
  }
);

export async function runInfluencerStrategistFlow(input: InfluencerStrategistInput): Promise<InfluencerStrategistOutput> {
  return await influencerStrategistFlow(input);
}
