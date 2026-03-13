
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as ChartIcon, HandCoins, TrendingDown, Wallet, Calendar as CalendarIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function Reports() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ড্রপডাউন মেনুর জন্য চলতি বছরের ১২টি মাস এবং ডেটা থাকা মাসগুলোর লিস্ট তৈরি
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    const currentYear = now.getFullYear();

    // চলতি বছরের ১২টি মাস যোগ করা হচ্ছে
    for (let i = 1; i <= 12; i++) {
      const monthStr = i < 10 ? `0${i}` : `${i}`;
      months.add(`${currentYear}-${monthStr}`);
    }
    
    // যদি লেনদেন বা ঋণের ডেটা অন্য কোনো বছরের থাকে, সেগুলোও যোগ করা হচ্ছে
    transactions.forEach(t => months.add(t.date.substring(0, 7)));
    loans.forEach(l => months.add(l.date.substring(0, 7)));
    
    // মাসগুলোকে ক্রমানুসারে সাজিয়ে বড় থেকে ছোট হিসেবে রিটার্ন করা হচ্ছে
    return Array.from(months).sort().reverse();
  }, [transactions, loans]);

  const filteredData = useMemo(() => {
    const start = startOfMonth(parseISO(`${selectedMonth}-01`));
    const end = endOfMonth(start);

    const filteredTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start, end });
    });

    const filteredLoans = loans.filter(l => {
      const date = parseISO(l.date);
      return isWithinInterval(date, { start, end });
    });

    return { transactions: filteredTransactions, loans: filteredLoans };
  }, [selectedMonth, transactions, loans]);

  const stats = useMemo(() => {
    const totalIncome = filteredData.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalLoanTaken = filteredData.loans.reduce((sum, l) => sum + l.totalAmount, 0);
    const totalLoanPaid = filteredData.loans.reduce((sum, l) => sum + l.paidAmount, 0);
    
    const cashBalance = (totalIncome + totalLoanTaken) - totalExpense;
    
    // গ্রাফের জন্য ব্যয়গুলো ক্যাটাগরি অনুযায়ী গ্রুপ করা হচ্ছে
    const expenseByCategory = filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const chartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    return { 
      totalIncome, 
      totalExpense, 
      totalLoanTaken, 
      totalLoanPaid, 
      cashBalance, 
      chartData 
    };
  }, [filteredData]);

  const COLORS = ['#ff0000', '#cc0000', '#990000', '#ff3333', '#ff6666', '#330000'];

  if (isLoading) return null;

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg">
            <ChartIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black font-headline text-primary uppercase">হিসাব রিপোর্ট</h1>
        </div>

        {/* মাস সিলেকশন ড্রপডাউন */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border-2 border-primary/5 shadow-sm">
          <CalendarIcon className="w-5 h-5 text-primary ml-2" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="border-none shadow-none focus:ring-0 font-bold text-base h-10">
              <SelectValue placeholder="মাস নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-primary/5 shadow-xl">
              {availableMonths.map(month => (
                <SelectItem key={month} value={month} className="font-bold">
                  {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: bn })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden border-2 border-primary/5">
        <CardHeader className="bg-primary text-primary-foreground p-8">
          <CardTitle className="text-xs font-black opacity-90 uppercase tracking-widest">নগদ অবশিষ্ট (এই মাসে)</CardTitle>
          <div className="flex justify-between items-end mt-4">
            <p className="text-4xl font-black tracking-tighter">
              {settings.currency}{stats.cashBalance.toLocaleString()}
            </p>
            <Wallet className="w-10 h-10 opacity-30" />
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="flex divide-x divide-primary/10">
            <div className="flex-1 p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">মোট আয়</p>
              <p className="text-xl font-black text-green-600">
                {settings.currency}{stats.totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="flex-1 p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">মোট ব্যয়</p>
              <p className="text-xl font-black text-primary">
                {settings.currency}{stats.totalExpense.toLocaleString()}
              </p>
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
                    data={stats.chartData.length > 0 ? stats.chartData : [{ name: 'তথ্য নেই', value: 1 }]} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {stats.chartData.length > 0 ? stats.chartData.map((entry, index) => (
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
          <HandCoins className="w-5 h-5 text-primary" /> ঋণের অবস্থা (এই মাসে)
        </h2>
        <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-primary/5 space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><HandCoins className="w-5 h-5 text-primary" /></div>
              <span className="font-black text-xs uppercase tracking-tight">নতুন ঋণ নেওয়া</span>
            </div>
            <span className="font-black text-2xl text-primary">
              {settings.currency}{stats.totalLoanTaken.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>পরিশোধ করা হয়েছে</span>
              <span className="text-primary">{settings.currency}{stats.totalLoanPaid.toLocaleString()}</span>
            </div>
            <Progress value={stats.totalLoanTaken > 0 ? (stats.totalLoanPaid / stats.totalLoanTaken) * 100 : 0} className="h-2.5 bg-primary/10" />
          </div>
        </Card>
      </section>
    </div>
  );
}
