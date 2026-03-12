
"use client"

import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, BookOpen, Search, Wallet, HandCoins, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function CashbookPage() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const sectors = useMemo(() => {
    const categories = Array.from(new Set([...settings.incomeCategories, ...settings.expenseCategories, 'ঋণ পরিশোধ']));
    const loanPersons = loans.map(l => `ঋণ: ${l.personName}`);
    return ["all", ...categories, ...loanPersons];
  }, [settings, loans]);

  const filteredData = useMemo(() => {
    let txs = transactions;
    let lns = loans;

    if (selectedSector !== "all") {
      if (selectedSector.startsWith("ঋণ: ")) {
        const name = selectedSector.replace("ঋণ: ", "");
        txs = txs.filter(t => t.purpose?.includes(name) || t.source?.includes(name));
        lns = lns.filter(l => l.personName === name);
      } else {
        txs = txs.filter(t => t.category === selectedSector);
        lns = [];
      }
    }

    if (searchQuery) {
      txs = txs.filter(t => 
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return { transactions: txs, loans: lns };
  }, [selectedSector, searchQuery, transactions, loans]);

  const summary = useMemo(() => {
    const incomeTrans = filteredData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseTrans = filteredData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const totalTaken = filteredData.loans.reduce((sum, l) => sum + l.totalAmount, 0);
    const totalPaid = filteredData.loans.reduce((sum, l) => sum + l.paidAmount, 0);
    const remainingDebt = totalTaken - totalPaid;

    return { 
      incomeTrans, 
      expenseTrans, 
      totalTaken,
      totalPaid,
      remainingDebt,
      totalCategoryAmount: incomeTrans + expenseTrans,
      cashInHand: (incomeTrans + totalTaken) - expenseTrans 
    };
  }, [filteredData]);

  if (isLoading) return null;

  const isLoanSector = selectedSector.startsWith("ঋণ: ");
  const isAllSelected = selectedSector === "all";
  const isIncomeCategory = settings.incomeCategories.includes(selectedSector);
  const isExpenseCategory = settings.expenseCategories.includes(selectedSector) || selectedSector === 'ঋণ পরিশোধ';

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2.5 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black font-headline text-primary uppercase tracking-tight">ক্যাশ বুক</h1>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="লেনদেন খুঁজুন..." 
            className="pl-11 rounded-2xl h-12 border-2 border-primary/5 focus:border-primary/20 bg-white shadow-sm transition-all" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-full h-12 rounded-2xl border-2 border-primary/5 focus:ring-primary bg-white shadow-sm font-bold text-sm">
            <SelectValue placeholder="খাত বেছে নিন" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-2 border-primary/5 shadow-xl">
            <SelectItem value="all" className="font-bold">সকল খাতা</SelectItem>
            {sectors.filter(s => s !== "all").map(sector => (
              <SelectItem key={sector} value={sector} className="font-medium text-sm">{sector}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        {isLoanSector ? (
          <div className="space-y-4">
            <Card className="bg-primary p-6 rounded-[2.5rem] text-primary-foreground shadow-2xl relative overflow-hidden border-4 border-white/10">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <HandCoins className="w-20 h-20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">অবশিষ্ট বকেয়া ঋণ</p>
              <p className="text-4xl font-black tracking-tighter">
                {settings.currency}{summary.remainingDebt.toLocaleString()}
              </p>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white border-2 border-primary/5 p-5 rounded-[2rem] shadow-xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">মোট ঋণ</p>
                <p className="text-xl font-black text-foreground">
                  {settings.currency}{summary.totalTaken.toLocaleString()}
                </p>
              </Card>
              <Card className="bg-white border-2 border-primary/5 p-5 rounded-[2rem] shadow-xl">
                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-1">পরিশোধিত</p>
                <p className="text-xl font-black text-green-600">
                  {settings.currency}{summary.totalPaid.toLocaleString()}
                </p>
              </Card>
            </div>
          </div>
        ) : isAllSelected ? (
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white border-2 border-primary/5 p-5 rounded-[2rem] shadow-xl shadow-black/[0.02]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">নগদ জমা</p>
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-black text-green-600 tracking-tighter">
                {settings.currency}{summary.cashInHand.toLocaleString()}
              </p>
            </Card>
            <Card className="bg-white border-2 border-primary/5 p-5 rounded-[2rem] shadow-xl shadow-black/[0.02]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">মোট ব্যয়</p>
                <ArrowDownCircle className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-primary tracking-tighter">
                {settings.currency}{summary.expenseTrans.toLocaleString()}
              </p>
            </Card>
          </div>
        ) : (
          <Card className="bg-white border-2 border-primary/5 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isIncomeCategory ? "text-green-600" : "text-primary"
              )}>
                {isIncomeCategory ? "মোট জমা" : "মোট ব্যয়"}
              </p>
              {isIncomeCategory ? (
                <ArrowUpCircle className="w-5 h-5 text-green-600 opacity-50" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-primary opacity-50" />
              )}
            </div>
            <p className={cn(
              "text-4xl font-black tracking-tighter",
              isIncomeCategory ? "text-green-600" : "text-primary"
            )}>
              {settings.currency}{summary.totalCategoryAmount.toLocaleString()}
            </p>
          </Card>
        )}
      </div>

      {/* Transaction List */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1 flex items-center gap-2">
          লেনদেন সমূহ {filteredData.transactions.length > 0 && <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[8px]">{filteredData.transactions.length}</span>}
        </h2>
        {filteredData.transactions.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] text-muted-foreground font-bold text-[10px] uppercase italic tracking-widest border-2 border-dashed border-muted">তথ্য পাওয়া যায়নি</div>
        ) : (
          filteredData.transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-[2rem] shadow-sm border-2 border-primary/5 hover:border-primary/10 transition-all">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2.5 rounded-2xl shadow-sm", 
                  t.type === 'income' ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary"
                )}>
                  {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">{t.category}</p>
                  <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                    {format(new Date(t.date), 'dd MMM, yyyy', { locale: bn })}
                    {t.purpose && <span className="opacity-50">| {t.purpose}</span>}
                  </p>
                </div>
              </div>
              <div className={cn("font-black text-sm tracking-tight", t.type === 'income' ? "text-green-600" : "text-primary")}>
                {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
