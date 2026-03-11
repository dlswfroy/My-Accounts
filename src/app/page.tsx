
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

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentDebt = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
  
  // নগদ জমা = আয় - ব্যয় (ইতোমধ্যে পরিশোধিত ঋণ ব্যয়ের মধ্যে অন্তর্ভুক্ত)
  const cashBalance = totalIncome - totalExpenses;
  
  // নিট অবশিষ্ট = নগদ জমা - বকেয়া ঋণ (সব ঋণ শোধ করলে যা থাকবে)
  const netBalance = cashBalance - currentDebt;

  // ১৫ দিনের মধ্যে পরিশোধের তারিখ আছে এমন ঋণের তালিকা
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
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold font-headline">আর্থিক সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground uppercase tracking-wider font-bold">
            {settings.userName}
          </p>
        </div>

        {/* প্রধান ব্যালেন্স কার্ড */}
        <div className="bg-primary p-8 rounded-[2rem] text-primary-foreground shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium opacity-90">নিট ব্যালেন্স (ঋণ পরিশোধের পর)</p>
            </div>
            
            <div>
              <p className={cn(
                "text-4xl font-bold tracking-tight",
                netBalance < 0 && "text-red-200"
              )}>
                {settings.currency} {netBalance.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2 opacity-80">
                <Info className="w-3 h-3" />
                <p className="text-[10px] font-medium">
                  আপনার হাতে আছে {settings.currency}{cashBalance.toLocaleString()} এবং বকেয়া ঋণ {settings.currency}{currentDebt.toLocaleString()}
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
              <Alert key={loan.id} variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="font-bold flex items-center justify-between text-xs">
                  ঋণ পরিশোধের সজাগবার্তা
                  <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-full">{daysRemaining} দিন বাকি</span>
                </AlertTitle>
                <AlertDescription className="text-[11px] opacity-90 mt-1">
                  <b>{loan.personName}</b>-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করতে হবে।
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* আয় ও ব্যয়ের সংক্ষেপ */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">মোট নগদ জমা</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-lg font-bold text-green-600">
              {settings.currency}{cashBalance.toLocaleString()}
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">আয় - ব্যয়</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">বকেয়া ঋণ</CardTitle>
            <HandCoins className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-lg font-bold text-amber-600">
              {settings.currency}{currentDebt.toLocaleString()}
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">মোট পাওনা</p>
          </CardContent>
        </Card>
      </div>

      {/* সাম্প্রতিক লেনদেন */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">সাম্প্রতিক লেনদেন</h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-transparent hover:border-border transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    t.type === 'income' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                  )}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.category}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(t.date), 'dd MMMM', { locale: bn })}
                      { (t.purpose || t.source) && ` • ${t.purpose || t.source}` }
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-bold text-sm",
                  t.type === 'income' ? "text-green-600" : "text-primary"
                )}>
                  {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground italic text-sm">
            এখনো কোন লেনদেন করা হয়নি।
          </div>
        )}
      </section>
    </div>
  );
}
