
"use client"

import React from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Reports() {
  const { transactions, settings, isLoading } = useTransactions();

  if (isLoading) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

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
              <p className="text-3xl font-bold">{settings.currency}{(totalIncome - totalExpenses).toLocaleString()}</p>
              <p className="text-xs opacity-70">নিট ব্যালেন্স</p>
            </div>
            <ChartIcon className="w-8 h-8 opacity-20" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
            <div className="flex-1 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold">আয়</p>
              <p className="text-lg font-bold text-green-600">{settings.currency}{totalIncome.toLocaleString()}</p>
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold">ব্যয়</p>
              <p className="text-lg font-bold text-primary">{settings.currency}{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Progress value={(amount / totalExpenses) * 100} className="h-2" />
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
