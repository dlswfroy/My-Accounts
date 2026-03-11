"use client"

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/components/providers/TransactionProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Tag, Plus, X, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { settings, updateSettings, isLoading } = useTransactions();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    userName: '',
    email: '',
    mobile: ''
  });

  useEffect(() => {
    if (!isLoading) {
      setProfile({
        userName: settings.userName,
        email: settings.email || '',
        mobile: settings.mobile || ''
      });
    }
  }, [settings, isLoading]);

  const [newCat, setNewCat] = useState({ income: '', expense: '' });

  if (isLoading) return null;

  const handleSaveProfile = () => {
    updateSettings(profile);
    toast({ title: 'সফল হয়েছে!', description: 'প্রোফাইল তথ্য আপডেট করা হয়েছে।' });
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

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">সেটিং</h1>
        {settings.isAdmin && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 px-3 py-1">
            <ShieldCheck className="w-3 h-3" /> এডমিন
          </Badge>
        )}
      </div>

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
            <Label className="flex items-center gap-2"><User className="w-4 h-4" /> আপনার নাম</Label>
            <Input 
              value={profile.userName} 
              onChange={e => setProfile({...profile, userName: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> ইমেইল</Label>
            <Input 
              type="email"
              value={profile.email} 
              onChange={e => setProfile({...profile, email: e.target.value})} 
              placeholder="example@mail.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> মোবাইল নম্বর</Label>
            <Input 
              type="tel"
              value={profile.mobile} 
              onChange={e => setProfile({...profile, mobile: e.target.value})} 
              placeholder="017XXXXXXXX"
            />
          </div>
          <Button onClick={handleSaveProfile} className="w-full bg-primary hover:bg-primary/90 mt-2">সংরক্ষণ করুন</Button>
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
    </div>
  );
}
