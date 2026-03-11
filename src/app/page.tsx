
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
      toast({ variant: "destructive", title: "AI ত্রুটি", description: "সার্ভারে সমস্যা অথবা API কী চেক করুন।" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const categorySpending = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 pb-6 animate-in fade-in duration-500">
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-black font-headline text-foreground tracking-tight uppercase">সারসংক্ষেপ</h2>
          <p className="text-[8px] bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider font-black border-2 border-primary/20 truncate max-w-[120px]">{settings.userName}</p>
        </div>
        <div className="bg-primary p-5 rounded-[2rem] text-primary-foreground shadow-2xl relative overflow-hidden group border-4 border-white/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-20 h-20" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xl border border-white/20 shadow-inner">
                <Wallet className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <p className="text-[9px] font-black opacity-90 tracking-widest uppercase">নিট অবশিষ্ট (ঋণ বাদে)</p>
            </div>
            <div className="overflow-hidden">
              <p className={cn("text-3xl sm:text-4xl font-black tracking-tighter flex items-baseline gap-1 leading-tight flex-wrap", netBalance < 0 && "text-white/90")}>
                <span className="text-base font-medium opacity-70">{settings.currency}</span>{netBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1 bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <Info className="w-3 h-3 text-white/70" />
              <p className="text-[9px] font-black uppercase tracking-tight">নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Progress Section */}
      {Object.keys(settings.budgets).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-black text-foreground tracking-tight uppercase flex items-center gap-2 px-1">
            <Target className="w-4 h-4 text-primary" /> বাজেট ট্র্যাকার
          </h2>
          <div className="grid gap-2.5">
            {Object.entries(settings.budgets).map(([cat, limit]) => {
              const spent = categorySpending[cat] || 0;
              const percent = Math.min((spent / limit) * 100, 100);
              const isOverBudget = spent > limit;
              return (
                <div key={cat} className="bg-white p-3.5 rounded-[1.5rem] shadow-lg border-2 border-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex justify-between text-[9px] font-black mb-1.5">
                    <span className="text-muted-foreground uppercase tracking-widest truncate max-w-[100px]">{cat}</span>
                    <span className={cn("tracking-tighter", isOverBudget ? "text-primary" : "text-green-600")}>
                      {settings.currency}{spent.toLocaleString()} / {settings.currency}{limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className={cn("h-2 bg-muted/50", isOverBudget ? "bg-primary/20" : "bg-green-100")} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* AI Advisor */}
      <section className="px-1">
        <Card className="bg-white border-2 border-primary/10 shadow-2xl rounded-[2.2rem] overflow-hidden">
          <CardHeader className="p-5 pb-1">
            <CardTitle className="text-[9px] font-black flex items-center gap-2 text-primary uppercase tracking-[0.2em]">
              <div className="p-1.5 bg-primary/10 rounded-lg"><Sparkles className="w-3.5 h-3.5" /></div>
              AI আর্থিক উপদেষ্টা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-3">
            {!aiSummary ? (
              <Button 
                onClick={handleGenerateAiSummary} 
                disabled={isAiLoading} 
                className="w-full rounded-xl bg-primary hover:bg-primary/90 font-black text-[9px] h-11 shadow-xl active:scale-95 transition-all"
              >
                {isAiLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : <><Sparkles className="w-3.5 h-3.5 mr-2" /> আজই পরামর্শ নিন</>}
              </Button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="p-3.5 bg-primary/5 rounded-[1.2rem] border border-primary/10">
                  <p className="text-[9px] font-bold leading-relaxed">{aiSummary.summary}</p>
                </div>
                <div className="space-y-1.5">
                  {aiSummary.spendingInsights.map((tip, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start p-2.5 bg-muted/20 rounded-lg border border-transparent hover:border-primary/10 transition-all">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_6px_rgba(255,0,0,0.5)]" />
                      <p className="text-[9px] font-bold text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setAiSummary(null)} className="w-full text-[8px] font-black text-muted-foreground gap-1.5 h-8 hover:bg-primary/5"><RefreshCcw className="w-2.5 h-2.5" /> পুনরায় বিশ্লেষণ করুন</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Upcoming Loans */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-3 px-1">
          {upcomingLoanAlerts.map(loan => (
            <Alert key={loan.id} className="bg-white border-2 border-primary/20 shadow-2xl rounded-[1.5rem] relative overflow-hidden py-3">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
              <AlertTriangle className="h-4 w-4 text-primary ml-0.5" />
              <div className="pl-2">
                <AlertTitle className="font-black text-[10px] text-primary mb-0 uppercase tracking-tight">ঋণ পরিশোধের সময় হয়েছে</AlertTitle>
                <AlertDescription className="text-[9px] font-bold opacity-80">{loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করুন।</AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3.5">
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[1.8rem] p-4 hover:border-primary/20 transition-all">
          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 flex justify-between items-center">নগদ <ArrowUpCircle className="w-3.5 h-3.5 text-green-600" /></div>
          <div className="text-lg font-black text-green-600 tracking-tighter truncate">{settings.currency}{cashBalance.toLocaleString()}</div>
        </Card>
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[1.8rem] p-4 hover:border-primary/20 transition-all">
          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 flex justify-between items-center">বকেয়া ঋণ <HandCoins className="w-3.5 h-3.5 text-primary" /></div>
          <div className="text-lg font-black text-primary tracking-tighter truncate">{settings.currency}{currentDebt.toLocaleString()}</div>
        </Card>
      </div>
    </div>
  );
}
