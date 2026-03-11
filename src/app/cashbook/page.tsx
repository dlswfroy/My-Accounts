
"use client"

import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, HandCoins, User, Tag, Search, BookOpen, XCircle } from 'lucide-react';
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
    const paid = filteredData.loans.reduce((sum, l) => sum + l.paidAmount, 0);
    return { incomeTrans, expenseTrans, currentDebt: totalTaken - paid, cashInHand: (incomeTrans + totalTaken) - expenseTrans };
  }, [filteredData]);

  if (isLoading) return null;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl text-primary-foreground"><BookOpen className="w-6 h-6" /></div>
        <h1 className="text-2xl font-black font-headline text-primary uppercase">ক্যাশ বুক</h1>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="লেনদেন খুঁজুন..." className="pl-10 rounded-2xl h-11 border-2 focus:ring-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-full h-11 rounded-2xl border-2 border-primary/10 focus:ring-primary bg-white">
            <SelectValue placeholder="খাত বেছে নিন" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">সকল খাতা</SelectItem>
            {sectors.filter(s => s !== "all").map(sector => (
              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-none p-4"><p className="text-[10px] font-black uppercase text-green-700">নগদ</p><p className="text-xl font-black text-green-600">{settings.currency}{summary.cashInHand.toLocaleString()}</p></Card>
        <Card className="bg-primary/5 border-none p-4"><p className="text-[10px] font-black uppercase text-primary">ব্যয়</p><p className="text-xl font-black text-primary">{settings.currency}{summary.expenseTrans.toLocaleString()}</p></Card>
      </div>

      <section className="space-y-3">
        {filteredData.transactions.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] text-muted-foreground font-bold text-xs uppercase italic">তথ্য পাওয়া যায়নি</div>
        ) : (
          filteredData.transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-3xl shadow-sm border border-transparent">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", t.type === 'income' ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary")}>
                  {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-black text-sm">{t.category}</p>
                  <p className="text-[9px] font-bold text-muted-foreground">{format(new Date(t.date), 'dd MMM, yyyy', { locale: bn })}</p>
                </div>
              </div>
              <div className={cn("font-black text-sm", t.type === 'income' ? "text-green-600" : "text-primary")}>
                {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
