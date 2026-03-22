import fixieLogo from '../../../images/image.png';
import { redirectToLogin, signOutAndRedirect } from '../../../lib/fixie/auth';
import { Button } from '../ui/Button';

export function NoAccountScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
        style={{ boxShadow: '0 8px 40px rgba(24,119,242,0.1)', border: '1px solid #e8edf3' }}
      >
        {/* Logo */}
        <img
          src={fixieLogo}
          alt="Fixie"
          className="w-14 h-14 rounded-2xl"
          style={{ boxShadow: '0 4px 16px rgba(24,119,242,0.25)' }}
        />

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1.5">No account found</h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Your account hasn't been set up yet. Please sign up on the main site to get started.
          </p>
        </div>

        {/* CTA */}
        <Button onClick={redirectToLogin} className="w-full justify-center">
          Go to Sign Up
        </Button>

        <button
          onClick={signOutAndRedirect}
          className="text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
