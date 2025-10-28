import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import seamless from "../images/Seamless.png"
import aipowered from "../images/Ai-powered.png"
import automated from "../images/automated.png"
import builtforlean from "../images/analytics.png"

const tabs = [
  {
    title: "Simple Integration",
    key: "1",
    body: "Connect quickly with the tools SMBs already use — Freshservice, Jira, Zoho Desk, Intune, and more. No months-long migrations or costly consultants. In addition we provide our own in-house Helpdesk platform to create and manage tickets.",
    image: seamless,
  },
  {
    title: "AI-Powered Troubleshooting",
    key: "2",
    body: "Fixie guides employees in plain English, attempts safe fixes automatically, and escalates only when needed. It reduces back-and-forth and saves hours of IT time.",
    image: aipowered,
  },
  {
    title: "Automated Resolution",
    key: "3",
    body: "From clearing caches to resetting services, Fixie handles routine fixes instantly. Every action is logged with an audit trail for security and transparency.",
    image: automated,
  },
  {
    title: "Built for Lean IT Teams",
    key: "4",
    body: "Fixie learns from recurring issues and suggests faster paths to resolution, helping small IT teams support growing organizations without adding headcount.",
    image: builtforlean,
  },
]

type LeftTabsProps = {
  active: string
  setActive: (key: string) => void
}

function LeftTabs({ active, setActive }: LeftTabsProps) {
  return (
    <div className="flex flex-col justify-between h-full">
      {tabs.map((t) => {
        const isActive = active === t.key
        return (
          <motion.button
            key={t.key}
            layout
            onClick={() => setActive(t.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`relative flex flex-col text-left px-4 py-3 rounded-lg border transition-all duration-300 ${
              isActive
                ? "border-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900 dark:text-zinc-200"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 rounded-lg border-4 border-indigo-500"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            <div className="relative flex items-start gap-3 z-10">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 text-white font-bold text-sm shrink-0">
                {t.key}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">{t.body}</p>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}


type ImageCardProps = {
  image: string
  alt?: string
}

function ImageCard({ image, alt }: ImageCardProps) {
  const [lightbox, setLightbox] = useState(false)

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 
          overflow-hidden shadow-md cursor-pointer w-full h-full flex items-center justify-center"
        onClick={() => setLightbox(true)}
      >
        {/* ✅ image scales down but never overflows */}
        <img
          src={image}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-2xl"
        />
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
          >
            <motion.img
              src={image}
              alt={alt}
              className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TabsWithRightCard() {
  const [active, setActive] = useState(tabs[0].key)
  const activeTab = tabs.find((t) => t.key === active)!

  return (
    <div id="features" className="min-h-[70vh] bg-white dark:bg-neutral-900 pt-5">
      <h1 className="mt-5 text-2xl md:text-4xl leading-relaxed text-center font-bold text-gray-900 dark:text-white mb-10">
        Chat-First IT Support For Companies of All Sizes
      </h1>

      {/* ✅ Equal height container */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 md:items-stretch">
        {/* Left column */}
        <div className="md:w-1/2 flex flex-col">
          <div className="flex-1 h-full">
            <LeftTabs active={active} setActive={setActive} />
          </div>
        </div>

        {/* Right column */}
        <div className="md:w-1/2 flex flex-col">
          {/* ✅ Force image card to exactly match left column height */}
          <div className="flex-1 h-full max-h-full">
            <ImageCard image={activeTab.image} alt={activeTab.title} />
          </div>
        </div>
      </div>
    </div>
  )
}