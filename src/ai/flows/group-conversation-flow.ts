
'use server';
/**
 * @fileOverview A flow for orchestrating an interactive, multi-persona group conversation.
 * This flow acts as a "moderator" AI, generating the next turn(s) in a conversation
 * based on the full chat history and the personas involved.
 * It also generates a multi-speaker audio file for the conversation.
 *
 * - runInteractiveGroupChat - A function that orchestrates the group chat interaction.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import wav from 'wav';
import { MODELS, VOICES } from '@/lib/constants';

// --- Helper Functions ---
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Assigns a voice to a speaker, prioritizing pre-defined voices.
const getVoiceForSpeaker = (speakerName: string, allPersonasInChat: { id: string; name: string }[]): string => {
    const persona = allPersonasInChat.find(p => p.name === speakerName);
    const model = MODELS.find(m => m.id === persona?.id);

    // 1. Prioritize pre-defined voice in constants
    if (model && model.voice) {
        return model.voice;
    }

    // 2. Fallback to hashing to ensure unique voices for other personas
    let hash = 0;
    for (let i = 0; i < speakerName.length; i++) {
        const char = speakerName.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    const availableVoices = VOICES.map(v => v.id);
    
    // Ensure we don't use voices already assigned by other personas in this chat
    const assignedVoices = allPersonasInChat
        .map(p => MODELS.find(m => m.id === p.id)?.voice)
        .filter((v): v is string => !!v);

    const unassignedVoices = availableVoices.filter(v => !assignedVoices.includes(v));

    const finalVoicePool = unassignedVoices.length > 0 ? unassignedVoices : availableVoices;
    
    const index = Math.abs(hash) % finalVoicePool.length;
    return finalVoicePool[index];
};


// --- Schemas ---

const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string(),
});

const HistoryItemSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    authorName: z.string(),
});

const InteractiveGroupChatInputSchema = z.object({
  newMessage: z.string().describe("The latest message from the user."),
  history: z.array(HistoryItemSchema).describe('The full conversation history, including previous user and AI messages.'),
  personas: z.array(PersonaSchema).describe('The AI personas participating in the conversation.'),
});
export type InteractiveGroupChatInput = z.infer<typeof InteractiveGroupChatInputSchema>;


const AIResponseSchema = z.object({
    speaker: z.string().describe("The name of the AI persona who is speaking."),
    content: z.string().describe("The content of the AI's message."),
});

const InteractiveGroupChatOutputSchema = z.object({
  responses: z.array(AIResponseSchema).describe("An array of one or more AI responses to continue the conversation."),
  audioDataUri: z.string().describe("The data URI of the full multi-speaker voiceover audio file."),
  transcript: z.string().describe("The full text transcript of the AI responses."),
});
export type InteractiveGroupChatOutput = z.infer<typeof InteractiveGroupChatOutputSchema>;


// --- The Flow ---

const groupChatFlow = ai.defineFlow(
  {
    name: 'interactiveGroupChatFlow',
    inputSchema: InteractiveGroupChatInputSchema,
    outputSchema: InteractiveGroupChatOutputSchema,
  },
  async ({ newMessage, history, personas }) => {

    const personaDescriptions = personas.map(p => `- ${p.name}: ${p.instructions}`).join('\n');

    const historyLog = history.map(h => `${h.authorName}: ${h.content}`).join('\n');
    
    const systemPrompt = `You are a master debate moderator and scriptwriter AI. Your task is to orchestrate a natural, flowing group chat between a human user and multiple AI personas.

**Core Directives:**

1.  **Analyze Full Context:** Read the entire 'Conversation History' and the 'Latest User Message' to understand the current state of the discussion.
2.  **Generate Next Turn(s):** Your job is to generate the immediate next one or more messages from the AI personas. The conversation should feel real-time.
3.  **Embody Personas:** Each AI persona MUST speak in character based on their provided instructions. Their responses should be shaped by their unique personality and expertise.
4.  **Enable AI-to-AI Interaction:** This is critical. Personas should directly respond to points made by OTHER personas in the preceding turns, not just the user. Use phrases like "That's a good point, [Persona Name], but have you considered..." or "I disagree with [Persona Name] on that because...".
5.  **Handle @mentions:**
    *   If the user (or another AI) tags a specific persona (e.g., "@Strategist"), that persona should be the primary respondent.
    *   However, other personas are allowed to interject with a relevant comment if it adds value.
6.  **Natural Conversation Flow:**
    *   Not every persona needs to speak on every turn.
    *   Sometimes only one AI will respond. Other times, a quick back-and-forth between two or three AIs is appropriate.
    *   Keep responses relatively concise to mimic a real chat.
7.  **JSON Output:** Your response MUST be a single, valid JSON object that strictly adheres to the provided schema. The 'responses' array should contain the next messages in the conversation. Do not add any other text, titles, or summaries.

**AI Personas in this chat:**
${personaDescriptions}
`;

    const fullPrompt = `**Conversation History:**
"""
${historyLog}
"""

**Latest User Message:**
"User: ${newMessage}"

Based on ALL the above, generate the next JSON response for the conversation.`;

    // We only want the text responses from this model.
    const TextResponseSchema = z.object({
        responses: z.array(AIResponseSchema),
    });

    const { output: textResponses } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: systemPrompt,
      prompt: fullPrompt,
      output: { schema: TextResponseSchema },
      config: { temperature: 0.8 },
    });

    if (!textResponses || !textResponses.responses || textResponses.responses.length === 0) {
      throw new Error('Failed to generate a valid group chat text response.');
    }
    
    const transcript = textResponses.responses.map(res => `${res.speaker}: ${res.content}`).join('\n');
    
    // Create a unique list of speakers from the response
    const speakers = [...new Set(textResponses.responses.map(res => res.speaker))];

    // Create the TTS configuration with intelligent voice assignment
    const speakerVoiceConfigs = speakers.map((speaker, index) => ({
        speaker: `Speaker${index + 1}`, // TTS model expects "Speaker1", "Speaker2", etc.
        voiceConfig: {
            prebuiltVoiceConfig: { voiceName: getVoiceForSpeaker(speaker, personas) },
        },
    }));

    // Map the transcript to the numbered speakers
    const ttsPrompt = textResponses.responses.map(res => {
        const speakerIndex = speakers.indexOf(res.speaker);
        return `Speaker${speakerIndex + 1}: ${res.content}`;
    }).join('\n');

    // Generate multi-speaker audio
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: { speakerVoiceConfigs },
        },
      },
      prompt: ttsPrompt,
    });

    if (!media) {
      throw new Error('no media returned from TTS');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
        responses: textResponses.responses,
        audioDataUri: audioDataUri,
        transcript: transcript,
    };
  }
);


export async function runInteractiveGroupChat(input: InteractiveGroupChatInput): Promise<InteractiveGroupChatOutput> {
  return await groupChatFlow(input);
}
