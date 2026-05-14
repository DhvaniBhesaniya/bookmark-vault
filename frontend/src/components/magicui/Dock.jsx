import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "../../lib/utils";

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 56;
const DEFAULT_DISTANCE = 120;

export function Dock({
  className,
  children,
  iconSize = DEFAULT_SIZE,
  iconMagnification = DEFAULT_MAGNIFICATION,
  iconDistance = DEFAULT_DISTANCE,
  direction = "middle",
  orientation = "horizontal",
  ...props
}) {
  const mousePos = useMotionValue(Infinity);

  const isVertical = orientation === "vertical";

  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === DockIcon) {
        return React.cloneElement(child, {
          ...child.props,
          mousePos,
          size: iconSize,
          magnification: iconMagnification,
          distance: iconDistance,
          orientation,
        });
      }
      return child;
    });
  };

  return (
    <motion.div
      onMouseMove={(e) => mousePos.set(isVertical ? e.pageY : e.pageX)}
      onMouseLeave={() => mousePos.set(Infinity)}
      {...props}
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl border border-border p-2 backdrop-blur-md bg-bg-elevated/80",
        isVertical ? "flex-col w-max" : "flex-row h-max",
        {
          "items-start": !isVertical && direction === "top",
          "items-center": direction === "middle",
          "items-end": !isVertical && direction === "bottom",
        },
        className
      )}
    >
      {renderChildren()}
    </motion.div>
  );
}

export function DockIcon({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mousePos,
  orientation = "horizontal",
  className,
  children,
  active,
  ...props
}) {
  const ref = useRef(null);
  const padding = Math.max(6, size * 0.2);
  const defaultMousePos = useMotionValue(Infinity);

  const isVertical = orientation === "vertical";

  const distanceCalc = useTransform(mousePos ?? defaultMousePos, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    if (isVertical) {
      return val - bounds.y - bounds.height / 2;
    }
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size]
  );

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width: scaleSize, height: scaleSize, padding }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-colors",
        active
          ? "bg-accent/20 text-accent-light"
          : "text-text-muted hover:text-text-primary hover:bg-bg-elevated-high",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
