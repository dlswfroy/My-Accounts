
"use client"

import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  HandCoins, 
  User, 
  Tag, 
  Search,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function CashbookPage() {
  const { transactions, loans, settings, isLoading } = useTransactions();
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const sectors = useMemo(() => {
    const categories = Array.from(new Set([
      ...settings.incomeCategories,
      ...settings.expenseCategories,
      'ঋণ পরিশোধ'
    ]));
    const loanPersons = loans.map(l => `ঋণ: ${l.personName}`);
    return ["all", ...categories, ...loanPersons];
  }, [settings, loans]);

  const filteredData = useMemo(() => {
    if (selectedSector === "all") {
      return {
        transactions: transactions,
        loans: loans
      };
    }

    if (selectedSector.startsWith("ঋণ: ")) {
      const personName = selectedSector.replace("ঋণ: ", "");
      return {
        transactions: transactions.filter(t => t.purpose?.includes(personName) || t.source?.includes(personName)),
        loans: loans.filter(l => l.personName === personName)
      };
    }

    return {
      transactions: transactions.filter(t => t.category === selectedSector),
      loans: []
    };
  }, [selectedSector, transactions, loans]);

  const summary = useMemo(() => {
    const incomeTrans = filteredData.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseTrans = filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLoanTaken = filteredData.loans.reduce((sum, l) => sum + l.totalAmount, 0);
    const totalLoanPaid = filteredData.loans.reduce((sum, l) => sum + l.paidAmount, 0);
    const currentDebt = totalLoanTaken - totalLoanPaid;

    // নগদ জমা = (আয় + গৃহীত ঋণ) - ব্যয়
    const cashInHand = (incomeTrans + totalLoanTaken) - expenseTrans;

    return { incomeTrans, expenseTrans, currentDebt, totalLoanTaken, totalLoanPaid, cashInHand };
  }, [filteredData]);

  if (isLoading) return null;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl text-primary-foreground">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold font-headline text-primary">ক্যাশ বুক</h1>
      </div>

      <Card className="bg-white border-none shadow-md overflow-hidden rounded-[2rem]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Search className="w-4 h-4" /> খাত নির্বাচন করুন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-full h-12 rounded-2xl border-2 border-primary/20 focus:ring-primary">
              <SelectValue placeholder="খাত বেছে নিন" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">সকল লেনদেন</SelectItem>
              {sectors.filter(s => s !== "all").map(sector => (
                <SelectItem key={sector} value={sector}>
                  <div className="flex items-center gap-2">
                    {sector.startsWith("ঋণ: ") ? <User className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                    {sector}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-none shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold text-green-700 uppercase">নগদ জমা</p>
            <p className="text-xl font-bold text-green-600">
              {settings.currency}{summary.cashInHand.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase">মোট ব্যয়</p>
            <p className="text-xl font-bold text-primary">
              {settings.currency}{summary.expenseTrans.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        {summary.totalLoanTaken > 0 && (
          <>
            <Card className="bg-amber-50 border-none shadow-sm">
              <CardContent className="p-4 space-y-1">
                <p className="text-[10px] font-bold text-amber-700 uppercase">বকেয়া ঋণ</p>
                <p className="text-xl font-bold text-amber-600">
                  {settings.currency}{summary.currentDebt.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-none shadow-sm">
              <CardContent className="p-4 space-y-1">
                <p className="text-[10px] font-bold text-blue-700 uppercase">পরিশোধিত</p>
                <p className="text-xl font-bold text-blue-600">
                  {settings.currency}{summary.totalLoanPaid.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
          লেনদেনের ইতিহাস {selectedSector !== 'all' && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{selectedSector}</span>}
        </h2>
        
        <div className="space-y-3">
          {filteredData.transactions.length === 0 && filteredData.loans.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-[2rem] text-muted-foreground italic">
              এই খাতে কোনো লেনদেন পাওয়া যায়নি।
            </div>
          ) : (
            <>
              {filteredData.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-xl",
                      t.type === 'income' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                    )}>
                      {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.category}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(t.date), 'dd MMMM, yyyy', { locale: bn })}
                        { (t.purpose || t.source) && ` • ${t.purpose || t.source}` }
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-sm",
                    t.type === 'income' ? "text-green-600" : "text-primary"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{settings.currency}{t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              
              {filteredData.loans.map((l) => (
                <div key={l.id} className="p-4 bg-amber-50 rounded-2xl shadow-sm border border-amber-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-200 text-amber-700 rounded-xl">
                        <HandCoins className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">ঋণ গ্রহণ: {l.personName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          গ্রহণের তারিখ: {format(new Date(l.date), 'dd MMMM, yyyy', { locale: bn })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-700 font-bold text-sm">বাকি: {settings.currency}{(l.totalAmount - l.paidAmount).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">মোট: {settings.currency}{l.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
