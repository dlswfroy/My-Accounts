
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
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(format(now, 'MM'));
  const [selectedYear, setSelectedYear] = useState<string>(format(now, 'yyyy'));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const months = [
    { value: '01', label: 'জানুয়ারি' },
    { value: '02', label: 'ফেব্রুয়ারি' },
    { value: '03', label: 'মার্চ' },
    { value: '04', label: 'এপ্রিল' },
    { value: '05', label: 'মে' },
    { value: '06', label: 'জুন' },
    { value: '07', label: 'জুলাই' },
    { value: '08', label: 'আগস্ট' },
    { value: '09', label: 'সেপ্টেম্বর' },
    { value: '10', label: 'অক্টোবর' },
    { value: '11', label: 'নভেম্বর' },
    { value: '12', label: 'ডিসেম্বর' },
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<string>();
    
    // ২০২০ থেকে বর্তমান + ৫ বছর পর্যন্ত
    for (let y = 2020; y <= currentYear + 5; y++) {
      yearsSet.add(y.toString());
    }
    
    // লেনদেন বা ঋণের ডেটা থাকলে ওই বছরগুলোও যোগ হবে
    transactions.forEach(t => yearsSet.add(t.date.substring(0, 4)));
    loans.forEach(l => yearsSet.add(l.date.substring(0, 4)));
    
    return Array.from(yearsSet).sort().reverse();
  }, [transactions, loans]);

  const filteredData = useMemo(() => {
    const start = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1));
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
  }, [selectedMonth, selectedYear, transactions, loans]);

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

        <div className="grid grid-cols-2 gap-2">
          {/* মাস সিলেকশন */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-primary/5 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-primary ml-2 hidden sm:block" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 font-bold text-sm h-10">
                <SelectValue placeholder="মাস" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 border-primary/5 shadow-xl max-h-[300px]">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value} className="font-bold">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* বছর সিলেকশন */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-primary/5 shadow-sm">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 font-bold text-sm h-10">
                <SelectValue placeholder="সাল" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 border-primary/5 shadow-xl max-h-[300px]">
                {years.map(year => (
                  <SelectItem key={year} value={year} className="font-bold">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden border-2 border-primary/5">
        <CardHeader className="bg-primary text-primary-foreground p-8">
          <CardTitle className="text-xs font-black opacity-90 uppercase tracking-widest">নগদ অবশিষ্ট</CardTitle>
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
          <HandCoins className="w-5 h-5 text-primary" /> ঋণের অবস্থা
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
