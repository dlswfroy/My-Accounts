"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, BookOpen, Settings, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/' },
  { label: 'আয়', icon: TrendingUp, href: '/income' },
  { label: 'ব্যয়', icon: TrendingDown, href: '/expenses' },
  { label: 'ক্যাশ বুক', icon: BookOpen, href: '/cashbook' },
  { label: 'ঋণ', icon: HandCoins, href: '/loans' },
  { label: 'সেটিং', icon: Settings, href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary text-primary-foreground border-t border-white/10 flex items-center justify-around px-1 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.15)] overflow-x-auto no-scrollbar">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all duration-300 px-3 py-1 rounded-xl min-w-[55px]",
              isActive ? "bg-white/25 scale-105 shadow-sm" : "opacity-80 hover:opacity-100"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
            <span className={cn("text-[8px] font-bold whitespace-nowrap uppercase tracking-tighter", isActive ? "opacity-100" : "opacity-90")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}