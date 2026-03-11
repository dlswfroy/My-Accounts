'use server';
/**
 * @fileOverview A Genkit flow for generating natural language summaries of financial data in Bengali.
 *
 * - monthlyFinancialSummary - A function that generates a financial summary for a given period.
 * - MonthlyFinancialSummaryInput - The input type for the monthlyFinancialSummary function.
 * - MonthlyFinancialSummaryOutput - The return type for the monthlyFinancialSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonthlyFinancialSummaryInputSchema = z.object({
  periodDescription: z
    .string()
    .describe('A natural language description of the period being summarized (e.g., "last month", "Q3 2023").'),
  incomeRecords: z
    .array(
      z.object({
        amount: z.number().describe('The income amount.'),
        date: z.string().describe('The date of the income in YYYY-MM-DD format.'),
        source: z.string().describe('The source of the income.'),
      })
    )
    .describe('An array of income records for the specified period.'),
  expenseRecords: z
    .array(
      z.object({
        amount: z.number().describe('The expense amount.'),
        date: z.string().describe('The date of the expense in YYYY-MM-DD format.'),
        category: z.string().describe('The category of the expense.'),
        purpose: z.string().describe('The purpose or description of the expense.'),
      })
    )
    .describe('An array of expense records for the specified period.'),
});
export type MonthlyFinancialSummaryInput = z.infer<typeof MonthlyFinancialSummaryInputSchema>;

const MonthlyFinancialSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A natural language summary of the financial situation for the given period in Bengali.'
    ),
  spendingInsights: z
    .array(z.string())
    .describe('Actionable insights and observations about spending patterns in Bengali.'),
});
export type MonthlyFinancialSummaryOutput = z.infer<typeof MonthlyFinancialSummaryOutputSchema>;

export async function monthlyFinancialSummary(
  input: MonthlyFinancialSummaryInput
): Promise<MonthlyFinancialSummaryOutput> {
  return monthlyFinancialSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monthlyFinancialSummaryPrompt',
  input: {schema: MonthlyFinancialSummaryInputSchema},
  output: {schema: MonthlyFinancialSummaryOutputSchema},
  prompt: `You are an expert financial analyst. Your task is to provide a concise and insightful natural language summary of the user's financial activity for the period described.

**IMPORTANT: You MUST provide the output in BENGALI language (বাংলা ভাষায় উত্তর দিন).**

Analyze the provided income and expense records for "{{{periodDescription}}}".
Calculate the total income, total expenses, and the net balance.
Identify key spending patterns, significant income sources, and any notable trends or anomalies.
Provide actionable insights based on these patterns.

---
Financial Period: {{{periodDescription}}}

Income Records:
{{#if incomeRecords}}
{{#each incomeRecords}}
- Amount: \${{{amount}}}, Date: {{{date}}}, Source: {{{source}}}
{{/each}}
{{else}}
No income records for this period.
{{/if}}

Expense Records:
{{#if expenseRecords}}
{{#each expenseRecords}}
- Amount: \${{{amount}}}, Date: {{{date}}}, Category: {{{category}}}, Purpose: {{{purpose}}}
{{/each}}
{{else}}
No expense records for this period.
{{/if}}

---
Based on the data above, generate a financial summary and spending insights in Bengali.
`,
});

const monthlyFinancialSummaryFlow = ai.defineFlow(
  {
    name: 'monthlyFinancialSummaryFlow',
    inputSchema: MonthlyFinancialSummaryInputSchema,
    outputSchema: MonthlyFinancialSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate financial summary.');
    }
    return output;
  }
);
