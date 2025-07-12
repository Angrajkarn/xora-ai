import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Prevent multiple instances of Genkit in development due to hot-reloading.
declare global {
  // eslint-disable-next-line no-var
  var __genkit_ai: Genkit | undefined;
}

let ai: Genkit;

if (process.env.NODE_ENV === 'production') {
  ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-1.5-flash-latest',
  });
} else {
  if (!global.__genkit_ai) {
    global.__genkit_ai = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-1.5-flash-latest',
    });
  }
  ai = global.__genkit_ai;
}

export { ai };
