"use client"

import React from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, HandCoins, AlertTriangle, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading } = useTransactions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalIncomeTransactions = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseTransactions = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLoanTaken = loans.reduce((sum, l) => sum + l.totalAmount, 0);
  const currentDebt = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
  
  // নগদ জমা = (আয় + গৃহীত ঋণ) - ব্যয়
  const cashBalance = (totalIncomeTransactions + totalLoanTaken) - totalExpenseTransactions;
  
  // নিট অবশিষ্ট = নগদ জমা - বকেয়া ঋণ
  const netBalance = cashBalance - currentDebt;

  const upcomingLoanAlerts = loans.filter(loan => {
    if (!loan.dueDate || loan.paidAmount >= loan.totalAmount) return false;
    try {
      const daysRemaining = differenceInDays(new Date(loan.dueDate), new Date());
      return daysRemaining >= 0 && daysRemaining <= 15;
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="space-y-6 pb-4">
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-headline text-foreground">আর্থিক সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest font-black">
            {settings.userName}
          </p>
        </div>

        {/* প্রধান ব্যালেন্স কার্ড */}
        <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-2xl relative overflow-hidden group border-4 border-white/10">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold opacity-95">নিট ব্যালেন্স (ঋণ পরিশোধের পর)</p>
            </div>
            
            <div>
              <p className={cn(
                "text-5xl font-black tracking-tighter drop-shadow-md",
                netBalance < 0 && "text-red-100"
              )}>
                {settings.currency} {netBalance.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-3 bg-white/15 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                <Info className="w-3.5 h-3.5" />
                <p className="text-[11px] font-bold">
                  নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* সজাগবার্তা */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-3">
          {upcomingLoanAlerts.map(loan => {
            const daysRemaining = differenceInDays(new Date(loan.dueDate!), new Date());
            return (
              <Alert key={loan.id} variant="destructive" className="bg-white border-2 border-primary/20 text-foreground shadow-lg rounded-[1.5rem] overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div className="pl-2">
                  <AlertTitle className="font-black flex items-center justify-between text-xs text-primary mb-1">
                    ঋণ পরিশোধের সজাগবার্তা
                    <span className="text-[10px] bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-bold">{daysRemaining} দিন বাকি</span>
                  </AlertTitle>
                  <AlertDescription className="text-xs font-medium leading-relaxed">
                    <b>{loan.personName}</b>-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করতে হবে।
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* আয় ও ব্যয়ের সংক্ষেপ */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-none shadow-xl rounded-[2rem] hover:scale-[1.02] transition-transform duration-300 overflow-hidden">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">নগদ জমা</CardTitle>
            <div className="p-1.5 bg-green-50 rounded-lg">
              <ArrowUpCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="text-xl font-black text-green-600">
              {settings.currency}{cashBalance.toLocaleString()}
            </div>
            <p className="text-[9px] font-bold text-muted-foreground mt-1 opacity-70">প্রকৃত ক্যাশ ইন হ্যান্ড</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-none shadow-xl rounded-[2rem] hover:scale-[1.02] transition-transform duration-300 overflow-hidden">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">বকেয়া ঋণ</CardTitle>
            <div className="p-1.5 bg-primary/5 rounded-lg">
              <HandCoins className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="text-xl font-black text-primary">
              {settings.currency}{currentDebt.toLocaleString()}
            </div>
            <p className="text-[9px] font-bold text-muted-foreground mt-1 opacity-70">মোট পরিশোধযোগ্য</p>
          </CardContent>
        </Card>
      </div>

      {/* সাম্প্রতিক লেনদেন */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-foreground">সাম্প্রতিক লেনদেন</h2>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">শীর্ষ ৫টি</span>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] shadow-md border-2 border-transparent hover:border-primary/10 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-inner",
                    t.type === 'income' ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary"
                  )}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-6 h-6 stroke-[2.5px]" /> : <ArrowDownCircle className="w-6 h-6 stroke-[2.5px]" />}
                  </div>
                  <div>
                    <p className="font-black text-sm text-foreground">{t.category}</p>
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {format(new Date(t.date), 'dd MMMM', { locale: bn })}
                      { (t.purpose || t.source) && <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span> }
                      <span className="truncate max-w-[120px]">{ t.purpose || t.source }</span>
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-black text-base tracking-tighter",
                  t.type === 'income' ? "text-green-600" : "text-primary"
                )}>
                  {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-[2rem] shadow-inner border-2 border-dashed border-muted">
            <p className="text-muted-foreground font-bold text-sm italic">এখনো কোন লেনদেন করা হয়নি।</p>
          </div>
        )}
      </section>
    </div>
  );
}