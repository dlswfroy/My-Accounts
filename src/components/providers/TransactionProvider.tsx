
"use client"

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { Transaction, UserSettings, Loan } from '@/lib/types';
import { 
  useCollection, 
  useDoc, 
  useUser, 
  useFirestore, 
  errorEmitter 
} from '@/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';

interface TransactionContextType {
  transactions: Transaction[];
  loans: Loan[];
  settings: UserSettings;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'paidAmount'>) => void;
  updateLoan: (loanId: string, updates: Partial<Loan>) => void;
  updateLoanPayment: (loanId: string, amount: number, nextDueDate?: string) => void;
  deleteLoan: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  isLoading: boolean;
}

const defaultIncomeCategories = ['বেতন', 'বোনাস', 'উপহার', 'অন্যান্য'];
const defaultExpenseCategories = ['খাবার', 'পরিবহন', 'বাসা ভাড়া', 'ইউটিলিটি', 'বিনোদন', 'অন্যান্য'];

const defaultSettings: UserSettings = {
  userName: 'ব্যবহারকারী',
  email: '',
  mobile: '',
  currency: '৳',
  isAdmin: false,
  incomeCategories: defaultIncomeCategories,
  expenseCategories: defaultExpenseCategories,
  budgets: {}
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'transactions'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const loansQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'loans'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const settingsDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'settings', 'profile');
  }, [db, user]);

  const { data: transactions = [], loading: txLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: loans = [], loading: loanLoading } = useCollection<Loan>(loansQuery);
  const { data: remoteSettings, loading: settingsLoading } = useDoc<UserSettings>(settingsDocRef);

  useEffect(() => {
    if (!settingsLoading && !remoteSettings && user && settingsDocRef) {
      const initialSettings: UserSettings = {
        ...defaultSettings,
        userName: user.displayName || 'ব্যবহারকারী',
        email: user.email || '',
        isAdmin: true,
      };
      setDoc(settingsDocRef, initialSettings, { merge: true }).catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: settingsDocRef.path,
          operation: 'create',
          requestResourceData: initialSettings,
        }));
      });
    }
  }, [remoteSettings, settingsLoading, user, settingsDocRef]);

  const settings = useMemo(() => {
    return { 
      ...defaultSettings, 
      ...remoteSettings,
      budgets: remoteSettings?.budgets || {},
    };
  }, [remoteSettings, user]);

  const isLoading = userLoading || txLoading || loanLoading || settingsLoading;

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    const newTx = { ...tx, createdAt: Date.now() };
    addDoc(colRef, newTx);
  };

  const deleteTransaction = (id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
  };

  const addLoan = (loan: Omit<Loan, 'id' | 'createdAt' | 'paidAmount'>) => {
    if (!db || !user) return;
    addDoc(collection(db, 'users', user.uid, 'loans'), { ...loan, paidAmount: 0, createdAt: Date.now() });
  };

  const updateLoan = (loanId: string, updates: Partial<Loan>) => {
    if (!db || !user) return;
    updateDoc(doc(db, 'users', user.uid, 'loans', loanId), updates);
  };

  const updateLoanPayment = (loanId: string, amount: number, nextDueDate?: string) => {
    if (!db || !user) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const updates: any = { paidAmount: (loan.paidAmount || 0) + amount };
    if (nextDueDate) updates.dueDate = nextDueDate;
    updateDoc(doc(db, 'users', user.uid, 'loans', loanId), updates);
    addTransaction({
      type: 'expense',
      amount: amount,
      category: 'ঋণ পরিশোধ',
      purpose: `${loan.personName}-কে ঋণ পরিশোধ`,
      date: new Date().toISOString().split('T')[0],
      source: ''
    });
  };

  const deleteLoan = (id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'loans', id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (!db || !user || !settingsDocRef) return;
    setDoc(settingsDocRef, { ...settings, ...newSettings }, { merge: true });
  };

  return (
    <TransactionContext.Provider value={{ 
      transactions, loans, settings, addTransaction, deleteTransaction, 
      addLoan, updateLoan, updateLoanPayment, deleteLoan, updateSettings, isLoading 
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) throw new Error('useTransactions must be used within a TransactionProvider');
  return context;
}
