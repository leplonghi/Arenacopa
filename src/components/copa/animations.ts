import { Variants } from "framer-motion";

export const tabContentVariants: Variants = {
  enter: { opacity: 0, x: 20, scale: 0.98, filter: "blur(4px)" },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } // Custom easing for "premium" feel
  },
  exit: { opacity: 0, x: -20, filter: "blur(4px)", transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    },
  },
};

// Dramatic entry for Hero/Featured elements
export const heroEnter: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 12,
      mass: 1.2,
      delay: 0.2
    }
  }
};

// For section headers
export const titleReveal: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};
