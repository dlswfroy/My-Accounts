
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, HandCoins, AlertTriangle, Info, Sparkles, Loader2, RefreshCcw, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { monthlyFinancialSummary, type MonthlyFinancialSummaryOutput } from '@/ai/flows/monthly-financial-summary';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [aiSummary, setAiSummary] = useState<MonthlyFinancialSummaryOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  if (isLoading || !currentDate) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  const totalIncomeTransactions = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseTransactions = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalLoanTaken = loans.reduce((sum, l) => sum + l.totalAmount, 0);
  const currentDebt = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
  const cashBalance = (totalIncomeTransactions + totalLoanTaken) - totalExpenseTransactions;
  const netBalance = cashBalance - currentDebt;

  const upcomingLoanAlerts = loans.filter(loan => {
    if (!loan.dueDate || loan.paidAmount >= loan.totalAmount) return false;
    const daysRemaining = differenceInDays(new Date(loan.dueDate), currentDate);
    return daysRemaining >= 0 && daysRemaining <= 15;
  });

  const handleGenerateAiSummary = async () => {
    if (transactions.length < 3) {
      toast({ title: "তথ্য অপর্যাপ্ত", description: "সঠিক পরামর্শের জন্য অন্তত ৩টি লেনদেন প্রয়োজন।" });
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await monthlyFinancialSummary({
        periodDescription: "এই মাস",
        incomeRecords: transactions.filter(t => t.type === 'income').slice(0, 15).map(t => ({ amount: t.amount, date: t.date, source: t.source || t.category })),
        expenseRecords: transactions.filter(t => t.type === 'expense').slice(0, 15).map(t => ({ amount: t.amount, date: t.date, category: t.category, purpose: t.purpose || '' })),
      });
      setAiSummary(result);
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI ত্রুটি", description: "API Key নেই অথবা সার্ভারে সমস্যা।" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const categorySpending = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pb-6">
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black font-headline text-foreground tracking-tight">সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase tracking-widest font-black border border-primary/20">{settings.userName}</p>
        </div>
        <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-2xl relative overflow-hidden group border-4 border-white/10">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl"><Wallet className="w-6 h-6 stroke-[2.5px]" /></div>
              <p className="text-xs font-black opacity-90 tracking-widest uppercase">নিট ব্যালেন্স</p>
            </div>
            <p className={cn("text-5xl font-black tracking-tighter flex items-baseline gap-2", netBalance < 0 && "text-red-100")}>
              <span className="text-2xl font-medium opacity-80">{settings.currency}</span>{netBalance.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-6 bg-black/10 w-fit px-4 py-2 rounded-2xl border border-white/10">
              <Info className="w-3.5 h-3.5" /><p className="text-[10px] font-bold">নগদ: {settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Progress Section */}
      {Object.keys(settings.budgets).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> বাজেট ট্র্যাকার
          </h2>
          <div className="grid gap-3">
            {Object.entries(settings.budgets).map(([cat, limit]) => {
              const spent = categorySpending[cat] || 0;
              const percent = Math.min((spent / limit) * 100, 100);
              return (
                <div key={cat} className="bg-white p-4 rounded-3xl shadow-sm border-2 border-transparent">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-muted-foreground uppercase tracking-tighter">{cat}</span>
                    <span className={cn(spent > limit ? "text-primary" : "text-green-600")}>
                      {settings.currency}{spent.toLocaleString()} / {settings.currency}{limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className={cn("h-2", spent > limit ? "bg-primary/20" : "bg-green-100")} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* AI Advisor */}
      <section className="px-1">
        <Card className="bg-white border-2 border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> AI আর্থিক উপদেষ্টা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {!aiSummary ? (
              <Button onClick={handleGenerateAiSummary} disabled={isAiLoading} className="w-full rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs h-11 shadow-lg">
                {isAiLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <><Sparkles className="w-4 h-4 mr-2" /> পরামর্শ তৈরি করুন</>}
              </Button>
            ) : (
              <div className="space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10"><p className="text-xs font-bold">{aiSummary.summary}</p></div>
                <div className="space-y-2">
                  {aiSummary.spendingInsights.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 bg-muted/30 rounded-xl border border-border/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p className="text-[11px] font-medium text-muted-foreground leading-snug">{tip}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setAiSummary(null)} className="w-full text-[10px] font-black text-muted-foreground gap-2"><RefreshCcw className="w-3 h-3" /> পুনরায় বিশ্লেষণ</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Upcoming Loans */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-3">
          {upcomingLoanAlerts.map(loan => (
            <Alert key={loan.id} className="bg-white border-2 border-primary/20 shadow-lg rounded-[1.8rem] relative">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div className="pl-2">
                <AlertTitle className="font-black text-xs text-primary mb-1">ঋণ পরিশোধের সময় হয়েছে</AlertTitle>
                <AlertDescription className="text-[11px] font-bold opacity-80">{loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} দিতে হবে।</AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-2 border-border/40 shadow-xl rounded-[2.2rem] p-5">
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex justify-between">নগদ <ArrowUpCircle className="w-4 h-4 text-green-600" /></div>
          <div className="text-xl font-black text-green-600 tracking-tighter">{settings.currency}{cashBalance.toLocaleString()}</div>
        </Card>
        <Card className="bg-white border-2 border-border/40 shadow-xl rounded-[2.2rem] p-5">
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex justify-between">বকেয়া ঋণ <HandCoins className="w-4 h-4 text-primary" /></div>
          <div className="text-xl font-black text-primary tracking-tighter">{settings.currency}{currentDebt.toLocaleString()}</div>
        </Card>
      </div>
    </div>
  );
}
