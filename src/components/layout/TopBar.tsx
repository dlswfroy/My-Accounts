
"use client"

import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const auth = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground flex items-center justify-between px-6 shadow-md z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-[34px] font-black font-headline tracking-tight drop-shadow-[0_2.2px_2.2px_rgba(0,0,0,0.9)]">
          আমার হিসাব
        </h1>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLogout}
        className="text-primary-foreground hover:bg-white/20 rounded-xl"
      >
        <LogOut className="w-5 h-5" />
      </Button>
    </header>
  );
}
