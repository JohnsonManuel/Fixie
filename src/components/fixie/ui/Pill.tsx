import React from 'react';

type PillVariant = 'green' | 'red' | 'yellow' | 'gray' | 'blue' | 'mono';

const variants: Record<PillVariant, string> = {
  green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  red:    'bg-red-50 text-red-600 ring-1 ring-red-200/60',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  gray:   'bg-zinc-100 text-zinc-500',
  blue:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  mono:   'bg-zinc-100 text-zinc-500 font-mono text-[10.5px]',
};

export function Pill({
  children,
  variant = 'gray',
  className = '',
}: {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
