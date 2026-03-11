"use client"

import React, { useState } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CreditCard, Tag, Plus, X, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { settings, updateSettings, isLoading } = useTransactions();
  const { toast } = useToast();
  const [userName, setUserName] = useState(settings.userName);
  const [newCat, setNewCat] = useState({ income: '', expense: '' });

  if (isLoading) return null;

  const handleSaveName = () => {
    updateSettings({ userName });
    toast({ title: 'সফল হয়েছে!', description: 'ব্যবহারকারীর নাম পরিবর্তন করা হয়েছে।' });
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
    const val = newCat[type].trim();
    if (!val) return;
    
    if (type === 'income') {
      if (settings.incomeCategories.includes(val)) return;
      updateSettings({ incomeCategories: [...settings.incomeCategories, val] });
      setNewCat({ ...newCat, income: '' });
    } else {
      if (settings.expenseCategories.includes(val)) return;
      updateSettings({ expenseCategories: [...settings.expenseCategories, val] });
      setNewCat({ ...newCat, expense: '' });
    }
  };

  const handleRemoveCategory = (type: 'income' | 'expense', cat: string) => {
    if (type === 'income') {
      updateSettings({ incomeCategories: settings.incomeCategories.filter(c => c !== cat) });
    } else {
      updateSettings({ expenseCategories: settings.expenseCategories.filter(c => c !== cat) });
    }
  };

  const handleClearAll = () => {
    if (confirm('আপনি কি নিশ্চিত যে আপনি সব তথ্য মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।')) {
      localStorage.removeItem('my_accounts_transactions');
      localStorage.removeItem('my_accounts_settings');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold font-headline">সেটিং</h1>

      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            প্রোফাইল
          </CardTitle>
          <CardDescription>আপনার ব্যক্তিগত তথ্য পরিবর্তন করুন</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>আপনার নাম</Label>
            <div className="flex gap-2">
              <Input value={userName} onChange={e => setUserName(e.target.value)} />
              <Button onClick={handleSaveName} className="bg-primary hover:bg-primary/90">সংরক্ষণ</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            আয়ের ক্যাটাগরি
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {settings.incomeCategories.map(cat => (
              <div key={cat} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2 group">
                {cat}
                <button onClick={() => handleRemoveCategory('income', cat)} className="hover:text-primary">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="নতুন ক্যাটাগরি" 
              value={newCat.income} 
              onChange={e => setNewCat({...newCat, income: e.target.value})} 
            />
            <Button onClick={() => handleAddCategory('income')} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            ব্যয়ের ক্যাটাগরি
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {settings.expenseCategories.map(cat => (
              <div key={cat} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2 group">
                {cat}
                <button onClick={() => handleRemoveCategory('expense', cat)} className="hover:text-primary">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="নতুন ক্যাটাগরি" 
              value={newCat.expense} 
              onChange={e => setNewCat({...newCat, expense: e.target.value})} 
            />
            <Button onClick={() => handleAddCategory('expense')} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            বিপদজনক এলাকা
          </CardTitle>
          <CardDescription>সব তথ্য চিরস্থায়ীভাবে মুছে ফেলুন</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" onClick={handleClearAll}>
            সকল তথ্য মুছুন (Reset App)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}