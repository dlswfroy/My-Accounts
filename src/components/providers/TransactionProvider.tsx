"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, UserSettings, Loan } from '@/lib/types';

interface TransactionContextType {
  transactions: Transaction[];
  loans: Loan[];
  settings: UserSettings;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'paidAmount'>) => void;
  updateLoanPayment: (loanId: string, amount: number) => void;
  deleteLoan: (id: string) => void;
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
  const [loans, setLoans] = useState<Loan[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTx = localStorage.getItem('my_accounts_transactions');
    const savedLoans = localStorage.getItem('my_accounts_loans');
    const savedSettings = localStorage.getItem('my_accounts_settings');

    if (savedTx) {
      try { setTransactions(JSON.parse(savedTx)); } catch (e) { console.error(e); }
    }
    if (savedLoans) {
      try { setLoans(JSON.parse(savedLoans)); } catch (e) { console.error(e); }
    }
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error(e); }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('my_accounts_transactions', JSON.stringify(transactions));
      localStorage.setItem('my_accounts_loans', JSON.stringify(loans));
      localStorage.setItem('my_accounts_settings', JSON.stringify(settings));
    }
  }, [transactions, loans, settings, isLoading]);

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

  const addLoan = (loan: Omit<Loan, 'id' | 'createdAt' | 'paidAmount'>) => {
    const newLoan: Loan = {
      ...loan,
      id: crypto.randomUUID(),
      paidAmount: 0,
      createdAt: Date.now(),
    };
    setLoans(prev => [newLoan, ...prev]);
  };

  const updateLoanPayment = (loanId: string, amount: number) => {
    setLoans(prev => prev.map(l => 
      l.id === loanId ? { ...l, paidAmount: l.paidAmount + amount } : l
    ));
    // Also record this as an expense
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      addTransaction({
        type: 'expense',
        amount: amount,
        category: 'ঋণ পরিশোধ',
        purpose: `${loan.personName}-কে ঋণ পরিশোধ`,
        date: new Date().toISOString().split('T')[0],
        source: ''
      });
    }
  };

  const deleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <TransactionContext.Provider value={{ 
      transactions, loans, settings, addTransaction, deleteTransaction, 
      addLoan, updateLoanPayment, deleteLoan, updateSettings, isLoading 
    }}>
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
