"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, PieChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/' },
  { label: 'আমার আয়', icon: TrendingUp, href: '/income' },
  { label: 'আমার ব্যয়', icon: TrendingDown, href: '/expenses' },
  { label: 'রিপোর্ট', icon: PieChart, href: '/reports' },
  { label: 'সেটিং', icon: Settings, href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-primary text-primary-foreground border-t border-white/10 flex items-center justify-around px-2 pb-2 pt-1 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-200 px-3 py-1 rounded-2xl",
              isActive ? "bg-white/20 scale-105" : "opacity-70 hover:opacity-100"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}