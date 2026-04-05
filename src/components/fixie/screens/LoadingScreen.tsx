import fixieLogo from '../../../images/image.png';

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}
    >
      {/* Logo mark with pulsing ring */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-2xl animate-ping opacity-20"
          style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)', animationDuration: '1.5s' }}
        />
        <img
          src={fixieLogo}
          alt="Fixie"
          className="w-16 h-16 rounded-2xl relative z-10"
          style={{ boxShadow: '0 8px 24px rgba(24,119,242,0.3)' }}
        />
      </div>

      {/* Brand name */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Fixie
        </span>
        <span className="text-[13px] text-neutral-400 font-medium">Loading your workspace…</span>
      </div>

      {/* Progress bar */}
      <div className="w-32 h-1 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="loading-bar h-full rounded-full"
          style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)' }}
        />
      </div>
    </div>
  );
}
