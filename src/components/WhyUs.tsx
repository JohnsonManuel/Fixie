import { WarpBackground } from "../components/ui/wrap-backgraound";

interface WhyUsProps {
  onDemoClick?: () => void;
}

export function WhyUs({ onDemoClick }: WhyUsProps) {
  return (
<WarpBackground
  className="bg-white dark:bg-neutral-900"
  gridColor="rgba(120,120,120,0.18)" // 👈 visible on both light and dark
  beamsPerSide={5}
  beamSize={3}
  beamDuration={6}
  beamDelayMax={3}
  perspective={180}
>
  <section className="w-full py-20 relative z-10 transition-colors duration-500">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="max-w-5xl mx-auto text-center p-8 rounded-2xl 
          bg-white/60 dark:bg-black/60 
          backdrop-blur-md border border-gray-200 dark:border-white/10 
          shadow-lg dark:shadow-2xl transition-all duration-700">

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Why Choose Us
          </h2>

          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Because unlike static chatbots or ticket trackers, we're the IT agent that
            works 24/7, never forgets a fix, and integrates directly with your existing
            workflow — no rip-and-replace required.
          </p>

          <div className="mt-8 w-[80%] h-1 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />

          <blockquote className="mt-12 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Your IT helpdesk just got{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Superpowers!</span>
          </blockquote>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={onDemoClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg 
                bg-gradient-to-r from-indigo-500 to-purple-600 
                text-white font-semibold shadow-md hover:shadow-lg 
                transition-transform duration-300 hover:scale-[1.03] text-center"
            >
              ⚡ Book a demo
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</WarpBackground>
  );
}
