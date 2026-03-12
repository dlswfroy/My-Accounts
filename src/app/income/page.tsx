
"use client"

import React, { useState } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function MyIncome() {
  const { transactions, settings, addTransaction, deleteTransaction } = useTransactions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    source: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const incomeTransactions = transactions.filter(t => t.type === 'income');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    addTransaction({
      type: 'income',
      amount: parseFloat(formData.amount),
      category: formData.category,
      source: formData.source,
      date: formData.date,
      purpose: ''
    });

    setFormData({
      amount: '',
      category: '',
      source: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">আমার আয়</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full w-12 h-12 p-0 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline">নতুন আয় যোগ করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">টাকার পরিমাণ</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings.currency}</span>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-8" 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ধরণ</Label>
                <Select 
                  onValueChange={val => setFormData({...formData, category: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ধরণ নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.incomeCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">উৎস (অপশনাল)</Label>
                <Input 
                  id="source" 
                  placeholder="যেমন: মাসিক বেতন" 
                  value={formData.source}
                  onChange={e => setFormData({...formData, source: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">তারিখ</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-2">সংরক্ষণ করুন</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {incomeTransactions.length > 0 ? (
          incomeTransactions.map((t) => (
            <div key={t.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(t.date), 'dd MMMM, yyyy', { locale: bn })}
                    {t.source && ` • ${t.source}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-green-600">
                  +{settings.currency}{t.amount.toLocaleString()}
                </span>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl max-w-[90vw]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                      <AlertDialogDescription>
                        এই আয়ের রেকর্ডটি মুছে ফেলা হবে। এটি আর ফিরে পাওয়া সম্ভব নয়।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">না</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteTransaction(t.id)}
                        className="bg-primary text-white rounded-xl"
                      >
                        হ্যাঁ, মুছে ফেলুন
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 space-y-4">
            <div className="p-6 bg-muted rounded-full">
              <Plus className="w-12 h-12" />
            </div>
            <p className="font-medium">কোন আয়ের রেকর্ড নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
}
