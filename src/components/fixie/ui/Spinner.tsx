export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-10 h-10 border-4' : 'w-8 h-8 border-3';
  return (
    <div
      className={`${sz} border-neutral-200 border-t-indigo-500 rounded-full animate-spin`}
      style={{ borderWidth: size === 'sm' ? 2 : size === 'lg' ? 4 : 3 }}
    />
  );
}
