import { cn } from "../lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";
import {Cover} from "../components/ui/cover"
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { PointerHighlight } from './ui/pointer-highlight';

export function Features() {
  const features = [
    {
      title: "AI-Powered Servicedesk Management",
      description:
        "Intelligent automation for modern IT support workflows.",
      icon: <span className="text-3xl">🏢</span>,
    },
    {
      title: "Minimal Downtime",
      description:
        "AI agents ensuring minimal downtime through instant issue resolution.",
      icon: <span className="text-3xl">🤖</span>,
    },
    {
      title: "Seamless Integrations",
      description:
        "Connect with all your existing IT tools and platforms.",
      icon: <span className="text-3xl">⚡</span>,
    },
    {
      title: "Enterprise Security",
      description: "Robust security protocols and compliance standards.",
      icon: <span className="text-3xl">🔒</span>,
    },
    
  ];
  return (
    <div className="w-full bg-white dark:bg-neutral-900 pt-5">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto text-center relative z-20 px-4 py-20"
      >
      <h1 className="mx-auto mt-4 text-2xl font-bold tracking-tight text-center sm:text-3xl md:text-4xl lg:text-5xl dark:text-neutral-100">
        <PointerHighlight
          rectangleClassName="bg-indigo-200 dark:bg-violet-600 border-indigo-300 dark:border-indigo-700 leading-relaxed p-2"
          pointerClassName="text-indigo-500 h-3 w-3"
          containerClassName="inline-block ml-1"
        >
          <span className="relative z-10 m-5">The New Way</span>
        </PointerHighlight>
        {" "}to build IT support.
      </h1>
        {/* <h1 className="text-4xl md:text-4xl lg:text-6xl font-semibold py-6 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 dark:from-neutral-800 dark:via-white dark:to-white"> */}
          {/* <Cover>The new way</Cover> */}
          {/* <PointerHighlight> <span>The New Way</span> </PointerHighlight>to build IT support. */}
        {/* </h1> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 py-10 bg-white dark:bg-neutral-900">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </motion.div>
    </div>
)}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
        <div
        className={cn(
            "flex flex-col lg:border-r  py-10 relative group/feature dark:border-neutral-800",
            (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
            index < 4 && "lg:border-b dark:border-neutral-800"
        )}
        >
        {index < 4 && (
            <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
        )}
        {index >= 4 && (
            <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
        )}
        <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
            {icon}
        </div>
        <div className="text-lg font-bold mb-2 relative z-10 px-10">
            <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
            <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
            {title}
            </span>
        </div>
        {/* <div className="relative">

        </div> */}
        <p className=" absolute inset-0 flex items-center justify-center text-sm text-neutral-600 dark:text-neutral-300 max-w-100 mt-5 relative  z-10 px-10">
            {description}
        </p>
        </div>
  );
};
