
'use server';
/**
 * @fileOverview A flow for converting text to speech.
 *
 * - textToSpeech - A function that takes text and returns audio data.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("The audio data as a base64-encoded WAV data URI."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

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

const VALID_VOICES = [
    'achernar', 'achird', 'algenib', 'algieba', 'alnilam', 'aoede', 'autonoe', 
    'callirrhoe', 'charon', 'despina', 'enceladus', 'erinome', 'fenrir', 
    'gacrux', 'iapetus', 'kore', 'laomedeia', 'leda', 'orus', 'puck', 
    'pulcherrima', 'rasalgethi', 'sadachbia', 'sadaltager', 'schedar', 
    'sulafat', 'umbriel', 'vindemiatrix', 'zephyr', 'zubenelgenubi'
];


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (query) => {
    let voiceName = query.voice || 'Algenib';
    // Validate the voice name provided by the user. Fallback to a default if it's invalid.
    if (voiceName.toLowerCase() !== 'custom' && !VALID_VOICES.includes(voiceName.toLowerCase())) {
        console.warn(`Invalid voice name '${query.voice}' provided. Falling back to default 'Algenib'.`);
        voiceName = 'Algenib';
    }

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // If custom voice is selected, use a high-quality pre-built voice as a placeholder.
            // In a real implementation with voice cloning, you would pass the custom voice ID here.
            prebuiltVoiceConfig: { voiceName: voiceName === 'Custom' ? 'Umbriel' : voiceName },
          },
        },
      },
      prompt: query.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    return await textToSpeechFlow(input);
}
