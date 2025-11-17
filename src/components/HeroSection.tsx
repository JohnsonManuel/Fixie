import React from 'react';
import fixieLogo from '../images/image.png';
import { BackgroundLines } from "./ui/background-lines";
import { BackgroundBeams } from "./ui/background-beams";
import { BackgroundBeamsWithCollision } from "./ui/background-beams-with-collision";
import { motion } from "framer-motion";
import productFlowImage from '../images/FixieProductFlow.png'
import { Code, Feather, DollarSign, Cloud } from "lucide-react";
import { MacbookScroll } from './ui/macbook-scroll'

interface HeroSectionProps {
  onDemoClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDemoClick }) => {
  const text = "Mask your IT Complexity!";
  const chars = [ ...text.split("")];

const features = [
  {
    icon: <Code className="w-6 h-6" />,
    title: "Built for developers",
    description:
      "Built for engineers, developers, dreamers, thinkers and doers.",
  },
  {
    icon: <Feather className="w-6 h-6" />,
    title: "Ease of use",
    description:
      "It's as easy as using an Apple, and as expensive as buying one.",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Pricing like no other",
    description:
      "Our prices are best in the market. No cap, no lock, no credit card required.",
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: "100% Uptime guarantee",
    description: "We just cannot be taken down by anyone.",
  },
];

const testimonials = [
  {
    text: "AI-Powered Servicedesk Management — Intelligent automation for modern IT support workflows.",
    name: "🏢",
    title: "AI-Powered",
  },
  {
    text: "Minimal Downtime — Proactive monitoring and instant issue resolution.",
    name: "⏱️",
    title: "Reliability",
  },
  {
    text: "Seamless Integrations — Connect with all your existing IT tools and platforms.",
    name: "⚡",
    title: "Integrations",
  },
  {
    text: "Enterprise Security — Robust security protocols and compliance standards.",
    name: "🔒",
    title: "Security",
  },
];

  return (
    <>
      <BackgroundBeamsWithCollision>
        <div className="text-center">
          <h2 className="relative z-20 text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold font-sans tracking-tight text-center px-4">
            <div className="relative mx-auto inline-block max-w-full [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))] break-words">
              {chars.map((char, i) => (
                <motion.span
                  key={i}
                  className="inline-block align-middle"
                  initial={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    rotate: (Math.random() - 0.5) * 360,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotate: 0,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 60,
                  }}
                >{
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500">
                    {char === " " ? "\u00A0" : char}
                  </span>
                }
                </motion.span>
              ))}
            </div>
          </h2>

      
          <p className="max-w-xl mx-auto mt-4 text-sm md:text-lg text-neutral-700 dark:text-neutral-400">
            Fixie is your team's AI-Powered IT sidekick in chat — fixing ITSM problems on it's own
            and integrating with all your IT Tools so your End User can focus on work that actually matters.
          </p>

          <button 
            onClick={onDemoClick}
            className="shadow-[0_4px_14px_0_rgb(0,118,255,39%)] rounded mt-4 hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:bg-[rgba(0,118,255,0.9)] px-8 py-2 bg-[#0070f3] rounded-md text-white font-light transition duration-200 ease-linear"
          >
            <span className="font-bold">Book Demo</span>
          </button>
        </div>
      </BackgroundBeamsWithCollision>
      <div className="w-full pb-5 dark:bg-neutral-900 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className="relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 max-w-7xl p-4 shadow-md dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="relative flex justify-center">
            {/* Glow border on top */}
            <div className="absolute top-0 left-0 w-full h-20" />

            {/* Image container */}
            <img
              src={productFlowImage}
              alt="Fixie Product Flow"
              className="relative z-10 max-w-full h-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
            />
          </div>
        </motion.div>
      </div>
      {/* <MacbookScroll src={productFlowImage}/> */}
    </>
  );
};

export default HeroSection;

