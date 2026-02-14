import { OrbitingCircles } from "../ui/orbiting-circles"

export function OrbitingCirclesDemo() {
  const logos = [
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg"
  ]

  const textLogos = ["https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg",
    "https://cdn.worldvectorlogo.com/logos/zoom-communications-logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/200px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/6/68/Gnomelogo.svg",]

  return (
    <div className="relative bg-neutral-100 dark:bg-neutral-900 flex h-[400px] sm:h-[500px] w-full flex-col items-center justify-center overflow-hidden px-4">
      {/* Outer orbit */}
      <OrbitingCircles 
        iconSize={50} 
        radius={120} 
        speed={1.5}
        className="sm:!w-[60px] sm:!h-[60px]"
      >
        {logos.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`logo-${idx}`}
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:brightness-90 transition-transform duration-300 hover:scale-110"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.style.display = "none"
            }}
          />
        ))}
      </OrbitingCircles>

      {/* Inner orbit */}
      <OrbitingCircles 
        iconSize={35} 
        radius={70} 
        reverse 
        speed={2}
        className="sm:!w-[40px] sm:!h-[40px]"
      >
        {textLogos.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`logo-${idx}`}
            className="h-6 w-6 sm:h-8 sm:w-8 object-contain dark:brightness-90 transition-transform duration-300 hover:scale-110"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.style.display = "none"
            }}
          />
        ))}
      </OrbitingCircles>
    </div>
  )
}
