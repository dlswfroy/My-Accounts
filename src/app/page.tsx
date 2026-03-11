
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, HandCoins, AlertTriangle, Info, Sparkles, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { monthlyFinancialSummary, type MonthlyFinancialSummaryOutput } from '@/ai/flows/monthly-financial-summary';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [aiSummary, setAiSummary] = useState<MonthlyFinancialSummaryOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  if (isLoading || !currentDate) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary"></div>
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
  
  const cashBalance = (totalIncomeTransactions + totalLoanTaken) - totalExpenseTransactions;
  const netBalance = cashBalance - currentDebt;

  const upcomingLoanAlerts = loans.filter(loan => {
    if (!loan.dueDate || loan.paidAmount >= loan.totalAmount) return false;
    try {
      const daysRemaining = differenceInDays(new Date(loan.dueDate), currentDate);
      return daysRemaining >= 0 && daysRemaining <= 15;
    } catch (e) {
      return false;
    }
  });

  const handleGenerateAiSummary = async () => {
    setIsAiLoading(true);
    try {
      const result = await monthlyFinancialSummary({
        periodDescription: "এই মাস",
        incomeRecords: transactions
          .filter(t => t.type === 'income')
          .slice(0, 20)
          .map(t => ({ amount: t.amount, date: t.date, source: t.source || t.category })),
        expenseRecords: transactions
          .filter(t => t.type === 'expense')
          .slice(0, 20)
          .map(t => ({ amount: t.amount, date: t.date, category: t.category, purpose: t.purpose || '' })),
      });
      setAiSummary(result);
    } catch (e) {
      console.error("AI Error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black font-headline text-foreground tracking-tight">সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase tracking-widest font-black border border-primary/20">
            {settings.userName}
          </p>
        </div>

        <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-[0_20px_50px_rgba(255,0,0,0.3)] relative overflow-hidden group border-4 border-white/20">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/25 rounded-2xl backdrop-blur-xl border border-white/30 shadow-inner">
                <Wallet className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <p className="text-sm font-black opacity-95 tracking-wide uppercase">অবশিষ্ট ব্যালেন্স (ঋণ সহ)</p>
            </div>
            
            <div>
              <p className={cn(
                "text-5xl font-black tracking-tighter drop-shadow-2xl flex items-baseline gap-2",
                netBalance < 0 && "text-red-100"
              )}>
                <span className="text-3xl font-medium">{settings.currency}</span>
                {netBalance.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-5 bg-black/20 w-fit px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                <Info className="w-4 h-4 text-white" />
                <p className="text-[11px] font-black tracking-tight">
                  নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Advisor Section */}
      <section className="px-1">
        <Card className="bg-gradient-to-br from-white to-primary/5 border-2 border-primary/20 shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" /> AI আর্থিক উপদেষ্টা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {!aiSummary ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  আপনার লেনদেন বিশ্লেষণ করে সঞ্চয়ের বুদ্ধিদীপ্ত পরামর্শ পেতে নিচের বাটনে ক্লিক করুন।
                </p>
                <Button 
                  onClick={handleGenerateAiSummary} 
                  disabled={isAiLoading}
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs h-10 shadow-lg"
                >
                  {isAiLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> বিশ্লেষণ করা হচ্ছে...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> পরামর্শ নিন</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-foreground leading-relaxed">
                    {aiSummary.summary}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">টিপসসমূহ:</p>
                  <ul className="space-y-2">
                    {aiSummary.spendingInsights.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 items-start text-[11px] font-medium text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setAiSummary(null)}
                  className="w-full text-[10px] font-black text-muted-foreground hover:text-primary"
                >
                  পুনরায় বিশ্লেষণ করুন
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-4">
          {upcomingLoanAlerts.map(loan => {
            const daysRemaining = differenceInDays(new Date(loan.dueDate!), currentDate);
            return (
              <Alert key={loan.id} variant="destructive" className="bg-white border-2 border-primary text-foreground shadow-2xl rounded-[1.5rem] overflow-hidden animate-in slide-in-from-left duration-500">
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-primary"></div>
                <AlertTriangle className="h-6 w-6 text-primary" />
                <div className="pl-3">
                  <AlertTitle className="font-black flex items-center justify-between text-sm text-primary mb-1">
                    ঋণ পরিশোধের সময় হয়েছে
                    <span className="text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-full font-black shadow-lg">{daysRemaining} দিন বাকি</span>
                  </AlertTitle>
                  <AlertDescription className="text-xs font-black leading-relaxed opacity-80">
                    <b>{loan.personName}</b>-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করুন।
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-2 border-border/50 shadow-2xl rounded-[2rem] hover:scale-[1.03] transition-all duration-500 overflow-hidden group">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">নগদ টাকা</CardTitle>
            <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-500">
              <ArrowUpCircle className="w-4 h-4 text-green-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="text-2xl font-black text-green-600 tracking-tighter">
              {settings.currency}{cashBalance.toLocaleString()}
            </div>
            <p className="text-[10px] font-black text-muted-foreground mt-2 opacity-60 uppercase tracking-tighter">ক্যাশ ইন হ্যান্ড</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-2 border-border/50 shadow-2xl rounded-[2rem] hover:scale-[1.03] transition-all duration-500 overflow-hidden group">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">বকেয়া ঋণ</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-500">
              <HandCoins className="w-4 h-4 text-primary group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="text-2xl font-black text-primary tracking-tighter">
              {settings.currency}{currentDebt.toLocaleString()}
            </div>
            <p className="text-[10px] font-black text-muted-foreground mt-2 opacity-60 uppercase tracking-tighter">মোট দেনা</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground tracking-tight">সাম্প্রতিক লেনদেন</h2>
          <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">শীর্ষ ৫টি</span>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-[1.8rem] shadow-xl border-2 border-transparent hover:border-primary/20 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3.5 rounded-2xl shadow-inner",
                    t.type === 'income' ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary"
                  )}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-6 h-6 stroke-[3px]" /> : <ArrowDownCircle className="w-6 h-6 stroke-[3px]" />}
                  </div>
                  <div>
                    <p className="font-black text-base text-foreground tracking-tight">{t.category}</p>
                    <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-2 mt-1">
                      {format(new Date(t.date), 'dd MMMM', { locale: bn })}
                      { (t.purpose || t.source) && <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full"></span> }
                      <span className="truncate max-w-[100px]">{ t.purpose || t.source }</span>
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-black text-lg tracking-tighter",
                  t.type === 'income' ? "text-green-600" : "text-primary"
                )}>
                  {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-[2.5rem] shadow-inner border-4 border-dashed border-muted">
            <p className="text-muted-foreground font-black text-sm italic opacity-50 uppercase tracking-widest">এখনো কোন লেনদেন হয়নি</p>
          </div>
        )}
      </section>
    </div>
  );
}
