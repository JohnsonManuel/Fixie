export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  const bw = size === 'sm' ? 2 : size === 'lg' ? 3 : 2;
  return (
    <div
      className={`${sz} rounded-full animate-spin`}
      style={{
        borderWidth: bw,
        borderStyle: 'solid',
        borderColor: 'rgba(24,119,242,0.15)',
        borderTopColor: '#1877F2',
      }}
    />
  );
}
