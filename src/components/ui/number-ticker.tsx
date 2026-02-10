import { ComponentPropsWithoutRef, useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"
import { cn } from "../../lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  extras?: string
  symbols?: string
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  extras,
  symbols,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const numberRef = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 })
  const isInView = useInView(numberRef, { once: true, margin: "0px" })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [motionValue, isInView, delay, value, direction, startValue])

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (numberRef.current) {
        numberRef.current.textContent = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(latest)
      }
    })
  }, [springValue, decimalPlaces])

  return (
    <span
      className={cn(
        "inline-block tracking-wider tabular-nums text-black dark:text-white",
        className
      )}
      {...props}
    >
      {symbols ? <span>{symbols}</span> : null}  
      <span ref={numberRef}>{startValue}</span>
      {extras ? <span>{extras}</span> : null}
    </span>
  )
}
