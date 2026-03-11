"use client"

import React, { useState } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PieChart as ChartIcon, FileText, Sparkles } from 'lucide-react';
import { monthlyFinancialSummary } from '@/ai/flows/monthly-financial-summary';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function Reports() {
  const { transactions, settings, isLoading } = useTransactions();
  const [aiSummary, setAiSummary] = useState<{summary: string, insights: string[]} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (isLoading) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  const handleGenerateSummary = async () => {
    if (transactions.length === 0) return;
    setIsAnalyzing(true);
    try {
      const incomeRecords = transactions
        .filter(t => t.type === 'income')
        .map(t => ({ amount: t.amount, date: t.date, source: t.source || t.category }));
      
      const expenseRecords = transactions
        .filter(t => t.type === 'expense')
        .map(t => ({ amount: t.amount, date: t.date, category: t.category, purpose: t.purpose || '' }));

      const res = await monthlyFinancialSummary({
        periodDescription: 'চলতি সময়কাল',
        incomeRecords,
        expenseRecords
      });
      setAiSummary(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold font-headline">হিসাব রিপোর্ট</h1>

      <Card className="bg-white border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-sm font-medium opacity-80">সামগ্রিক পরিসংখ্যান</CardTitle>
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-3xl font-bold">{settings.currency}{(totalIncome - totalExpenses).toLocaleString()}</p>
              <p className="text-xs opacity-70">নিট ব্যালেন্স</p>
            </div>
            <ChartIcon className="w-8 h-8 opacity-20" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
            <div className="flex-1 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold">আয়</p>
              <p className="text-lg font-bold text-green-600">{settings.currency}{totalIncome.toLocaleString()}</p>
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold">ব্যয়</p>
              <p className="text-lg font-bold text-primary">{settings.currency}{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">ব্যয়ের খাতসমূহ</h2>
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([category, amount]) => (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">{settings.currency}{amount.toLocaleString()}</span>
                  </div>
                  <Progress value={(amount / totalExpenses) * 100} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4 italic">ব্যয়ের কোন তথ্য নেই।</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI বিশ্লেষণ রিপোর্ট
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-accent text-accent hover:bg-accent/10"
            onClick={handleGenerateSummary}
            disabled={isAnalyzing || transactions.length === 0}
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            বিশ্লেষণ করুন
          </Button>
        </div>

        {aiSummary ? (
          <div className="space-y-4">
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 prose prose-sm text-foreground/90">
                <p className="whitespace-pre-line leading-relaxed">{aiSummary.summary}</p>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">মূল অন্তর্দৃষ্টি:</p>
              {aiSummary.spendingInsights.map((insight, i) => (
                <div key={i} className="flex gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="mt-1 w-2 h-2 bg-accent rounded-full shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/50 border border-dashed rounded-2xl p-10 text-center space-y-2">
            <p className="text-muted-foreground text-sm">আপনার বিস্তারিত আর্থিক রিপোর্ট পেতে 'বিশ্লেষণ করুন' চাপুন।</p>
          </div>
        )}
      </section>
    </div>
  );
}