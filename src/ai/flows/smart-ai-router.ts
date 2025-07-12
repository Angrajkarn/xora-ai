
'use server';

/**
 * @fileOverview An AI chat flow that routes prompts to specified AI models and summarizes the results.
 * It can also handle file and URL context for analysis.
 *
 * - smartAIRouter - A function that handles the chat process.
 * - SmartAIRouterInput - The input type for the smartAIRouter function.
 * - SmartAIRouterOutput - The return type for the smartAIRouter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MODELS} from '@/lib/constants';
import { fetchUrlTool } from '@/ai/tools/fetch-url-tool';
import { runProductivityAssistantFlow } from './productivity-assistant-flow';
import { runCreativeCopilotFlow } from './creative-copilot-flow';
import { generateChartTool } from '../tools/chart-generator-tool';
import type { ChartData } from '@/lib/types';
import { ChartDataSchema } from '../schemas/chart-data-schema';
import { findFlights, findHotels } from '../tools/travel-tools';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  authorName: z.string().optional(),
});

const CustomPersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string(),
});


const SmartAIRouterInputSchema = z.object({
  prompt: z.string(),
  history: z.array(HistoryItemSchema).optional().describe('The conversation history.'),
  modelIds: z.array(z.string()).describe('An array of model IDs to query. If empty, a default set of models will be queried.'),
  customPersonas: z.array(CustomPersonaSchema).optional().describe('An array of custom-defined AI personas.'),
  fileDataUri: z.string().optional().describe("A file provided by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  fileType: z.string().optional().describe('The MIME type of the provided file (e.g., "text/csv", "image/png").'),
  url: z.string().url().optional().describe('A URL provided by the user for analysis.'),
});
export type SmartAIRouterInput = z.infer<typeof SmartAIRouterInputSchema>;

const SmartAIRouterOutputSchema = z.object({
  responses: z.array(
    z.object({
      modelId: z.string(),
      content: z.string(),
      imageUrl: z.string().optional(),
      chartData: ChartDataSchema.optional(),
      audioDataUri: z.string().optional(),
    })
  ),
  summary: z.string().optional(),
  detectedLanguage: z.string().optional(),
});
export type SmartAIRouterOutput = z.infer<typeof SmartAIRouterOutputSchema>;

const MultiModelResponseSchema = z.object({
    responses: z.array(
      z.object({
        modelId: z.string().describe("The ID of the model being simulated, e.g., 'chat-gpt', 'gemini'."),
        content: z.string().describe("The generated response content for this model."),
      })
    )
});


const chatFlow = ai.defineFlow(
  {
    name: 'smartAIRouterFlow',
    inputSchema: SmartAIRouterInputSchema,
    outputSchema: SmartAIRouterOutputSchema,
  },
  async ({prompt, history, modelIds, customPersonas, fileDataUri, fileType, url}) => {

    // Handle Productivity Assistant separately as it uses tools.
    if (modelIds.length === 1 && modelIds[0] === 'productivity-assistant') {
        if (fileDataUri || url) {
            return {
                responses: [{
                    modelId: 'productivity-assistant',
                    content: "Sorry, the Productivity Assistant doesn't support file or URL analysis at the moment. Please remove the attachment to continue.",
                }]
            };
        }

        const assistantResponse = await runProductivityAssistantFlow({ prompt });
        return {
            responses: [{
                modelId: 'productivity-assistant',
                content: assistantResponse,
            }],
        };
    }
    
    // Handle Creative Copilot separately as it generates images
    if (modelIds.length === 1 && modelIds[0] === 'creative-copilot') {
        if (url) {
             return {
                responses: [{
                    modelId: 'creative-copilot',
                    content: "Sorry, the Creative Copilot doesn't support URL analysis at the moment. Please provide a text prompt or upload a sketch.",
                }]
            };
        }
        const creativeResult = await runCreativeCopilotFlow({ prompt, fileDataUri });
        return {
            responses: [{
                modelId: 'creative-copilot',
                content: creativeResult.text,
                imageUrl: creativeResult.imageUrl,
            }],
        };
    }
    
    // Language Detection
    const { text: detectedLanguage } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: `Detect the language of the following text and respond with only the language name (e.g., "English", "Spanish", "Hindi"). Do not add any other text or punctuation. Text: "${prompt}"`,
    });
    
    const geminiHistory = history?.map(msg => ({
        role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: [{ text: msg.content }],
    })) || [];
    
    // Handle any single, standard persona-based model directly for reliability and simplicity.
    const singleModelId = modelIds.length === 1 ? modelIds[0] : undefined;
    const singleModel = singleModelId 
      ? MODELS.find(m => m.id === singleModelId && m.persona && !['grok', 'productivity-assistant', 'creative-copilot', 'xora'].includes(m.id)) 
      : undefined;

    if (singleModel) {
        let systemPrompt = `${singleModel.persona}\n\nIMPORTANT: The user is communicating in ${detectedLanguage}. You MUST respond in ${detectedLanguage}.`;
        
        let promptParts: any[] = [{ text: prompt }];
        
        const tools: any[] = [fetchUrlTool];
        if (singleModel.id === 'travel-planner-ai') {
            tools.push(findFlights, findHotels);
        }
        
        let fileContext = '';
        if(fileType === 'text/csv') {
            fileContext = `The user has uploaded a CSV file. Use the 'generateChart' tool to analyze it if they ask for a visualization.`;
            tools.push(generateChartTool);
        } else if (fileDataUri) {
            promptParts.push({ media: { url: fileDataUri } });
            fileContext = `Use the attached file as context.`
        }

        if (url) {
          promptParts.unshift({text: `Use the content from the following URL as context: ${url}`});
        }
        if(fileContext) {
          promptParts.unshift({text: fileContext});
        }
        
        const { text, output, toolRequests } = await ai.generate({
            model: 'googleai/gemini-1.5-pro-latest',
            system: systemPrompt,
            prompt: promptParts,
            history: geminiHistory,
            tools: tools,
            output: { format: 'text' },
        });

        const chartData = toolRequests.find(r => r.tool.name === 'generateChart')?.output as ChartData | undefined;

        return {
            responses: [{ 
                modelId: singleModel.id, 
                content: text,
                chartData,
            }],
            detectedLanguage
        };
    }

    const queryIds = modelIds.length > 0 && !modelIds.includes('smart-ai')
      ? modelIds 
      : ['chat-gpt', 'gemini', 'claude'];
    
    const modelsToQuery = MODELS.filter(m => queryIds.includes(m.id) && !['smart-ai', 'xora'].includes(m.id));

    if (modelsToQuery.length === 0) {
        return { responses: [] };
    }
    
    const grokModel = modelsToQuery.find(m => m.id === 'grok');
    const otherModels = modelsToQuery.filter(m => m.id !== 'grok');
    
    const promises: Promise<{ modelId: string; content: string } | { modelId: string; content: string }[]>[] = [];

    // Grok Promise
    if (grokModel) {
        promises.push((async () => {
            const grokApiKey = process.env.GROK_API_KEY;
            if (!grokApiKey) return { modelId: 'grok', content: 'Error: GROK_API_KEY is not configured.' };
            if (fileDataUri || url) return { modelId: 'grok', content: 'Error: Grok does not support file/URL analysis.' };
            try {
                const res = await fetch('https://api.x.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${grokApiKey}` },
                    body: JSON.stringify({
                        model: 'grok-1',
                        messages: [
                            { role: 'system', content: `Respond in ${detectedLanguage}.` },
                            ...(history || []).map(m => ({role: m.role, content: m.content})),
                            { role: 'user', content: prompt }
                        ],
                    })
                });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                return { modelId: 'grok', content: data.choices[0].message.content };
            } catch (err: any) {
                return { modelId: 'grok', content: `Error: ${err.message || 'Could not get response.'}` };
            }
        })());
    }

    // Other Standard Models Promise
    if (otherModels.length > 0) {
        promises.push((async () => {
            try {
                const personas = otherModels.map(m => `- ${m.name} (id: ${m.id}): ${(m as any).persona}`).join('\n');
                let contextForPrompt = fileDataUri ? '\nAn external file has been provided.' : '';
                if (url) contextForPrompt += `\nA URL (${url}) has been provided. Use 'fetchUrlContent' to retrieve its content.`;
                
                const multiModelPrompt = `You are a sophisticated AI simulation engine. Generate responses for the prompt as if you were different AI models. Your responses MUST be in JSON format.
**IMPORTANT: Respond in ${detectedLanguage}.**
User Prompt: "${prompt}"${contextForPrompt}
Personas to simulate:
${personas}
Your output MUST be a valid JSON object adhering to this Zod schema:
\`\`\`json
{
  "responses": [ { "modelId": "...", "content": "..." } ]
}
\`\`\`
Do not add any extra commentary.`;

                const generateParams: any = {
                    model: 'googleai/gemini-1.5-flash-latest', prompt: multiModelPrompt,
                    output: { schema: MultiModelResponseSchema }, history: geminiHistory, tools: [fetchUrlTool],
                };
                if (fileDataUri) generateParams.prompt = [{text: multiModelPrompt}, {media: {url: fileDataUri}}];
                
                const { output } = await ai.generate(generateParams);
                return output?.responses || [];
            } catch (err) {
                return otherModels.map(m => ({ modelId: m.id, content: `Error getting response for ${m.name}.`}));
            }
        })());
    }


    const allResults = await Promise.all(promises);
    const allResponses = allResults.flat();
    
    const finalQueryIds = [...queryIds];
    const responseMap = new Map(allResponses.map(r => [r.modelId, r]));
    const sortedResponses = finalQueryIds.map(id => responseMap.get(id)).filter(Boolean) as { modelId: string, content: string }[];

    let summary: string | undefined = undefined;
    if (sortedResponses.filter(r => !r.content.startsWith('Error:')).length > 1) {
        const summaryPrompt = `You are Xora, a smart AI aggregator. Synthesize the following responses into a single, cohesive answer.
Prompt: "${prompt}".
**IMPORTANT: Your summary MUST be in ${detectedLanguage}.**
${sortedResponses.map(r => {
    const modelName = MODELS.find(m => m.id === r.modelId)?.name || r.modelId;
    return `Response from ${modelName}:\n${r.content}`
}).join('\n\n')}
Your task is to provide a "smart summary" that captures the best points. Do not list the individual responses again.`;

        const { text: summaryText } = await ai.generate({ model: 'googleai/gemini-1.5-flash-latest', prompt: summaryPrompt });
        summary = summaryText;
    }

    return { responses: sortedResponses, summary, detectedLanguage };
  }
);

export async function smartAIRouter(input: SmartAIRouterInput): Promise<SmartAIRouterOutput> {
  return await chatFlow(input);
}
