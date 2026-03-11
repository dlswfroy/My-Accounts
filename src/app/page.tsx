
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, HandCoins, AlertTriangle, Info, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { monthlyFinancialSummary, type MonthlyFinancialSummaryOutput } from '@/ai/flows/monthly-financial-summary';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const { toast } = useToast();
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
  
  // নগদ জমা = (আয় + গৃহীত ঋণ) - ব্যয়
  const cashBalance = (totalIncomeTransactions + totalLoanTaken) - totalExpenseTransactions;
  // নিট ব্যালেন্স = নগদ জমা - বকেয়া ঋণ
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
    if (transactions.length < 3) {
      toast({
        title: "তথ্য অপর্যাপ্ত",
        description: "সঠিক পরামর্শের জন্য অন্তত ৩টি লেনদেনের রেকর্ড প্রয়োজন।",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await monthlyFinancialSummary({
        periodDescription: "এই মাস",
        incomeRecords: transactions
          .filter(t => t.type === 'income')
          .slice(0, 15)
          .map(t => ({ amount: t.amount, date: t.date, source: t.source || t.category })),
        expenseRecords: transactions
          .filter(t => t.type === 'expense')
          .slice(0, 15)
          .map(t => ({ amount: t.amount, date: t.date, category: t.category, purpose: t.purpose || '' })),
      });
      setAiSummary(result);
    } catch (e: any) {
      console.error("AI Error:", e);
      toast({
        variant: "destructive",
        title: "AI ত্রুটি",
        description: "API Key কনফিগার করা নেই অথবা সার্ভারে সমস্যা হচ্ছে।",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black font-headline text-foreground tracking-tight">সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase tracking-widest font-black border border-primary/20">
            {settings.userName}
          </p>
        </div>

        <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-[0_20px_40px_rgba(255,0,0,0.25)] relative overflow-hidden group border-4 border-white/10">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl border border-white/20">
                <Wallet className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <p className="text-xs font-black opacity-90 tracking-widest uppercase">নিট ব্যালেন্স (ঋণ পরিশোধের পর)</p>
            </div>
            
            <div>
              <p className={cn(
                "text-5xl font-black tracking-tighter flex items-baseline gap-2 drop-shadow-md",
                netBalance < 0 && "text-red-100"
              )}>
                <span className="text-2xl font-medium opacity-80">{settings.currency}</span>
                {netBalance.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-6 bg-black/10 w-fit px-4 py-2 rounded-2xl border border-white/10">
                <Info className="w-3.5 h-3.5" />
                <p className="text-[10px] font-bold tracking-tight">
                  পকেটে আছে: {settings.currency}{cashBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Advisor Section */}
      <section className="px-1">
        <Card className="bg-white border-2 border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> AI আর্থিক উপদেষ্টা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {!aiSummary ? (
              <div className="space-y-4">
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  আপনার আয়-ব্যয় বিশ্লেষণ করে সঞ্চয়ের বুদ্ধিদীপ্ত পরামর্শ পেতে নিচের বাটনে ক্লিক করুন।
                </p>
                <Button 
                  onClick={handleGenerateAiSummary} 
                  disabled={isAiLoading}
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs h-11 shadow-lg"
                >
                  {isAiLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> বিশ্লেষণ চলছে...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> পরামর্শ তৈরি করুন</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-foreground leading-relaxed">
                    {aiSummary.summary}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">পরামর্শসমূহ:</p>
                  <div className="space-y-2">
                    {aiSummary.spendingInsights.map((tip, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-3 bg-muted/30 rounded-xl border border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <p className="text-[11px] font-medium text-muted-foreground leading-snug">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setAiSummary(null)}
                  className="w-full text-[10px] font-black text-muted-foreground hover:text-primary gap-2"
                >
                  <RefreshCcw className="w-3 h-3" /> পুনরায় বিশ্লেষণ করুন
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-3">
          {upcomingLoanAlerts.map(loan => {
            const daysRemaining = differenceInDays(new Date(loan.dueDate!), currentDate);
            return (
              <Alert key={loan.id} className="bg-white border-2 border-primary/20 shadow-lg rounded-[1.8rem] overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div className="pl-2">
                  <AlertTitle className="font-black flex items-center justify-between text-xs text-primary mb-1">
                    ঋণ পরিশোধের সময় হয়েছে
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black border border-primary/20">{daysRemaining} দিন বাকি</span>
                  </AlertTitle>
                  <AlertDescription className="text-[11px] font-bold leading-relaxed opacity-80">
                    {loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করতে হবে।
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-2 border-border/40 shadow-xl rounded-[2.2rem] overflow-hidden group hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">নগদ জমা</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="text-xl font-black text-green-600 tracking-tighter">
              {settings.currency}{cashBalance.toLocaleString()}
            </div>
            <p className="text-[9px] font-bold text-muted-foreground mt-2 opacity-60 uppercase">ক্যাশ ইন হ্যান্ড</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-2 border-border/40 shadow-xl rounded-[2.2rem] overflow-hidden group hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">বকেয়া ঋণ</CardTitle>
            <HandCoins className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="text-xl font-black text-primary tracking-tighter">
              {settings.currency}{currentDebt.toLocaleString()}
            </div>
            <p className="text-[9px] font-bold text-muted-foreground mt-2 opacity-60 uppercase">মোট দেনা</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground tracking-tight uppercase">সাম্প্রতিক লেনদেন</h2>
          <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase border border-primary/20 tracking-tighter">সর্বশেষ ৫টি</span>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-[1.8rem] shadow-md border-2 border-transparent hover:border-primary/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    t.type === 'income' ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary"
                  )}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5 stroke-[2.5px]" /> : <ArrowDownCircle className="w-5 h-5 stroke-[2.5px]" />}
                  </div>
                  <div>
                    <p className="font-black text-sm text-foreground tracking-tight">{t.category}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                      {format(new Date(t.date), 'dd MMMM', { locale: bn })}
                      { (t.purpose || t.source) && ` • ${t.purpose || t.source}` }
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
          <div className="text-center py-12 bg-white rounded-[2.5rem] border-4 border-dashed border-muted/50">
            <p className="text-muted-foreground font-bold text-xs opacity-40 uppercase tracking-widest italic">কোন লেনদেন পাওয়া যায়নি</p>
          </div>
        )}
      </section>
    </div>
  );
}
