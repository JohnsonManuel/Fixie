import { Spinner } from '../ui/Spinner';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f9fb]">
      <div className="text-4xl font-bold text-indigo-500 tracking-tight">Fixie</div>
      <Spinner size="lg" />
    </div>
  );
}
