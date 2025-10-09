import React from "react";
import { cn } from "../lib/utils";
import { BentoGrid, BentoGridItem } from "../components/ui/bento-grid";
import { NumberTicker } from '../components/ui/number-ticker';
import {
  IconBoxAlignRightFilled,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";

import { AnimatedBeamMultipleOutputDemo } from "../components/usecases";
import { OrbitingCirclesDemo } from "../components/OrbitDemo";

import { motion } from "motion/react";


export function ProductHighlights() {
  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-900 pt-5">
        {/* <h1 className="text-2xl md:text-6xl leading-relaxed leading-relaxed text-center font-bold text-gray-900 dark:text-white mb-10">Product Highlights</h1> */}
        <h1 className="text-4xl md:text-4xl text-center leading-relaxed font-bold text-gray-900 dark:text-white mb-5 mt-5">Platform Highlights</h1>
        <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[20rem] pb-5">
            {items.map((item, i) => (
                <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                className={cn("[&>p:text-lg]", item.className)}
                icon={item.icon}
                />
            ))}
        </BentoGrid>
        {/* <section className="w-full bg-white dark:bg-neutral-900 py-16">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Benefits for Your Organization
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white dark:bg-black p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              8,000+
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Creators on the platform
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-black p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              3%
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Flat platform fee
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-black p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              99.9%
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Uptime guarantee
            </p>
          </div>

        </div>
      </div>
    </section> */}
    </div>
  );
}

const SkeletonOne = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2  items-center space-x-2 bg-white dark:bg-black"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shrink-0" />
        <div className="w-full bg-gray-100 h-4 rounded-full dark:bg-neutral-900" />
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2 w-3/4 ml-auto bg-white dark:bg-black"
      >
        <div className="w-full bg-gray-100 h-4 rounded-full dark:bg-neutral-900" />
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shrink-0" />
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2 bg-white dark:bg-black"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shrink-0" />
        <div className="w-full bg-gray-100 h-4 rounded-full dark:bg-neutral-900" />
      </motion.div>
    </motion.div>
  );
};
const SkeletonTwo = () => {
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: "100%",
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ["0%", "100%"],
      transition: {
        duration: 2,
      },
    },
  };
  const arr = new Array(6).fill(0);
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      {arr.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxWidth: Math.random() * (100 - 40) + 40 + "%",
          }}
          className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2  items-center space-x-2 bg-neutral-100 dark:bg-black w-full h-4"
        ></motion.div>
      ))}
    </motion.div>
  );
};
const SkeletonThree = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] rounded-lg bg-dot-black/[0.2] flex-col space-y-2"
      style={{
        background:
          "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="h-full w-full rounded-lg"></motion.div>
    </motion.div>
  );
};
const SkeletonFour = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl font-bold bg-neutral-100 p-4 dark:bg-neutral-900 dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <NumberTicker
          value={80}
          extras="%"
          decimalPlaces={0}
          className="text-4xl font-medium tracking-tighter whitespace-pre-wrap text-black dark:text-white"
        />
        <p className="border border-red-500 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Cut Resolution Times
        </p>
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Reduce IT issue resolution time and improve user satisfaction.
        </p>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900 dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center">
        <NumberTicker
          value={24}
          extras=" / 7"
          decimalPlaces={0}
          className="text-4xl font-medium tracking-tighter whitespace-pre-wrap text-black dark:text-white"
        />
        <p className="border border-green-500 font-bold bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Always Available
        </p>
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          AI never sleeps, providing support around the clock.
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900 dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <NumberTicker
          value={0}
          extras=""
          symbols="$"
          decimalPlaces={0}
          className="text-4xl font-medium tracking-tighter whitespace-pre-wrap text-black dark:text-white"
        />
        <p className="border font-bold border-orange-500 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Lower Support Costs
        </p>
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Automate high-volume tickets and reduce manual work.
        </p>
      </motion.div>
    </motion.div>
  );
};
const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2  items-start space-x-2 bg-white dark:bg-black"
      >
        <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        />
        <p className="text-xs text-neutral-500">
          There are a lot of cool framerworks out there like React, Angular,
          Vue, Svelte that can make your life ....
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center justify-end space-x-2 w-3/4 ml-auto bg-white dark:bg-black"
      >
        <p className="text-xs text-neutral-500">Use PHP.</p>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shrink-0" />
      </motion.div>
    </motion.div>
  );
};
const items = [
  {
    title: "Benefits for your Organisation",
    description: (
      <span className="text-sm">
        {/* Understand the sentiment of your text with AI analysis. */}
      </span>
    ),
    header: <SkeletonFour />,
    className: "md:col-span-4",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Example Use Cases",
    description: "",
    header: <AnimatedBeamMultipleOutputDemo />,
    className: "md:col-span-2 md:row-span-2",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Integrates with all Your Existing IT Tools",
    description: "",
    header: <OrbitingCirclesDemo />,
    className: "md:col-span-2 md:row-span-2",
    icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  }

  // {
  //   title: "Text Summarization",
  //   description: (
  //     <span className="text-sm">
  //       Summarize your lengthy documents with AI technology.
  //     </span>
  //   ),
  //   header: <SkeletonFive />,
  //   className: "md:col-span-1",
  //   icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
  // },
];
