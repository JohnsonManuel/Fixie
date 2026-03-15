import { Button } from '../ui/Button';
import { redirectToLogin, signOutAndRedirect } from '../../../lib/fixie/auth';

export function NoAccountScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f9fb] p-6">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-lg p-10 w-full max-w-sm text-center flex flex-col gap-4">
        <div className="text-3xl font-bold text-indigo-500 tracking-tight">Fixie</div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">No account found</h2>
          <p className="text-sm text-neutral-500">
            Your account hasn't been set up yet. Please sign up on the main site to get started.
          </p>
        </div>
        <Button onClick={redirectToLogin} className="w-full justify-center">
          Go to Sign Up →
        </Button>
        <button
          onClick={signOutAndRedirect}
          className="text-sm text-neutral-400 hover:text-neutral-600 mt-1"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
