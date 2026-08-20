import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

// Counts up from 0 to `value` once the element scrolls into view.
const AnimatedCounter = ({
  value,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const counter = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        val: value,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${prefix}${counter.val.toLocaleString(undefined, {
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals,
          })}${suffix}`;
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value, prefix, suffix, decimals]);

  return (
    <div ref={ref} className={className}>
      {prefix}0{suffix}
    </div>
  );
};

export default AnimatedCounter;
