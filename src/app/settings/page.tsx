
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Tag, Plus, X, Target, Wallet, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { settings, updateSettings, isLoading } = useTransactions();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({ userName: '', email: '', mobile: '' });
  const [newCat, setNewCat] = useState({ income: '', expense: '' });
  const [budgetVal, setBudgetVal] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading) {
      setProfile({ 
        userName: settings.userName, 
        email: settings.email || '', 
        mobile: settings.mobile || '' 
      });
      const b: Record<string, string> = {};
      Object.entries(settings.budgets).forEach(([k, v]) => b[k] = v.toString());
      setBudgetVal(b);
    }
  }, [settings, isLoading]);

  if (isLoading) return null;

  const handleSaveProfile = () => {
    updateSettings(profile);
    toast({ title: 'সফল!', description: 'প্রোফাইল আপডেট করা হয়েছে।' });
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
    const val = type === 'income' ? newCat.income : newCat.expense;
    if (!val.trim()) return;

    if (type === 'income') {
      if (settings.incomeCategories.includes(val)) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "এই ক্যাটাগরি ইতিমধ্যে আছে।" });
        return;
      }
      updateSettings({ incomeCategories: [...settings.incomeCategories, val] });
      setNewCat({ ...newCat, income: '' });
    } else {
      if (settings.expenseCategories.includes(val)) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "এই ক্যাটাগরি ইতিমধ্যে আছে।" });
        return;
      }
      updateSettings({ expenseCategories: [...settings.expenseCategories, val] });
      setNewCat({ ...newCat, expense: '' });
    }
    toast({ title: 'সফল!', description: 'নতুন ক্যাটাগরি যোগ হয়েছে।' });
  };

  const handleRemoveCategory = (type: 'income' | 'expense', cat: string) => {
    if (type === 'income') {
      updateSettings({ incomeCategories: settings.incomeCategories.filter(c => c !== cat) });
    } else {
      updateSettings({ expenseCategories: settings.expenseCategories.filter(c => c !== cat) });
    }
    toast({ title: 'সফল!', description: 'ক্যাটাগরি মুছে ফেলা হয়েছে।' });
  };

  const handleSetBudget = (cat: string, val: string) => {
    const num = parseFloat(val) || 0;
    const newBudgets = { ...settings.budgets, [cat]: num };
    if (num <= 0) delete newBudgets[cat];
    updateSettings({ budgets: newBudgets });
    toast({ title: 'বাজেট সেট হয়েছে', description: `${cat} খাতের বাজেট আপডেট করা হয়েছে।` });
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-black font-headline uppercase text-primary tracking-tighter">সেটিং</h1>
      </div>

      {/* Profile Card */}
      <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm flex items-center gap-3 font-black uppercase tracking-widest text-primary">
            <div className="p-2 bg-primary/10 rounded-xl"><User className="w-4 h-4" /></div>
            প্রোফাইল
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="space-y-2">
            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-1">আপনার নাম</Label>
            <Input 
              value={profile.userName} 
              onChange={e => setProfile({...profile, userName: e.target.value})} 
              className="rounded-2xl h-12 border-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-black text-[10px] uppercase text-muted-foreground ml-1">মোবাইল নম্বর</Label>
            <Input 
              value={profile.mobile} 
              onChange={e => setProfile({...profile, mobile: e.target.value})} 
              className="rounded-2xl h-12 border-2 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSaveProfile} className="w-full bg-primary font-black uppercase rounded-2xl h-12 shadow-lg active:scale-95 transition-all">
            প্রোফাইল সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm flex items-center gap-3 font-black uppercase tracking-widest text-primary">
            <div className="p-2 bg-primary/10 rounded-xl"><Tag className="w-4 h-4" /></div>
            ক্যাটাগরি ব্যবস্থাপনা
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-8">
          {/* Income Categories */}
          <div className="space-y-4">
            <Label className="font-black text-[11px] uppercase text-green-600 flex items-center gap-2">
              <Wallet className="w-3 h-3" /> আয় ক্যাটাগরি
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="নতুন খাতের নাম" 
                value={newCat.income}
                onChange={e => setNewCat({...newCat, income: e.target.value})}
                className="rounded-xl h-10 border-2"
              />
              <Button onClick={() => handleAddCategory('income')} className="h-10 bg-green-600 rounded-xl px-4">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {settings.incomeCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="rounded-xl py-1.5 px-3 bg-green-50 text-green-700 border-green-100 font-bold text-[10px]">
                  {cat} <X className="w-3.5 h-3.5 ml-2 cursor-pointer hover:text-red-500" onClick={() => handleRemoveCategory('income', cat)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="space-y-4">
            <Label className="font-black text-[11px] uppercase text-primary flex items-center gap-2">
              <TrendingDown className="w-3 h-3" /> ব্যয় ক্যাটাগরি
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="নতুন খাতের নাম" 
                value={newCat.expense}
                onChange={e => setNewCat({...newCat, expense: e.target.value})}
                className="rounded-xl h-10 border-2"
              />
              <Button onClick={() => handleAddCategory('expense')} className="h-10 bg-primary rounded-xl px-4">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {settings.expenseCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="rounded-xl py-1.5 px-3 bg-primary/5 text-primary border-primary/10 font-bold text-[10px]">
                  {cat} <X className="w-3.5 h-3.5 ml-2 cursor-pointer hover:text-red-500" onClick={() => handleRemoveCategory('expense', cat)} />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Management */}
      <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm flex items-center gap-3 font-black uppercase tracking-widest text-primary">
            <div className="p-2 bg-primary/10 rounded-xl"><Target className="w-4 h-4" /></div>
            মাসিক বাজেট সেট করুন
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="grid gap-3">
            {settings.expenseCategories.map(cat => (
              <div key={cat} className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                <Label className="flex-1 font-black text-[11px] uppercase text-muted-foreground truncate">{cat}</Label>
                <div className="flex gap-2 w-36">
                  <Input 
                    type="number" 
                    placeholder="বাজেট" 
                    className="h-9 rounded-xl text-xs font-bold border-2" 
                    value={budgetVal[cat] || ''} 
                    onChange={e => setBudgetVal({...budgetVal, [cat]: e.target.value})}
                  />
                  <Button size="sm" onClick={() => handleSetBudget(cat, budgetVal[cat])} className="h-9 w-9 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
