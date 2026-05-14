import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const TextReveal = ({
  text,
  className,
}) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 4000); // 2 seconds visible + 2 seconds revealing
    return () => clearInterval(interval);
  }, []);

  const words = text.split("");

  return (
    <div className={cn("relative inline-block", className)} key={key}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.4,
            delay: i * 0.05,
            ease: "easeOut",
          }}
          className="inline-block"
        >
          {word === " " ? "\u00A0" : word}
        </motion.span>
      ))}
    </div>
  );
};
