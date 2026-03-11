
"use client"

import React from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, HandCoins, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Reports() {
  const { transactions, loans, settings, isLoading } = useTransactions();

  if (isLoading) return null;

  const totalIncomeTrans = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseTrans = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Loan stats
  const totalLoanTaken = loans.reduce((sum, l) => sum + l.totalAmount, 0);
  const totalLoanPaid = loans.reduce((sum, l) => sum + l.paidAmount, 0);
  const currentDebt = totalLoanTaken - totalLoanPaid;

  // নগদ জমা = (আয় + ঋণ গ্রহণ) - ব্যয়
  const cashBalance = (totalIncomeTrans + totalLoanTaken) - totalExpenseTrans;
  
  // নিট অবশিষ্ট = নগদ জমা - বকেয়া ঋণ
  const netBalance = cashBalance - currentDebt;

  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold font-headline">হিসাব রিপোর্ট</h1>

      <Card className="bg-white border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-sm font-medium opacity-80">সামগ্রিক পরিসংখ্যান</CardTitle>
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-3xl font-bold">{settings.currency}{netBalance.toLocaleString()}</p>
              <p className="text-xs opacity-70">প্রকৃত অবশিষ্ট (ঋণ পরিশোধের পর)</p>
            </div>
            <ChartIcon className="w-8 h-8 opacity-20" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
            <div className="flex-1 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" /> আয়
              </p>
              <p className="text-lg font-bold text-green-600">{settings.currency}{totalIncomeTrans.toLocaleString()}</p>
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-primary" /> ব্যয়
              </p>
              <p className="text-lg font-bold text-primary">{settings.currency}{totalExpenseTrans.toLocaleString()}</p>
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                <Wallet className="w-3 h-3 text-blue-600" /> নগদ
              </p>
              <p className="text-lg font-bold text-blue-600">{settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">ঋণের রিপোর্ট</h2>
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-primary" />
                <span className="font-medium">বকেয়া ঋণ</span>
              </div>
              <span className="font-bold text-primary">{settings.currency}{currentDebt.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase">গৃহীত ঋণ</p>
                <p className="text-sm font-semibold">{settings.currency}{totalLoanTaken.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase">পরিশোধিত ঋণ</p>
                <p className="text-sm font-semibold text-green-600">{settings.currency}{totalLoanPaid.toLocaleString()}</p>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span>ঋণ পরিশোধের অগ্রগতি</span>
                <span>{totalLoanTaken > 0 ? Math.round((totalLoanPaid / totalLoanTaken) * 100) : 0}%</span>
              </div>
              <Progress value={totalLoanTaken > 0 ? (totalLoanPaid / totalLoanTaken) * 100 : 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </section>

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
                  <Progress value={(amount / totalExpenseTrans) * 100} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4 italic">ব্যয়ের কোন তথ্য নেই।</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
