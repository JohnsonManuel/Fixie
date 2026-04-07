/** Reusable skeleton / shimmer loading primitives. */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      <div className="border-b border-neutral-100 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-neutral-50 last:border-0 px-4 py-4 flex gap-4 items-center">
          <div className="flex items-center gap-2.5 w-36 shrink-0">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} className={`h-3.5 ${j === 0 ? 'flex-1' : 'w-20'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function ConvListSkeleton() {
  return (
    <div className="py-2 px-2 flex flex-col gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-2.5 py-2.5 flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-2.5 w-2/5" />
        </div>
      ))}
    </div>
  );
}

export function ChatLoadingSkeleton() {
  // Mirrors a realistic chat layout: alternating assistant/user bubbles
  const bubbles = [
    { role: 'assistant', lines: [{ w: 'w-48' }, { w: 'w-64' }, { w: 'w-40' }] },
    { role: 'user',      lines: [{ w: 'w-36' }] },
    { role: 'assistant', lines: [{ w: 'w-56' }, { w: 'w-72' }] },
    { role: 'user',      lines: [{ w: 'w-28' }, { w: 'w-44' }] },
    { role: 'assistant', lines: [{ w: 'w-52' }, { w: 'w-60' }, { w: 'w-32' }] },
    { role: 'user',      lines: [{ w: 'w-32' }] },
  ] as const;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Bubble silhouettes */}
      <div className="flex flex-col gap-4 px-4 py-5 md:px-6">
        {bubbles.map((b, i) => {
          const isUser = b.role === 'user';
          return (
            <div
              key={i}
              className={`flex gap-2.5 max-w-[72%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              {/* Avatar */}
              <Skeleton className={`w-6 h-6 rounded-full shrink-0 mt-1 ${isUser ? 'bg-violet-200' : ''}`} />

              {/* Lines inside a bubble shape */}
              <div
                className={`px-3.5 py-2.5 rounded-xl flex flex-col gap-2 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                style={{
                  background: isUser ? '#ede9fe' : '#ffffff',
                  border: isUser ? 'none' : '1px solid #e4e4e7',
                }}
              >
                {b.lines.map((line, j) => (
                  <Skeleton key={j} className={`h-3 ${line.w}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Blur + fade overlay — covers the bottom half */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '65%',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 55%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 55%)',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(250,250,250,0.6) 50%, #fafafa 100%)',
        }}
      />
    </div>
  );
}

export function ApprovalCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-start gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
    </div>
  );
}
