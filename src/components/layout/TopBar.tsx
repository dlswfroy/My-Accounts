"use client"

import React from 'react';
import { Wallet } from 'lucide-react';

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground flex items-center px-6 shadow-md z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold font-headline tracking-tight">আমার হিসাব</h1>
      </div>
    </header>
  );
}