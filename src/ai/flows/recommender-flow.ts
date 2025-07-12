
'use server';

/**
 * @fileOverview An AI flow that generates a personalized re-engagement push notification.
 * 
 * - runRecommenderFlow - Generates a push notification.
 * - RecommenderInput - The input type for the flow.
 * - RecommenderOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RecommenderInputSchema = z.object({
  userName: z.string().describe("The user's name. Can be a placeholder like 'there' if unknown."),
  chatTopics: z.array(z.string()).describe('A list of topics from the user\'s recent chat history.'),
});
export type RecommenderInput = z.infer<typeof RecommenderInputSchema>;

const RecommenderOutputSchema = z.object({
  title: z.string().describe('The short, catchy title for the push notification (e.g., "Ready for another great idea? ✨").'),
  body: z.string().describe('The personalized body of the push notification, mentioning a past topic to entice the user back.'),
});
export type RecommenderOutput = z.infer<typeof RecommenderOutputSchema>;


const recommenderSystemPrompt = `You are an expert marketing and user engagement specialist for an AI application called Xora.
Your goal is to write a friendly, concise, and compelling push notification to re-engage a user who hasn't used the app in a while.

**Instructions:**
1.  **Analyze User History:** Look at the user's past chat topics. Pick one interesting topic to mention in the notification.
2.  **Personalize:** Address the user by their name if provided.
3.  **Be Enticing:** Your message should be warm and make the user curious to return to the app. Don't sound demanding.
4.  **Keep it Short:** Push notifications have limited space. The title should be short and the body should be one or two sentences.
5.  **Output JSON:** Your final output must be a JSON object adhering to the specified schema.

**Example Input:**
{
  "userName": "Alex",
  "chatTopics": ["Plan a 5-day budget trip to Goa", "Write a python script", "Explain quantum computing"]
}

**Example Output:**
{
  "title": "Thinking about Goa, Alex? 🌴",
  "body": "Your next big idea is waiting. Let's continue planning your trip or explore something new on Xora!"
}
`;

const recommenderFlow = ai.defineFlow({
  name: 'recommenderFlow',
  inputSchema: RecommenderInputSchema,
  outputSchema: RecommenderOutputSchema,
}, async ({ userName, chatTopics }) => {
    
  const topicsString = chatTopics.slice(0, 5).join(', '); // Use up to 5 topics for context
    
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    system: recommenderSystemPrompt,
    prompt: `Generate a push notification for user '${userName}' who was interested in: "${topicsString}".`,
    output: { schema: RecommenderOutputSchema },
    config: {
        temperature: 0.8,
    }
  });
  if (!output) {
      throw new Error("Recommender flow failed to generate a response.");
  }
  return output;
});

export async function runRecommenderFlow(input: RecommenderInput): Promise<RecommenderOutput> {
  return await recommenderFlow(input);
}
