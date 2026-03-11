
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, HandCoins, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function Reports() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  const COLORS = ['#ff0000', '#cc0000', '#990000', '#ff3333', '#ff6666', '#330000'];

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg"><ChartIcon className="w-6 h-6" /></div>
        <h1 className="text-2xl font-black font-headline text-primary uppercase">হিসাব রিপোর্ট</h1>
      </div>

      <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden border-2 border-primary/5">
        <CardHeader className="bg-primary text-primary-foreground p-8">
          <CardTitle className="text-xs font-black opacity-90 uppercase tracking-widest">নিট অবশিষ্ট (ঋণ বাদে)</CardTitle>
          <div className="flex justify-between items-end mt-4">
            <p className="text-4xl font-black tracking-tighter">{settings.currency}{netBalance.toLocaleString()}</p>
            <Wallet className="w-10 h-10 opacity-30" />
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="flex divide-x divide-primary/10">
            <div className="flex-1 p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">মোট আয়</p>
              <p className="text-xl font-black text-green-600">{settings.currency}{totalIncomeTrans.toLocaleString()}</p>
            </div>
            <div className="flex-1 p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">মোট ব্যয়</p>
              <p className="text-xl font-black text-primary">{settings.currency}{totalExpenseTrans.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" /> ব্যয়ের বিশ্লেষণ
        </h2>
        <Card className="bg-white p-4 rounded-[2.5rem] shadow-xl border-2 border-primary/5 min-h-[350px] flex items-center justify-center">
          {isMounted ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData.length > 0 ? chartData : [{ name: 'তথ্য নেই', value: 1 }]} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {chartData.length > 0 ? chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    )) : <Cell fill="#f3f4f6" strokeWidth={0} />}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs animate-pulse font-bold">লোডিং...</div>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary" /> ঋণের অবস্থা
        </h2>
        <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-primary/5 space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><HandCoins className="w-5 h-5 text-primary" /></div>
              <span className="font-black text-xs uppercase tracking-tight">বকেয়া ঋণ</span>
            </div>
            <span className="font-black text-2xl text-primary">{settings.currency}{currentDebt.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>পরিশোধের অগ্রগতি</span>
              <span className="text-primary">{totalLoanTaken > 0 ? Math.round((totalLoanPaid / totalLoanTaken) * 100) : 0}%</span>
            </div>
            <Progress value={totalLoanTaken > 0 ? (totalLoanPaid / totalLoanTaken) * 100 : 0} className="h-2.5 bg-primary/10" />
          </div>
        </Card>
      </section>
    </div>
  );
}
