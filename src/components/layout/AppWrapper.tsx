"use client"

import React from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <main className="flex-1 pt-16 pb-20 overflow-y-auto">
        <div className="max-w-md mx-auto p-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}