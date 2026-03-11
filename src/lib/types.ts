export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  purpose: string;
  source: string;
  createdAt: number;
}

export interface Loan {
  id: string;
  personName: string;
  totalAmount: number;
  paidAmount: number;
  date: string;
  note: string;
  createdAt: number;
}

export interface UserSettings {
  userName: string;
  currency: string;
  incomeCategories: string[];
  expenseCategories: string[];
}
