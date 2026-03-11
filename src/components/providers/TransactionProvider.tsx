
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
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  email: '',
  mobile: '',
  currency: '৳',
  isAdmin: false,
  incomeCategories: defaultIncomeCategories,
  expenseCategories: defaultExpenseCategories,
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  // Firestore Collections & Docs
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

  // Initialize profile if it doesn't exist
  useEffect(() => {
    if (!settingsLoading && !remoteSettings && user && settingsDocRef) {
      const initialSettings: UserSettings = {
        ...defaultSettings,
        userName: user.displayName || 'ব্যবহারকারী',
        email: user.email || '',
        isAdmin: true, // Making the user an admin on first profile creation
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
      email: user?.email || remoteSettings?.email || '',
      userName: user?.displayName || remoteSettings?.userName || defaultSettings.userName,
      isAdmin: remoteSettings?.isAdmin ?? false
    };
  }, [remoteSettings, user]);

  const isLoading = userLoading || txLoading || loanLoading || settingsLoading;

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    const newTx = { ...tx, createdAt: Date.now() };
    
    addDoc(colRef, newTx).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: newTx,
      }));
    });
  };

  const deleteTransaction = (id: string) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'transactions', id);
    deleteDoc(docRef).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      }));
    });
  };

  const addLoan = (loan: Omit<Loan, 'id' | 'createdAt' | 'paidAmount'>) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'loans');
    const newLoan = { ...loan, paidAmount: 0, createdAt: Date.now() };
    
    addDoc(colRef, newLoan).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: newLoan,
      }));
    });
  };

  const updateLoanPayment = (loanId: string, amount: number) => {
    if (!db || !user) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const loanRef = doc(db, 'users', user.uid, 'loans', loanId);
    updateDoc(loanRef, {
      paidAmount: (loan.paidAmount || 0) + amount
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: loanRef.path,
        operation: 'update',
        requestResourceData: { paidAmount: (loan.paidAmount || 0) + amount },
      }));
    });

    // Also add an expense transaction
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
    const docRef = doc(db, 'users', user.uid, 'loans', id);
    deleteDoc(docRef).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      }));
    });
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (!db || !user || !settingsDocRef) return;
    const updated = { ...settings, ...newSettings };
    setDoc(settingsDocRef, updated, { merge: true }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'update',
        requestResourceData: updated,
      }));
    });
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
