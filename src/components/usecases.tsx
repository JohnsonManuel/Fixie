"use client"

import React, { forwardRef, useRef } from "react"
import { cn } from "../lib/utils"
import { AnimatedBeam } from "./ui/animated-beams"
import fixieLogo from "../images/image.png"

// ⭕️ Reusable Circle component
const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white dark:bg-neutral-900 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  )
})
Circle.displayName = "Circle"

// 💬 Tooltip wrapper for icons
const Tooltip = forwardRef<
  HTMLDivElement,
  { emoji: string; text: string }
>(({ emoji, text }, ref) => {
  return (
    <div className="relative group z-10">
      <div
        ref={ref}
        className="relative flex size-12 items-center justify-center rounded-full border-2 bg-white dark:bg-neutral-900 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] cursor-default z-20"
      >
        {emoji}
      </div>

      {/* Tooltip banner */}
      <div
        className={cn(
          // Position on LEFT side of circle
          "absolute right-14 top-1/2 -translate-y-1/2 hidden w-max max-w-[220px] rounded-md",
          // Theme-aware colors
          "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black",
          // Style & animation
          "px-3 py-1 text-sm shadow-lg group-hover:block opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300 ease-in-out z-30"
        )}
      >
        {text}
      </div>
    </div>
  )
})
Tooltip.displayName = "Tooltip"



// 🌈 Main component
export function AnimatedBeamMultipleOutputDemo({
  className,
}: {
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)
  const div8Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        "relative flex h-[500px] bg-neutral-100 dark:bg-neutral-900 w-full items-center justify-center overflow-hidden p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        {/* Left - User Icon */}
        <div className="flex flex-col justify-center">
          <Circle ref={div8Ref}>
            <Icons.user />
          </Circle>
        </div>

        {/* Center - Fixie Logo */}
        <div className="flex flex-col justify-center">
          <Circle ref={div7Ref} className="size-16">
            <img src={fixieLogo} alt="logo" width={30} height={30} />
          </Circle>
        </div>

        {/* Right - IT Service Icons with Tooltips */}
        <div className="flex flex-col justify-center gap-4">
          <Tooltip ref={div1Ref} emoji="🔐" text="Password resets & account unlocks" />
          <Tooltip ref={div2Ref} emoji="📧" text="Email configuration issues" />
          <Tooltip ref={div3Ref} emoji="🌐" text="VPN & network connectivity fixes" />
          <Tooltip ref={div4Ref} emoji="🖨️" text="Printer setup & troubleshooting" />
          <Tooltip ref={div5Ref} emoji="💾" text="Software installation & updates" />
          <Tooltip ref={div6Ref} emoji="✅" text="Endpoint compliance checks" />
        </div>
      </div>

      {/* Animated Beams */}
      <AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={div7Ref} duration={3} />
      <AnimatedBeam containerRef={containerRef} fromRef={div2Ref} toRef={div7Ref} duration={3} />
      <AnimatedBeam containerRef={containerRef} fromRef={div3Ref} toRef={div7Ref} duration={3} />
      <AnimatedBeam containerRef={containerRef} fromRef={div4Ref} toRef={div7Ref} duration={3} />
      <AnimatedBeam containerRef={containerRef} fromRef={div5Ref} toRef={div7Ref} duration={3} />
      <AnimatedBeam containerRef={containerRef} fromRef={div6Ref} toRef={div7Ref} duration={3} />
      <AnimatedBeam containerRef={containerRef} fromRef={div7Ref} toRef={div8Ref} duration={3} />
    </div>
  )
}

// 👤 Simple SVG User Icon
const Icons = {
  user: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
      className="text-neutral-900 dark:text-neutral-100"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}
