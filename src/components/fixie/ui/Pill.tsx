import React from 'react';

type PillVariant = 'green' | 'red' | 'yellow' | 'gray' | 'blue' | 'mono';

const variants: Record<PillVariant, string> = {
  green:  'bg-green-50 text-green-700',
  red:    'bg-red-50 text-red-700',
  yellow: 'bg-amber-50 text-amber-800',
  gray:   'bg-neutral-100 text-neutral-500',
  blue:   'bg-indigo-50 text-indigo-700',
  mono:   'bg-neutral-100 text-neutral-500 font-mono text-[11px]',
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
