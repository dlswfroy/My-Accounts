
"use client"

import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8 space-y-4 flex-col">
        <Skeleton className="w-20 h-20 rounded-3xl" />
        <Skeleton className="w-48 h-6 rounded-full" />
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null; // Will redirect via useEffect
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

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
