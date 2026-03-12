import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// User provided Gemini API Key
const apiKey = 'AIzaSyAwxvQOPMwAxTYAh1FmGvtdWlT_7TVo2PI';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
