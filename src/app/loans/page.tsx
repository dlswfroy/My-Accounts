"use client"

import React, { useState } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, HandCoins, CheckCircle2, History, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

export default function LoansPage() {
  const { loans, settings, addLoan, updateLoanPayment, deleteLoan } = useTransactions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  
  const [loanForm, setLoanForm] = useState({
    personName: '',
    totalAmount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    note: ''
  });

  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.personName || !loanForm.totalAmount) return;

    addLoan({
      personName: loanForm.personName,
      totalAmount: parseFloat(loanForm.totalAmount),
      date: loanForm.date,
      dueDate: loanForm.dueDate || undefined,
      note: loanForm.note
    });

    setLoanForm({
      personName: '',
      totalAmount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: '',
      note: ''
    });
    setIsAddDialogOpen(false);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !paymentAmount) return;

    updateLoanPayment(selectedLoanId, parseFloat(paymentAmount));
    setPaymentAmount('');
    setIsPayDialogOpen(false);
    setSelectedLoanId(null);
  };

  const totalLoanTaken = loans.reduce((sum, l) => sum + l.totalAmount, 0);
  const totalLoanPaid = loans.reduce((sum, l) => sum + l.paidAmount, 0);
  const currentDebt = totalLoanTaken - totalLoanPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">ঋণ ব্যবস্থাপনা</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full w-12 h-12 p-0 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline">নতুন ঋণ যোগ করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLoan} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="personName">ব্যক্তির নাম</Label>
                <Input 
                  id="personName" 
                  placeholder="কার থেকে নিয়েছেন?" 
                  value={loanForm.personName}
                  onChange={e => setLoanForm({...loanForm, personName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">ঋণের পরিমাণ</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings.currency}</span>
                  <Input 
                    id="totalAmount" 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-8" 
                    value={loanForm.totalAmount}
                    onChange={e => setLoanForm({...loanForm, totalAmount: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">গ্রহণের তারিখ</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={loanForm.date}
                    onChange={e => setLoanForm({...loanForm, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">পরিশোধের তারিখ</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={loanForm.dueDate}
                    onChange={e => setLoanForm({...loanForm, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">নোট (অপশনাল)</Label>
                <Input 
                  id="note" 
                  placeholder="অতিরিক্ত তথ্য" 
                  value={loanForm.note}
                  onChange={e => setLoanForm({...loanForm, note: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-2">সংরক্ষণ করুন</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-muted-foreground">বর্তমান মোট ঋণ</p>
            <HandCoins className="w-5 h-5 text-primary opacity-50" />
          </div>
          <p className="text-3xl font-bold text-primary">{settings.currency}{currentDebt.toLocaleString()}</p>
          <div className="mt-4 flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">মোট নেওয়া: </span>
              <span className="font-semibold">{settings.currency}{totalLoanTaken.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">পরিশোধিত: </span>
              <span className="font-semibold text-green-600">{settings.currency}{totalLoanPaid.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">ঋণের তালিকা</h2>
        {loans.length > 0 ? (
          loans.map((loan) => (
            <div key={loan.id} className="bg-white p-4 rounded-2xl shadow-sm space-y-3 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{loan.personName}</h3>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> গ্রহণ: {format(new Date(loan.date), 'dd MMM, yyyy', { locale: bn })}
                    </p>
                    {loan.dueDate && (
                      <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> পরিশোধের সম্ভাব্য তারিখ: {format(new Date(loan.dueDate), 'dd MMM, yyyy', { locale: bn })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{settings.currency}{(loan.totalAmount - loan.paidAmount).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">বাকি পাওনা</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>পরিশোধিত: {settings.currency}{loan.paidAmount.toLocaleString()}</span>
                  <span>মোট: {settings.currency}{loan.totalAmount.toLocaleString()}</span>
                </div>
                <Progress value={(loan.paidAmount / loan.totalAmount) * 100} className="h-1.5" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs h-8"
                  onClick={() => {
                    setSelectedLoanId(loan.id);
                    setIsPayDialogOpen(true);
                  }}
                  disabled={loan.paidAmount >= loan.totalAmount}
                >
                  <History className="w-3 h-3 mr-1" />
                  পরিশোধ করুন
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteLoan(loan.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {loan.paidAmount >= loan.totalAmount && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground italic">
            এখনো কোন ঋণের রেকর্ড নেই।
          </div>
        )}
      </div>

      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">ঋণ পরিশোধ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="payAmount">পরিশোধের পরিমাণ</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings.currency}</span>
                <Input 
                  id="payAmount" 
                  type="number" 
                  placeholder="0.00" 
                  className="pl-8" 
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-primary mt-2">পরিশোধ নিশ্চিত করুন</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
