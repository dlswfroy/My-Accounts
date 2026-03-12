
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card } from '@/components/ui/card';
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
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header with Clock and Date */}
      <section className="flex justify-between items-start px-1 gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">সারসংক্ষেপ</h2>
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-1.5 rounded-full text-base font-black border border-primary/20 shadow-sm">
            {settings.userName}
          </div>
        </div>
        {currentTime && (
          <div className="text-right flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-7 h-7" />
              <span className="text-[28px] font-black tracking-tighter tabular-nums drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]">
                {format(currentTime, 'hh:mm:ss a')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-[11.5px] font-bold uppercase tracking-wider">
                {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: bn })}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Main Balance Card (30% Smaller Board Total, with Black Border) */}
      <section>
        <div className="bg-primary p-4 rounded-[1.75rem] text-primary-foreground shadow-2xl relative overflow-hidden border-4 border-black">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Wallet className="w-16 h-16" />
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-black opacity-80 tracking-widest uppercase">নিট অবশিষ্ট (ঋণ বাদে)</p>
            </div>
            <p className="text-4xl sm:text-5xl font-black tracking-tighter flex items-baseline gap-2 overflow-hidden text-ellipsis">
              <span className="text-xl font-bold opacity-70">{settings.currency}</span>{netBalance.toLocaleString()}
            </p>
            <div className="inline-flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-xl border border-white/5">
              <Info className="w-4 h-4 text-white/60" />
              <p className="text-[11px] font-bold uppercase">নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Loans Alerts */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-3 px-1">
          {upcomingLoanAlerts.map(loan => {
            const daysLeft = differenceInDays(new Date(loan.dueDate!), currentDate);
            return (
              <Alert key={loan.id} className="bg-white border-2 border-primary/10 shadow-lg rounded-[1.5rem] relative overflow-hidden py-4">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
                <AlertTriangle className="h-6 w-6 text-primary ml-1" />
                <div className="pl-4">
                  <div className="flex justify-between items-start">
                    <AlertTitle className="font-black text-sm text-primary mb-1 uppercase">ঋণ পরিশোধ</AlertTitle>
                    <span className="bg-primary text-white text-[9px] font-black px-2 py-1 rounded-full uppercase">
                      {daysLeft === 0 ? "আজই শেষ দিন" : `${daysLeft} দিন বাকি`}
                    </span>
                  </div>
                  <AlertDescription className="text-xs font-bold text-muted-foreground">
                    {loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} দিন।
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Budget Progress */}
      {Object.keys(settings.budgets).length > 0 && (
        <section className="space-y-4 px-1">
          <h2 className="text-xl font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> বাজেট ট্র্যাকার
          </h2>
          <div className="grid gap-4">
            {Object.entries(settings.budgets).map(([cat, limit]) => {
              const spent = categorySpending[cat] || 0;
              const percent = Math.min((spent / limit) * 100, 100);
              const isOverBudget = spent > limit;
              return (
                <div key={cat} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-primary/5">
                  <div className="flex justify-between text-[12px] font-black mb-3">
                    <span className="text-muted-foreground uppercase tracking-widest">{cat}</span>
                    <span className={cn(isOverBudget ? "text-primary" : "text-green-600")}>
                      {settings.currency}{spent.toLocaleString()} / {settings.currency}{limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className={cn("h-3", isOverBudget ? "bg-primary/10" : "bg-green-100")} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-1">
        <Card className="bg-white border-2 border-primary/5 shadow-md rounded-[1.5rem] p-5">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex justify-between items-center">নগদ জমা <ArrowUpCircle className="w-4 h-4 text-green-600" /></p>
          <p className="text-2xl font-black text-green-600 tracking-tighter">{settings.currency}{cashBalance.toLocaleString()}</p>
        </Card>
        <Card className="bg-white border-2 border-primary/5 shadow-md rounded-[1.5rem] p-5">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex justify-between items-center">বকেয়া ঋণ <HandCoins className="w-4 h-4 text-primary" /></p>
          <p className="text-2xl font-black text-primary tracking-tighter">{settings.currency}{currentDebt.toLocaleString()}</p>
        </Card>
      </div>
    </div>
  );
}
