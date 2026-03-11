
"use client"

import React from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, HandCoins } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading } = useTransactions();

  if (isLoading) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentDebt = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
  
  // নিট ব্যালেন্স = (মোট আয় - মোট ব্যয়) - বকেয়া ঋণ
  const netBalance = (totalIncome - totalExpenses) - currentDebt;
  const cashBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-muted-foreground">নিট ব্যালেন্স (ঋণ সহ)</h2>
        <div className="bg-primary p-8 rounded-[2rem] text-primary-foreground shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight">
                {settings.currency} {netBalance.toLocaleString()}
              </p>
              <p className="text-xs opacity-80 mt-1 font-medium">
                নগদ জমা: {settings.currency}{cashBalance.toLocaleString()} | বকেয়া ঋণ: {settings.currency}{currentDebt.toLocaleString()}
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

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">বকেয়া ঋণ</p>
                <p className="text-lg font-bold text-amber-600">{settings.currency}{currentDebt.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">মোট ঋণ থেকে বাকি</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
