'use server';
/**
 * @fileOverview A Genkit flow to parse Bengali voice commands into structured transaction objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseVoiceCommandInputSchema = z.object({
  text: z.string().describe('The recognized text from the voice command.'),
  incomeCategories: z.array(z.string()).describe('List of available income categories.'),
  expenseCategories: z.array(z.string()).describe('List of available expense categories.'),
});
export type ParseVoiceCommandInput = z.infer<typeof ParseVoiceCommandInputSchema>;

const ParseVoiceCommandOutputSchema = z.object({
  amount: z.number().describe('The transaction amount.'),
  type: z.enum(['income', 'expense']).describe('The type of transaction.'),
  category: z.string().describe('The matching category name.'),
  purpose: z.string().describe('Short purpose or description.'),
  success: z.boolean().describe('Whether the parsing was successful.'),
});
export type ParseVoiceCommandOutput = z.infer<typeof ParseVoiceCommandOutputSchema>;

export async function parseVoiceCommand(
  input: ParseVoiceCommandInput
): Promise<ParseVoiceCommandOutput> {
  return parseVoiceCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseVoiceCommandPrompt',
  input: {schema: ParseVoiceCommandInputSchema},
  output: {schema: ParseVoiceCommandOutputSchema},
  prompt: `তুমি একজন দক্ষ আর্থিক সহকারী। নিচের বাংলা ভয়েস কমান্ড থেকে লেনদেনের তথ্য বের করো।

**নির্দেশনা:**
১. পরিমাণ (amount) বের করো।
২. লেনদেনের ধরন (type) বের করো: যদি টাকা আসার কথা বুঝায় তবে 'income', আর যদি খরচ বা দেওয়ার কথা বুঝায় তবে 'expense'।
৩. ক্যাটাগরি (category) বের করো: নিচের লিস্ট থেকে সবথেকে মিল সম্পন্ন ক্যাটাগরি বেছে নাও। যদি না মিলে তবে সবথেকে উপযুক্ত একটি নাম দাও।
৪. উদ্দেশ্য (purpose) সংক্ষেপে লিখো।

ভয়েস কমান্ড: "{{{text}}}"

আয় ক্যাটাগরি লিস্ট: {{{incomeCategories}}}
ব্যয় ক্যাটাগরি লিস্ট: {{{expenseCategories}}}

আউটপুট অবশ্যই JSON ফরম্যাটে হতে হবে। যদি তথ্য বুঝতে না পারো তবে success: false দাও।
`,
});

const parseVoiceCommandFlow = ai.defineFlow(
  {
    name: 'parseVoiceCommandFlow',
    inputSchema: ParseVoiceCommandInputSchema,
    outputSchema: ParseVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      return { amount: 0, type: 'expense', category: 'অন্যান্য', purpose: '', success: false };
    }
    return output;
  }
);
