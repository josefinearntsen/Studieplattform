'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ListChecks,
  GraduationCap,
  Library,
  Search,
  Bot,
  Settings,
  Sun,
} from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/assignments', label: 'Assignments', icon: ListChecks },
  { href: '/study', label: 'Study', icon: GraduationCap },
  { href: '/exams', label: 'Exams', icon: GraduationCap },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/tutor', label: 'AI Tutor', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-white px-3 py-6 md:block">
      <div className="mb-6 px-3">
        <p className="text-sm font-semibold">Studieplattform</p>
        <p className="text-xs text-muted">NTNU · Datateknologi</p>
      </div>
      <nav className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                active ? 'bg-accentSoft text-accent' : 'text-muted hover:bg-canvas hover:text-ink'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
