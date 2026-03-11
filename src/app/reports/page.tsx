
"use client"

import React from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, HandCoins, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function Reports() {
  const { transactions, loans, settings, isLoading } = useTransactions();

  if (isLoading) return null;

  const totalIncomeTrans = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseTrans = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalLoanTaken = loans.reduce((sum, l) => sum + l.totalAmount, 0);
  const totalLoanPaid = loans.reduce((sum, l) => sum + l.paidAmount, 0);
  const currentDebt = totalLoanTaken - totalLoanPaid;
  const cashBalance = (totalIncomeTrans + totalLoanTaken) - totalExpenseTrans;
  const netBalance = cashBalance - currentDebt;

  const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#ff0000', '#ff4d4d', '#ff8080', '#ffb3b3', '#330000', '#660000'];

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold font-headline">হিসাব রিপোর্ট</h1>

      <Card className="bg-white border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-sm font-medium opacity-80 uppercase font-black tracking-widest">নিট অবশিষ্ট</CardTitle>
          <div className="flex justify-between items-end mt-2">
            <p className="text-3xl font-black">{settings.currency}{netBalance.toLocaleString()}</p>
            <ChartIcon className="w-8 h-8 opacity-20" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
            <div className="flex-1 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black">আয়</p>
              <p className="text-lg font-black text-green-600">{settings.currency}{totalIncomeTrans.toLocaleString()}</p>
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black">ব্যয়</p>
              <p className="text-lg font-black text-primary">{settings.currency}{totalExpenseTrans.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-black text-foreground tracking-tight uppercase">ব্যয়ের বিশ্লেষণ</h2>
        <Card className="bg-white p-4 rounded-[2rem] shadow-sm">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black text-foreground tracking-tight uppercase">ঋণের অবস্থা</h2>
        <Card className="bg-white p-4 rounded-[2rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2"><HandCoins className="w-5 h-5 text-primary" /><span className="font-black text-sm uppercase">বকেয়া ঋণ</span></div>
            <span className="font-black text-primary">{settings.currency}{currentDebt.toLocaleString()}</span>
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-[10px] mb-1 font-bold"><span>পরিশোধের অগ্রগতি</span><span>{totalLoanTaken > 0 ? Math.round((totalLoanPaid / totalLoanTaken) * 100) : 0}%</span></div>
            <Progress value={totalLoanTaken > 0 ? (totalLoanPaid / totalLoanTaken) * 100 : 0} className="h-1.5" />
          </div>
        </Card>
      </section>
    </div>
  );
}
