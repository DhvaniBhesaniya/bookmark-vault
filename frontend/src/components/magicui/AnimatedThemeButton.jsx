import { motion } from "framer-motion";
import { useTheme } from "../ThemeProvider";

export function AnimatedThemeButton() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = (event) => {
    const nextTheme = isDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const springConfig = { type: "spring", stiffness: 150, damping: 15, mass: 1 };

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent-light hover:bg-accent/20 hover:text-accent transition-all focus:outline-none shadow-sm border border-transparent hover:border-accent/10"
      aria-label="Toggle theme"
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={isDark ? "dark" : "light"}
        variants={{
          light: { rotate: 0 },
          dark: { rotate: -40 },
        }}
        transition={springConfig}
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            r="9"
            fill="black"
            initial={false}
            animate={isDark ? "dark" : "light"}
            variants={{
              light: { cx: "25", cy: "-5" },
              dark: { cx: "10", cy: "6" },
            }}
            transition={springConfig}
          />
        </mask>

        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask="url(#moon-mask)"
          initial={false}
          animate={isDark ? "dark" : "light"}
          variants={{
            light: { r: 5 },
            dark: { r: 9 },
          }}
          transition={springConfig}
        />

        <motion.g
          stroke="currentColor"
          initial={false}
          animate={isDark ? "dark" : "light"}
          variants={{
            light: { opacity: 1, scale: 1 },
            dark: { opacity: 0, scale: 0.5 },
          }}
          transition={{ ...springConfig, duration: 0.2 }}
          style={{ transformOrigin: "center" }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </motion.g>
      </motion.svg>
    </button>
  );
}
