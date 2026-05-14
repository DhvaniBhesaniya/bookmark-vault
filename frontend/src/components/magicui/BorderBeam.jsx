import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export const BorderBeam = React.forwardRef(
  (
    {
      className,
      size = 200,
      duration = 8,
      anchor = 90,
      borderWidth = 1.5,
      colorFrom = "var(--accent-light)",
      colorTo = "var(--accent)",
      delay = 0,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef(null);
    const [path, setPath] = useState("");

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          // Use a generous radius for smooth corner traversal
          const r = 20;
          
          // Use cubic bezier curves (C) instead of arcs for buttery smooth corner transitions
          const k = r * 0.552; // bezier approximation of a quarter circle
          const svgPath = `path('M ${r} 0 L ${width - r} 0 C ${width - r + k} 0 ${width} ${r - k} ${width} ${r} L ${width} ${height - r} C ${width} ${height - r + k} ${width - r + k} ${height} ${width - r} ${height} L ${r} ${height} C ${r - k} ${height} 0 ${height - r + k} 0 ${height - r} L 0 ${r} C 0 ${r - k} ${r - k} 0 ${r} 0 Z')`;
          
          setPath(svgPath);
        }
      });

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={(node) => {
          internalRef.current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        style={{
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
          "--path": path,
        }}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
          // mask styles
          "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
          // pseudo styles - conditionally apply the animation only when the path is ready to prevent freezing
          path && "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:var(--path)]",
          className
        )}
        {...props}
      />
    );
  }
);

BorderBeam.displayName = "BorderBeam";
