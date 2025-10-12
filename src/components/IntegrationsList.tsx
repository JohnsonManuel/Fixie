"use client"

import { cn } from "../lib/utils"
import { AnimatedList } from "./ui/animated-list"

interface Item {
  name: string
  description: string
  icon: string
  color: string
  time: string
}

let notifications = [
  {
    name: "New Password Ticket",
    description: "Password resets & account unlocks",
    time: "15m ago",
    icon: "🔐",
    color: "#00C9A7",
  },
  {
    name: "Email Ticket",
    description: "Email configuration issues",
    time: "10m ago",
    icon: "👤",
    color: "#FFB800",
  },
  {
    name: "Network Ticket",
    description: "VPN & network connectivity fixes",
    time: "5m ago",
    icon: "💬",
    color: "#FF3D71",
  },
  {
    name: "Setup Ticket",
    description: "Printer setup & troubleshooting",
    time: "2m ago",
    icon: "🗞️",
    color: "#1E86FF",
  },
{
    name: "Installation Ticket",
    description: "Software installation & updates",
    time: "2m ago",
    icon: "🗞️",
    color: "#b908faff",
  },
{
    name: "Endpoint Ticket",
    description: "Endpoint compliance checks",
    time: "2m ago",
    icon: "✅",
    color: "#ffda1eff",
  },
]

notifications = Array.from({ length: 10 }, () => notifications).flat()

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[600px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  )
}

export function AnimatedListDemo({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex h-[600px] w-full flex-col overflow-hidden p-2",
        className
      )}
    >
      <h1 className="mt-5 text-2xl md:text-6xl leading-relaxed leading-relaxed text-center font-bold text-gray-900 dark:text-white mb-10">
        Example Use Cases
      </h1>
      <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t"></div>
    </div>
  )
}
