import React from 'react';

type Variant = 'primary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const base = 'inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'btn-brand',
  outline: 'bg-transparent border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300',
  danger:  'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  ghost:   'bg-transparent text-neutral-500 hover:text-red-500 hover:bg-red-50',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12.5px]',
  md: 'px-4 py-2 text-[13.5px]',
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
