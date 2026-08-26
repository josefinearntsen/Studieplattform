import { clsx } from 'clsx';
import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({ className, children, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx('rounded-card border border-line bg-white p-5 shadow-card', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: React.ReactNode }>) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">{children}</h2>
      {action}
    </div>
  );
}

type BadgeTone = 'accent' | 'warn' | 'good' | 'neutral';

const badgeToneClasses: Record<BadgeTone, string> = {
  accent: 'bg-accentSoft text-accent',
  warn: 'bg-warnSoft text-warn',
  good: 'bg-goodSoft text-good',
  neutral: 'bg-canvas text-muted border border-line',
};

export function Badge({ tone = 'neutral', children }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return (
    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium', badgeToneClasses[tone])}>
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Button({
  className,
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  return (
    <button
      className={clsx(
        'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
        variant === 'primary' && 'bg-ink text-white hover:bg-black',
        variant === 'ghost' && 'text-muted hover:bg-canvas',
        className
      )}
      {...rest}
    />
  );
}
