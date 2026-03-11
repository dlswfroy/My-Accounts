'use server';
/**
 * @fileOverview This flow analyzes a user's spending summary and provides actionable financial insights and tips.
 *
 * - spendingInsightTips - A function that handles the generation of spending insights.
 * - SpendingInsightTipsInput - The input type for the spendingInsightTips function.
 * - SpendingInsightTipsOutput - The return type for the spendingInsightTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingInsightTipsInputSchema = z
  .string()
  .describe('A summary of the user\u0027s spending patterns and categories.');
export type SpendingInsightTipsInput = z.infer<typeof SpendingInsightTipsInputSchema>;

const SpendingInsightTipsOutputSchema = z
  .array(z.string())
  .describe('An array of actionable financial insights and tips.');
export type SpendingInsightTipsOutput = z.infer<typeof SpendingInsightTipsOutputSchema>;

export async function spendingInsightTips(input: SpendingInsightTipsInput): Promise<SpendingInsightTipsOutput> {
  return spendingInsightTipsFlow(input);
}

const spendingInsightTipsPrompt = ai.definePrompt({
  name: 'spendingInsightTipsPrompt',
  input: {schema: SpendingInsightTipsInputSchema},
  output: {schema: SpendingInsightTipsOutputSchema},
  prompt: `Analyze the following spending summary and provide 3-5 brief, actionable insights or tips based on the spending patterns.
Focus on identifying high spending categories or suggesting potential saving areas.
Each tip should be concise, practical, and directly address improving financial habits.

Spending Summary:
{{{input}}}`,
});

const spendingInsightTipsFlow = ai.defineFlow(
  {
    name: 'spendingInsightTipsFlow',
    inputSchema: SpendingInsightTipsInputSchema,
    outputSchema: SpendingInsightTipsOutputSchema,
  },
  async input => {
    const {output} = await spendingInsightTipsPrompt(input);
    return output!;
  }
);
