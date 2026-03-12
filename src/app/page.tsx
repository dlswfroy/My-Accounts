
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, HandCoins, AlertTriangle, Info, Loader2, Clock, Calendar as CalendarIcon, Target } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setCurrentTime(now);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLoading || !currentDate) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
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

  const categorySpending = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Header with Clock and Date */}
      <section className="flex justify-between items-start px-2">
        <div>
          <h2 className="text-3xl font-black font-headline text-foreground tracking-tight uppercase">সারসংক্ষেপ</h2>
          <p className="text-[14px] bg-primary/10 text-primary px-5 py-2 rounded-full uppercase tracking-wider font-black border-2 border-primary/20 inline-block mt-2">
            {settings.userName}
          </p>
        </div>
        {currentTime && (
          <div className="text-right flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-6 h-6" />
              <span className="text-2xl font-black tracking-tighter tabular-nums">
                {format(currentTime, 'hh:mm:ss a')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="w-5 h-5" />
              <span className="text-[13px] font-bold uppercase tracking-widest">
                {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: bn })}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-2xl relative overflow-hidden group border-4 border-white/20">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xl border border-white/20 shadow-inner">
                <Wallet className="w-8 h-8 stroke-[2.5px]" />
              </div>
              <p className="text-[15px] font-black opacity-90 tracking-widest uppercase">নিট অবশিষ্ট (ঋণ বাদে)</p>
            </div>
            <div className="overflow-hidden">
              <p className={cn("text-6xl sm:text-7xl font-black tracking-tighter flex items-baseline gap-3 leading-tight flex-wrap", netBalance < 0 && "text-white/90")}>
                <span className="text-2xl font-medium opacity-70">{settings.currency}</span>{netBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2 bg-black/20 w-fit px-6 py-3 rounded-xl border border-white/10 shadow-sm">
              <Info className="w-6 h-6 text-white/70" />
              <p className="text-[15px] font-black uppercase tracking-tight">নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Loans Alerts */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-5 px-2">
          {upcomingLoanAlerts.map(loan => {
            const daysLeft = differenceInDays(new Date(loan.dueDate!), currentDate);
            return (
              <Alert key={loan.id} className="bg-white border-2 border-primary/20 shadow-2xl rounded-[1.8rem] relative overflow-hidden py-6">
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-primary"></div>
                <AlertTriangle className="h-7 w-7 text-primary ml-1" />
                <div className="pl-5">
                  <div className="flex justify-between items-start">
                    <AlertTitle className="font-black text-[16px] text-primary mb-1 uppercase tracking-tight">ঋণ পরিশোধের সময় হয়েছে</AlertTitle>
                    <span className="bg-primary text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase">
                      {daysLeft === 0 ? "আজই শেষ দিন" : `${daysLeft} দিন বাকি`}
                    </span>
                  </div>
                  <AlertDescription className="text-[15px] font-bold opacity-80">
                    {loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করুন।
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Budget Progress Section */}
      {Object.keys(settings.budgets).length > 0 && (
        <section className="space-y-6 px-2">
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase flex items-center gap-3">
            <Target className="w-7 h-7 text-primary" /> বাজেট ট্র্যাকার
          </h2>
          <div className="grid gap-5">
            {Object.entries(settings.budgets).map(([cat, limit]) => {
              const spent = categorySpending[cat] || 0;
              const percent = Math.min((spent / limit) * 100, 100);
              const isOverBudget = spent > limit;
              return (
                <div key={cat} className="bg-white p-6 rounded-[1.8rem] shadow-lg border-2 border-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex justify-between text-[15px] font-black mb-4">
                    <span className="text-muted-foreground uppercase tracking-widest truncate max-w-[200px]">{cat}</span>
                    <span className={cn("tracking-tighter", isOverBudget ? "text-primary" : "text-green-600")}>
                      {settings.currency}{spent.toLocaleString()} / {settings.currency}{limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className={cn("h-4 bg-muted/50", isOverBudget ? "bg-primary/20" : "bg-green-100")} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-6 px-2">
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[2rem] p-7 hover:border-primary/20 transition-all">
          <div className="text-[12px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex justify-between items-center">নগদ <ArrowUpCircle className="w-6 h-6 text-green-600" /></div>
          <div className="text-3xl font-black text-green-600 tracking-tighter truncate">{settings.currency}{cashBalance.toLocaleString()}</div>
        </Card>
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[2rem] p-7 hover:border-primary/20 transition-all">
          <div className="text-[12px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex justify-between items-center">বকেয়া ঋণ <HandCoins className="w-6 h-6 text-primary" /></div>
          <div className="text-3xl font-black text-primary tracking-tighter truncate">{settings.currency}{currentDebt.toLocaleString()}</div>
        </Card>
      </div>
    </div>
  );
}
