
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpCircle, ArrowDownCircle, HandCoins, AlertTriangle, Info, Sparkles, Loader2, RefreshCcw, Target, Mic, MicOff, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { monthlyFinancialSummary, type MonthlyFinancialSummaryOutput } from '@/ai/flows/monthly-financial-summary';
import { parseVoiceCommand } from '@/ai/flows/parse-voice-command';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { transactions, loans, settings, isLoading, addTransaction } = useTransactions();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [aiSummary, setAiSummary] = useState<MonthlyFinancialSummaryOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setCurrentTime(now);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'bn-BD';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          setIsListening(false);
          handleVoiceCommand(text);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast({ variant: "destructive", title: "ভয়েস এরর", description: "কথা শুনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => clearInterval(timer);
  }, []);

  const handleVoiceCommand = async (text: string) => {
    setIsProcessingVoice(true);
    toast({ title: "প্রসেসিং হচ্ছে...", description: `আপনি বলেছেন: "${text}"` });
    
    try {
      const result = await parseVoiceCommand({
        text,
        incomeCategories: settings.incomeCategories,
        expenseCategories: settings.expenseCategories
      });

      if (result.success) {
        addTransaction({
          type: result.type,
          amount: result.amount,
          category: result.category,
          purpose: result.purpose,
          date: new Date().toISOString().split('T')[0],
          source: result.type === 'income' ? result.purpose : ''
        });
        toast({ title: "সফল!", description: `${result.amount} টাকা ${result.category} খাতে সেভ করা হয়েছে।` });
      } else {
        toast({ variant: "destructive", title: "ব্যর্থ", description: "দুঃখিত, আমি আপনার কথাটি বুঝতে পারিনি।" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "ভয়েস প্রসেসিংয়ে সমস্যা হয়েছে।" });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast({ variant: "destructive", title: "সমর্থিত নয়", description: "আপনার ব্রাউজার ভয়েস ইনপুট সমর্থন করে না।" });
        return;
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (isLoading || !currentDate) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  const totalIncomeTransactions = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseTransactions = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalLoanTaken = loans.reduce((sum, l) => sum + l.totalAmount, 0);
  const currentDebt = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
  const cashBalance = (totalIncomeTransactions + totalLoanTaken) - totalExpenseTransactions;
  const netBalance = cashBalance - currentDebt;

  const upcomingLoanAlerts = loans.filter(loan => {
    if (!loan.dueDate || loan.paidAmount >= loan.totalAmount) return false;
    const daysRemaining = differenceInDays(new Date(loan.dueDate), currentDate);
    return daysRemaining >= 0 && daysRemaining <= 15;
  });

  const handleGenerateAiSummary = async () => {
    if (transactions.length < 3) {
      toast({ title: "তথ্য অপর্যাপ্ত", description: "সফল বিশ্লেষণের জন্য অন্তত ৩টি লেনদেন প্রয়োজন।" });
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await monthlyFinancialSummary({
        periodDescription: "এই মাস",
        incomeRecords: transactions.filter(t => t.type === 'income').slice(0, 15).map(t => ({ amount: t.amount, date: t.date, source: t.source || t.category })),
        expenseRecords: transactions.filter(t => t.type === 'expense').slice(0, 15).map(t => ({ amount: t.amount, date: t.date, category: t.category, purpose: t.purpose || '' })),
      });
      setAiSummary(result);
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI ত্রুটি", description: "সার্ভারে সমস্যা অথবা API কী চেক করুন।" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const categorySpending = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header with Clock and Date */}
      <section className="flex justify-between items-start px-1">
        <div>
          <h2 className="text-xl font-black font-headline text-foreground tracking-tight uppercase">সারসংক্ষেপ</h2>
          <p className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider font-black border-2 border-primary/20 inline-block mt-1">
            {settings.userName}
          </p>
        </div>
        {currentTime && (
          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-black tracking-tighter tabular-nums">
                {format(currentTime, 'hh:mm:ss a')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: bn })}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="bg-primary p-6 rounded-[2.5rem] text-primary-foreground shadow-2xl relative overflow-hidden group border-4 border-white/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xl border border-white/20 shadow-inner">
                <Wallet className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <p className="text-[11px] font-black opacity-90 tracking-widest uppercase">নিট অবশিষ্ট (ঋণ বাদে)</p>
            </div>
            <div className="overflow-hidden">
              <p className={cn("text-4xl sm:text-5xl font-black tracking-tighter flex items-baseline gap-1.5 leading-tight flex-wrap", netBalance < 0 && "text-white/90")}>
                <span className="text-lg font-medium opacity-70">{settings.currency}</span>{netBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2.5 mt-1 bg-black/20 w-fit px-4 py-2 rounded-xl border border-white/10 shadow-sm">
              <Info className="w-4 h-4 text-white/70" />
              <p className="text-[11px] font-black uppercase tracking-tight">নগদ জমা: {settings.currency}{cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Input Section */}
      <section className="flex justify-center -mt-10 relative z-20">
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={toggleListening}
            disabled={isProcessingVoice}
            className={cn(
              "w-20 h-20 rounded-full shadow-2xl transition-all duration-300 border-4 border-white",
              isListening ? "bg-green-500 scale-110 animate-pulse" : "bg-primary scale-100",
              isProcessingVoice && "opacity-50"
            )}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : (isProcessingVoice ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />)}
          </Button>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white px-3 py-1 rounded-full shadow-sm">
            {isListening ? "বলুন..." : (isProcessingVoice ? "বুঝছি..." : "ভয়েস দিয়ে লিখুন")}
          </p>
        </div>
      </section>

      {/* Upcoming Loans Alerts */}
      {upcomingLoanAlerts.length > 0 && (
        <div className="space-y-4 px-1">
          {upcomingLoanAlerts.map(loan => {
            const daysLeft = differenceInDays(new Date(loan.dueDate!), currentDate);
            return (
              <Alert key={loan.id} className="bg-white border-2 border-primary/20 shadow-2xl rounded-[1.8rem] relative overflow-hidden py-4">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
                <AlertTriangle className="h-5 w-5 text-primary ml-1" />
                <div className="pl-3">
                  <div className="flex justify-between items-start">
                    <AlertTitle className="font-black text-[12px] text-primary mb-0.5 uppercase tracking-tight">ঋণ পরিশোধের সময় হয়েছে</AlertTitle>
                    <span className="bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                      {daysLeft === 0 ? "আজই শেষ দিন" : `${daysLeft} দিন বাকি`}
                    </span>
                  </div>
                  <AlertDescription className="text-[11px] font-bold opacity-80">
                    {loan.personName}-কে {settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()} পরিশোধ করুন।
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Budget Progress Section */}
      {Object.keys(settings.budgets).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2.5 px-1">
            <Target className="w-5 h-5 text-primary" /> বাজেট ট্র্যাকার
          </h2>
          <div className="grid gap-3">
            {Object.entries(settings.budgets).map(([cat, limit]) => {
              const spent = categorySpending[cat] || 0;
              const percent = Math.min((spent / limit) * 100, 100);
              const isOverBudget = spent > limit;
              return (
                <div key={cat} className="bg-white p-4 rounded-[1.8rem] shadow-lg border-2 border-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex justify-between text-[11px] font-black mb-2">
                    <span className="text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">{cat}</span>
                    <span className={cn("tracking-tighter", isOverBudget ? "text-primary" : "text-green-600")}>
                      {settings.currency}{spent.toLocaleString()} / {settings.currency}{limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className={cn("h-2.5 bg-muted/50", isOverBudget ? "bg-primary/20" : "bg-green-100")} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* AI Advisor */}
      <section className="px-1">
        <Card className="bg-white border-2 border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-black flex items-center gap-2.5 text-primary uppercase tracking-[0.2em]">
              <div className="p-2 bg-primary/10 rounded-xl"><Sparkles className="w-4 h-4" /></div>
              AI আর্থিক উপদেষ্টা
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {!aiSummary ? (
              <Button 
                onClick={handleGenerateAiSummary} 
                disabled={isAiLoading} 
                className="w-full rounded-2xl bg-primary hover:bg-primary/90 font-black text-[11px] h-12 shadow-xl active:scale-95 transition-all"
              >
                {isAiLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <><Sparkles className="w-4 h-4 mr-2" /> আজই পরামর্শ নিন</>}
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="p-4 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                  <p className="text-[11px] font-bold leading-relaxed">{aiSummary.summary}</p>
                </div>
                <div className="space-y-2">
                  {aiSummary.spendingInsights.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 bg-muted/20 rounded-xl border border-transparent hover:border-primary/10 transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_6px_rgba(255,0,0,0.5)]" />
                      <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setAiSummary(null)} className="w-full text-[10px] font-black text-muted-foreground gap-2 h-9 hover:bg-primary/5"><RefreshCcw className="w-3 h-3" /> পুনরায় বিশ্লেষণ করুন</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[2rem] p-5 hover:border-primary/20 transition-all">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex justify-between items-center">নগদ <ArrowUpCircle className="w-4 h-4 text-green-600" /></div>
          <div className="text-xl font-black text-green-600 tracking-tighter truncate">{settings.currency}{cashBalance.toLocaleString()}</div>
        </Card>
        <Card className="bg-white border-2 border-primary/5 shadow-2xl rounded-[2rem] p-5 hover:border-primary/20 transition-all">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex justify-between items-center">বকেয়া ঋণ <HandCoins className="w-4 h-4 text-primary" /></div>
          <div className="text-xl font-black text-primary tracking-tighter truncate">{settings.currency}{currentDebt.toLocaleString()}</div>
        </Card>
      </div>
    </div>
  );
}
