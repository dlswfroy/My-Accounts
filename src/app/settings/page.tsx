
"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Tag, Plus, X, Mail, Phone, ShieldCheck, Target } from 'lucide-react';
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
      setProfile({ userName: settings.userName, email: settings.email || '', mobile: settings.mobile || '' });
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

  const handleSetBudget = (cat: string, val: string) => {
    const num = parseFloat(val) || 0;
    const newBudgets = { ...settings.budgets, [cat]: num };
    if (num <= 0) delete newBudgets[cat];
    updateSettings({ budgets: newBudgets });
    toast({ title: 'বাজেট সেট হয়েছে', description: `${cat} খাতের বাজেট আপডেট করা হয়েছে।` });
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black font-headline uppercase text-primary">সেটিং</h1>
      </div>

      <Card className="bg-white border-none shadow-sm rounded-[2rem]">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2 font-black uppercase"><User className="w-5 h-5 text-primary" /> প্রোফাইল</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label className="font-bold">আপনার নাম</Label><Input value={profile.userName} onChange={e => setProfile({...profile, userName: e.target.value})} className="rounded-xl" /></div>
          <div className="space-y-2"><Label className="font-bold">মোবাইল নম্বর</Label><Input value={profile.mobile} onChange={e => setProfile({...profile, mobile: e.target.value})} className="rounded-xl" /></div>
          <Button onClick={handleSaveProfile} className="w-full bg-primary font-black uppercase rounded-xl">সংরক্ষণ করুন</Button>
        </CardContent>
      </Card>

      {/* Budget Management */}
      <Card className="bg-white border-none shadow-sm rounded-[2rem]">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2 font-black uppercase"><Target className="w-5 h-5 text-primary" /> মাসিক বাজেট সেট করুন</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {settings.expenseCategories.map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <Label className="flex-1 font-bold text-xs uppercase">{cat}</Label>
                <div className="flex gap-2 w-32">
                  <Input 
                    type="number" 
                    placeholder="বাজেট" 
                    className="h-8 rounded-lg text-xs" 
                    value={budgetVal[cat] || ''} 
                    onChange={e => setBudgetVal({...budgetVal, [cat]: e.target.value})}
                  />
                  <Button size="sm" onClick={() => handleSetBudget(cat, budgetVal[cat])} className="h-8 px-2"><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-none shadow-sm rounded-[2rem]">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2 font-black uppercase"><Tag className="w-5 h-5 text-primary" /> ক্যাটাগরি ব্যবস্থাপনা</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-black text-[10px] uppercase text-muted-foreground">ব্যয় ক্যাটাগরি</Label>
            <div className="flex flex-wrap gap-2">
              {settings.expenseCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="rounded-xl py-1 px-3 bg-primary/5 text-primary border-primary/10">
                  {cat} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => updateSettings({ expenseCategories: settings.expenseCategories.filter(c => c !== cat) })} />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
