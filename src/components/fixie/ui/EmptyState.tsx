export function EmptyState({ icon, title, body }: { icon: string; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-neutral-400 gap-2.5 text-center">
      <div className="text-4xl mb-1">{icon}</div>
      <h3 className="text-[15px] font-semibold text-neutral-700">{title}</h3>
      {body && <p className="text-sm">{body}</p>}
    </div>
  );
}
