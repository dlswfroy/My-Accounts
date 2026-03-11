"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, UserSettings } from '@/lib/types';

interface TransactionContextType {
  transactions: Transaction[];
  settings: UserSettings;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  isLoading: boolean;
}

const defaultIncomeCategories = ['বেতন', 'বোনাস', 'উপহার', 'অন্যান্য'];
const defaultExpenseCategories = ['খাবার', 'পরিবহন', 'বাসা ভাড়া', 'ইউটিলিটি', 'বিনোদন', 'অন্যান্য'];

const defaultSettings: UserSettings = {
  userName: 'ব্যবহারকারী',
  currency: '৳',
  incomeCategories: defaultIncomeCategories,
  expenseCategories: defaultExpenseCategories,
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTx = localStorage.getItem('my_accounts_transactions');
    const savedSettings = localStorage.getItem('my_accounts_settings');

    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('my_accounts_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('my_accounts_settings', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <TransactionContext.Provider value={{ transactions, settings, addTransaction, deleteTransaction, updateSettings, isLoading }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}