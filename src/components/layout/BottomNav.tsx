
"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, BookOpen, Settings, HandCoins, ChartPie } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'হোম', icon: LayoutDashboard, href: '/' },
  { label: 'আয়', icon: TrendingUp, href: '/income' },
  { label: 'ব্যয়', icon: TrendingDown, href: '/expenses' },
  { label: 'ক্যাশ বুক', icon: BookOpen, href: '/cashbook' },
  { label: 'রিপোর্ট', icon: ChartPie, href: '/reports' },
  { label: 'ঋণ', icon: HandCoins, href: '/loans' },
  { label: 'সেটিং', icon: Settings, href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[52px] bg-primary text-primary-foreground border-t border-white/30 flex items-center justify-around px-1 z-50 shadow-[0_-8px_30px_rgba(255,0,0,0.3)] overflow-x-auto no-scrollbar">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-all duration-300 px-2 py-1 rounded-xl min-w-[55px]",
              isActive ? "bg-white text-primary scale-110 shadow-lg" : "opacity-100 hover:bg-white/10"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive ? "stroke-[3px]" : "stroke-[2.5px]")} />
            <span className={cn("text-[9px] font-black whitespace-nowrap uppercase tracking-tighter")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
