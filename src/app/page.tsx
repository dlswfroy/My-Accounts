
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
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black font-headline text-foreground tracking-tight uppercase">সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-primary/10 text-primary px-4 py-2 rounded-full uppercase tracking-widest font-black border-2 border-primary/20 shadow-sm">{settings.userName}</p>
        </div>
        <div className="bg-primary p-10 rounded-[3rem] text-primary-foreground shadow-2xl relative overflow-hidden group border-4 border-white/20">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl border border-white/20 shadow-inner">
                <Wallet className="w-8 h-8 stroke-[2.5px]" />
              </div>
              <p className="text-xs font-black opacity-90 tracking-widest uppercase">নিট অবশিষ্ট (ঋণ বাদে)</p>
            </div>
            <div>
              <p className={cn("text-6xl font-black tracking-tighter flex items-baseline gap-2 leading-none", netBalance < 0 && "text-white/80")}>
                <span className="text-2xl font-medium opacity-70">{settings.currency}</span>{netBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-black/20 w-fit px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <Info className="w-4 h-4 text-white/70" />
              <p className="text-[11px] font-black uppercase tracking-tight">নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Progress Section */}
      {Object.keys(settings.budgets).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2 px-1">
            <Target className="w-6 h-6 text-primary" /> বাজেট ট্র্যাকার
          </h2>
          <div className="grid gap-4">
            {Object.entries(settings.budgets).map(([cat, limit]) => {
              const spent = categorySpending[cat] || 0;
              const percent = Math.min((spent / limit) * 100, 100);
              const isOverBudget = spent > limit;
              return (
                <div key={cat} className="bg-white p-5 rounded-[2rem] shadow-xl border-2 border-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex justify-between text-[10px] font-black mb-3">
                    <span className="text-muted-foreground uppercase tracking-widest">{cat}</span>
                    <span className={cn("tracking-tighter", isOverBudget ? "text-primary" : "text-green-600")}>
                      {settings.currency}{spent.toLocaleString()} / {settings.currency}{limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className={cn("h-3 bg-muted/50", isOverBudget ? "bg-primary/20" : "bg-green-100")} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* AI Advisor */}
      <section className="px-1">
        <Card className="bg-white border-2 border-primary/10 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-xs font-black flex items-center gap-3 text-primary uppercase tracking-[0.2em]">
              <div className="p-2 bg-primary/10 rounded-xl"><Sparkles className="w-5 h-5" /></div>
              AI আর্থিক উপদেষ্টা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            {!aiSummary ? (
              <Button 
                onClick={handleGenerateAiSummary} 
                disabled={isAiLoading} 
                className="w-full rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs h-14 shadow-xl active:scale-95 transition-all"
              >
                {isAiLoading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <><Sparkles className="w-5 h-5 mr-3" /> আজই পরামর্শ নিন</>}
              </Button>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-5 bg-primary/5 rounded-[1.8rem] border border-primary/10">
                  <p className="text-xs font-bold leading-relaxed">{aiSummary.summary}</p>
                </div>
                <div className="space-y-3">
                  {aiSummary.spendingInsights.map((tip, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
                      <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setAiSummary(null)} className="w-full text-[10px] font-black text-muted-foreground gap-3 hover:bg-primary/5"><RefreshCcw className="w-4 h-4" /> পুনরায় বিশ্লেষণ করুন</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Upcoming Loans */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-4">
          {upcomingLoanAlerts.map(loan => (
            <Alert key={loan.id} className="bg-white border-2 border-primary/20 shadow-2xl rounded-[2rem] relative overflow-hidden py-6">
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-primary"></div>
              <AlertTriangle className="h-6 w-6 text-primary ml-2" />
              <div className="pl-4">
                <AlertTitle className="font-black text-sm text-primary mb-1 uppercase tracking-tight">ঋণ পরিশোধের সময় হয়েছে</AlertTitle>
                <AlertDescription className="text-xs font-bold opacity-80">{loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করুন।</AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[2.5rem] p-6 hover:border-primary/20 transition-all">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex justify-between items-center">নগদ <ArrowUpCircle className="w-5 h-5 text-green-600" /></div>
          <div className="text-2xl font-black text-green-600 tracking-tighter">{settings.currency}{cashBalance.toLocaleString()}</div>
        </Card>
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[2.5rem] p-6 hover:border-primary/20 transition-all">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex justify-between items-center">বকেয়া ঋণ <HandCoins className="w-5 h-5 text-primary" /></div>
          <div className="text-2xl font-black text-primary tracking-tighter">{settings.currency}{currentDebt.toLocaleString()}</div>
        </Card>
      </div>
    </div>
  );
}
