import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * RootMotif — animated botanical root line-art.
 *
 * Draws a set of branching "root" paths using Framer Motion's
 * pathLength/strokeDasharray trick, mirroring the tagline
 * "Every root, traced back to the soil it came from."
 *
 * Fully respects prefers-reduced-motion: when reduced motion is
 * requested, paths render fully drawn with no animation.
 */

type RootMotifProps = {
  className?: string;
};

// Stylised branching root system. Each path starts near the top
// (the "stem") and fans downward/outward like roots reaching into soil.
const ROOT_PATHS = [
  "M400 20 C400 120 380 160 340 220 C300 280 250 300 180 340",
  "M400 20 C400 120 420 160 460 220 C500 280 550 300 620 340",
  "M400 20 C398 140 398 220 398 300 C398 360 398 400 398 460",
  "M398 300 C398 340 360 360 300 400 C260 426 220 440 160 470",
  "M398 300 C398 340 436 360 496 400 C536 426 576 440 636 470",
  "M340 220 C320 240 290 250 250 270 C220 285 200 295 170 310",
  "M460 220 C480 240 510 250 550 270 C580 285 600 295 630 310",
];

// Small feeder roots / root hairs — thinner, shorter, drawn slightly
// after the main branches for a layered growth effect.
const ROOT_HAIRS = [
  "M180 340 C160 350 150 365 135 385",
  "M180 340 C170 358 172 375 160 395",
  "M620 340 C640 350 650 365 665 385",
  "M620 340 C630 358 628 375 640 395",
  "M160 470 C145 482 140 496 128 512",
  "M636 470 C651 482 656 496 668 512",
];

export function RootMotif({ className }: RootMotifProps) {
  const shouldReduceMotion = useReducedMotion();

  const mainDrawTransition = (i: number) => ({
    pathLength: {
      duration: shouldReduceMotion ? 0 : 1.6,
      delay: shouldReduceMotion ? 0 : 0.15 * i,
      ease: [0.65, 0, 0.35, 1] as const,
    },
    opacity: {
      duration: shouldReduceMotion ? 0 : 0.4,
      delay: shouldReduceMotion ? 0 : 0.15 * i,
    },
  });

  const hairDrawTransition = (i: number) => ({
    pathLength: {
      duration: shouldReduceMotion ? 0 : 0.9,
      delay: shouldReduceMotion ? 0 : 1.1 + 0.08 * i,
      ease: "easeOut" as const,
    },
    opacity: {
      duration: shouldReduceMotion ? 0 : 0.3,
      delay: shouldReduceMotion ? 0 : 1.1 + 0.08 * i,
    },
  });

  return (
    <svg
      viewBox="0 0 800 540"
      fill="none"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
      preserveAspectRatio="xMidYMin slice"
    >
      {/* Main root branches */}
      {ROOT_PATHS.map((d, i) => (
        <motion.path
          key={`root-${i}`}
          d={d}
          stroke="var(--primary)"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.55 }}
          transition={mainDrawTransition(i)}
        />
      ))}

      {/* Fine root hairs, layered in after the main structure */}
      {ROOT_HAIRS.map((d, i) => (
        <motion.path
          key={`hair-${i}`}
          d={d}
          stroke="var(--earth)"
          strokeWidth={1}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={hairDrawTransition(i)}
        />
      ))}

      {/* Soft origin glow where the "stem" meets the roots */}
      <motion.circle
        cx="400"
        cy="20"
        r="4"
        fill="var(--accent)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.8, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.1 }}
      />
    </svg>
  );
}

/**
 * FloatingLeaves — a few purely atmospheric leaf accents that drift
 * slowly. Low amplitude, low opacity, disabled entirely under
 * prefers-reduced-motion (they render as static, motionless dots
 * of light rather than being removed, to preserve the layout).
 */
export function FloatingLeaves({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  const leaves = [
    { top: "12%", left: "8%", size: 22, delay: 0, duration: 9 },
    { top: "68%", left: "4%", size: 16, delay: 1.2, duration: 11 },
    { top: "22%", left: "92%", size: 18, delay: 0.6, duration: 10 },
    { top: "74%", left: "90%", size: 24, delay: 2, duration: 8.5 },
  ];

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {leaves.map((leaf, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          width={leaf.size}
          height={leaf.size}
          style={{ position: "absolute", top: leaf.top, left: leaf.left, opacity: 0.22 }}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [0, -10, 0],
                  rotate: [0, 6, 0],
                }
          }
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path d="M12 21c0-6 3-10 8-13-1 7-3 11-8 13Z" />
          <path d="M12 21c0-6-3-10-8-13 1 7 3 11 8 13Z" />
        </motion.svg>
      ))}
    </div>
  );
}