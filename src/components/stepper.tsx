import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

const steps = [
  {
    number: 1,
    title: "Simple Integration",
    description:
      "Connect quickly with the tools SMBs already use — Freshservice, Jira, Zoho Desk, Intune, and more. No months-long migrations or costly consultants. Fixie’s Helpdesk platform makes ticketing effortless.",
  },
  {
    number: 2,
    title: "AI Troubleshooting",
    description:
      "Fixie guides employees in plain English, attempts safe fixes automatically, and escalates only when needed — reducing back-and-forth and saving hours of IT time.",
  },
  {
    number: 3,
    title: "Automated Resolution",
    description:
      "From clearing caches to resetting services, Fixie handles routine fixes instantly. Every action is logged with an audit trail for transparency.",
  },
  {
    number: 4,
    title: "Built for Lean IT Teams",
    description:
      "Fixie learns from recurring issues and suggests faster paths to resolution, helping small IT teams scale support without adding headcount.",
  },
];

export default function StepperAutoProgress() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Observe when stepper is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    const element = ref.current;
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  // Reset + run animation when container enters view
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (inView) {
      // reset when it re-enters view
      setActive(0);

      let step = 0;
      timer = setInterval(() => {
        step += 1;
        setActive(step);
        if (step >= steps.length) clearInterval(timer);
      }, 1500); // 1.5s per step (syncs with bar duration)
    }

    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div ref={ref} className="min-h-[50vh] bg-white dark:bg-neutral-900 pt-5">
      <h1 className="mt-5 text-2xl md:text-4xl leading-relaxed text-center font-bold text-gray-900 dark:text-white mb-10">
        Chat-First IT Support For Companies of All Sizes
      </h1>

      <div className="flex flex-col md:flex-row items-stretch justify-between w-full max-w-6xl mx-auto gap-4 px-4 py-8">
        {steps.map((step, idx) => {
          const isActive = idx < active;
          return (
            <div
            key={idx}
            className={clsx(
                "relative flex flex-col w-full md:w-[400px] p-5 rounded-2xl border transition-all duration-700 overflow-hidden",
                "bg-white dark:bg-neutral-900",
                isActive
                ? "border-2 border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 bg-indigo-50 dark:bg-indigo-900/40"
                : "border-gray-200 dark:border-gray-700"
            )}
            >
            {/* Number circle */}
            <div
                className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-full font-semibold mb-4 transition-all duration-700 shrink-0",
                isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}
            >
                {step.number}
            </div>

            {/* Title */}
            <h3
                className={clsx(
                "text-lg font-semibold min-h-[3rem] transition-colors duration-700",
                isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                )}
            >
                {step.title}
            </h3>

            {/* Description */}
            <p
                className={clsx(
                "flex-1 text-sm leading-relaxed transition-opacity duration-700 mt-2 text-gray-600 dark:text-gray-300",
                isActive ? "opacity-100" : "opacity-70"
                )}
            >
                {step.description}
            </p>

            {/* Progress bar per card */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-200 dark:bg-gray-700 rounded-b-2xl overflow-hidden">
                <div
                className={clsx(
                    "h-full bg-indigo-500 transition-all ease-linear duration-[1500ms]",
                    isActive ? "w-full" : "w-0"
                )}
                />
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
