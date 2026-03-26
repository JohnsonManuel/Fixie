import React from 'react';

type Variant = 'primary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 focus-visible:outline-offset-2';

const variants: Record<Variant, string> = {
  primary: 'btn-brand',
  outline: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300',
  danger:  'bg-red-500 text-white hover:bg-red-600',
  ghost:   'bg-transparent text-zinc-500 hover:text-red-500 hover:bg-red-50',
};

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-[12px]',
  md: 'px-3.5 py-2 text-[13px]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
