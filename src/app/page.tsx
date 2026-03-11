"use client"

import React, { useState } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Sparkles, Loader2 } from 'lucide-react';
import { spendingInsightTips } from '@/ai/flows/spending-insight-tips';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function Dashboard() {
  const { transactions, settings, isLoading } = useTransactions();
  const [insights, setInsights] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  if (isLoading) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const handleGenerateInsights = async () => {
    if (transactions.length === 0) return;
    setIsGeneratingInsights(true);
    try {
      const summaryText = transactions.map(t => 
        `${t.date}: ${t.type === 'income' ? 'আয়' : 'ব্যয়'} - ${t.amount} ${settings.currency} (${t.category}: ${t.purpose || t.source})`
      ).join('\n');
      
      const res = await spendingInsightTips(summaryText);
      setInsights(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-muted-foreground">বর্তমান ব্যালেন্স</h2>
        <div className="bg-primary p-8 rounded-[2rem] text-primary-foreground shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight">
                {settings.currency} {balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">মোট আয়</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-xl font-bold text-green-600">
              +{settings.currency}{totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">মোট ব্যয়</CardTitle>
            <ArrowDownCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-xl font-bold text-primary">
              -{settings.currency}{totalExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI আর্থিক পরামর্শ
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-accent hover:text-accent/80 hover:bg-accent/10"
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights || transactions.length === 0}
          >
            {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            টিপস দেখুন
          </Button>
        </div>
        
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((tip, idx) => (
              <div key={idx} className="bg-accent/5 border-l-4 border-accent p-4 rounded-r-lg shadow-sm">
                <p className="text-sm text-foreground/90">{tip}</p>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed bg-transparent">
            <CardContent className="p-8 text-center text-muted-foreground">
              {transactions.length > 0 ? "আপনার লেনদেনের উপর ভিত্তি করে AI পরামর্শ পেতে বাটনটি চাপুন।" : "কোন লেনদেন নেই। পরামর্শ পেতে আগে লেনদেন যুক্ত করুন।"}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">সাম্প্রতিক লেনদেন</h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    t.type === 'income' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                  )}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date), 'dd MMMM', { locale: bn })} • {t.purpose || t.source}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-bold",
                  t.type === 'income' ? "text-green-600" : "text-primary"
                )}>
                  {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground italic">
            এখনো কোন লেনদেন করা হয়নি।
          </div>
        )}
      </section>
    </div>
  );
}