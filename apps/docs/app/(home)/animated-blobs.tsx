"use client";

import { useEffect, useRef } from "react";

const shapes = [
  "60% 40% 30% 70% / 60% 30% 70% 40%",
  "30% 60% 70% 40% / 50% 60% 30% 60%",
  "70% 30% 50% 50% / 30% 50% 60% 60%",
  "40% 70% 60% 30% / 70% 40% 50% 50%",
  "80% 20% 40% 60% / 20% 80% 40% 60%",
  "25% 75% 45% 55% / 55% 45% 75% 25%",
  "65% 35% 70% 30% / 50% 50% 30% 70%",
  "45% 55% 80% 20% / 40% 60% 20% 80%",
  "90% 10% 30% 70% / 30% 70% 10% 90%",
  "15% 85% 65% 35% / 75% 25% 35% 65%",
];

const shapes2 = [
  "50% 50% 60% 40% / 40% 60% 50% 50%",
  "60% 40% 30% 70% / 50% 30% 70% 40%",
  "40% 60% 70% 30% / 60% 50% 40% 60%",
  "75% 25% 45% 55% / 55% 45% 25% 75%",
  "35% 65% 55% 45% / 45% 55% 65% 35%",
  "85% 15% 30% 70% / 70% 30% 15% 85%",
  "20% 80% 60% 40% / 40% 60% 80% 20%",
  "55% 45% 75% 25% / 25% 75% 45% 55%",
  "25% 75% 65% 35% / 35% 65% 75% 25%",
  "70% 30% 80% 20% / 20% 80% 30% 70%",
];

// Glass-morphic gradients (light mode) - subtle glass effect
const gradientStylesLight = [
  "radial-gradient(circle at 30% 40%, rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.3), rgba(59, 130, 246, 0.2))",
  "radial-gradient(circle at 60% 70%, rgba(147, 51, 234, 0.4), rgba(139, 92, 246, 0.3), rgba(129, 140, 248, 0.2))",
  "radial-gradient(circle at 45% 55%, rgba(236, 72, 153, 0.4), rgba(219, 39, 119, 0.3), rgba(190, 24, 93, 0.2))",
];

// Different glass-morphic gradient (light mode) - turquoise and cyan glass effect
const gradientStyles2Light = [
  "radial-gradient(circle at 70% 30%, rgba(45, 212, 191, 0.4), rgba(20, 184, 166, 0.3), rgba(13, 148, 136, 0.2))",
  "radial-gradient(circle at 40% 80%, rgba(103, 232, 249, 0.4), rgba(56, 189, 248, 0.3), rgba(14, 165, 233, 0.2))",
  "radial-gradient(circle at 55% 45%, rgba(167, 139, 250, 0.4), rgba(139, 92, 246, 0.3), rgba(109, 40, 217, 0.2))",
];

// Glass-morphic gradients (dark mode) - vibrant glass effect with glow
const gradientStylesDark = [
  "radial-gradient(circle at 30% 40%, rgba(96, 165, 250, 0.6), rgba(59, 130, 246, 0.5), rgba(37, 99, 235, 0.4))",
  "radial-gradient(circle at 60% 70%, rgba(168, 85, 247, 0.6), rgba(147, 51, 234, 0.5), rgba(126, 34, 206, 0.4))",
  "radial-gradient(circle at 45% 55%, rgba(236, 72, 153, 0.6), rgba(219, 39, 119, 0.5), rgba(190, 24, 93, 0.4))",
];

// Different glass-morphic gradient (dark mode) - cyan and emerald glass effect
const gradientStyles2Dark = [
  "radial-gradient(circle at 70% 30%, rgba(34, 211, 238, 0.6), rgba(20, 184, 166, 0.5), rgba(15, 118, 110, 0.4))",
  "radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.6), rgba(124, 58, 237, 0.5), rgba(99, 102, 241, 0.4))",
  "radial-gradient(circle at 55% 45%, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.5), rgba(29, 78, 216, 0.4))",
];

export default function AnimatedBlobs() {
  const blob1LightRef = useRef<HTMLDivElement>(null);
  const blob1DarkRef = useRef<HTMLDivElement>(null);
  const blob2LightRef = useRef<HTMLDivElement>(null);
  const blob2DarkRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Track mouse position within the hero section
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get the main hero element (parent of the blobs)
      const heroSection = document.querySelector(
        "main.relative.overflow-hidden"
      );
      if (!heroSection) return;

      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mousePositionRef.current = { x, y };
    };

    const handleMouseLeave = () => {
      mousePositionRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const blob1Light = blob1LightRef.current;
    const blob1Dark = blob1DarkRef.current;
    const blob2Light = blob2LightRef.current;
    const blob2Dark = blob2DarkRef.current;
    if (!blob1Light || !blob1Dark || !blob2Light || !blob2Dark) return;

    // Set initial random positions and transforms
    const initialTop1 = Math.random() * 100;
    const initialLeft1 = Math.random() * 100;
    const initialTop2 = Math.random() * 100;
    const initialLeft2 = Math.random() * 100;

    const initialTransform1 = `translate(${(Math.random() - 0.5) * 120}%, ${(Math.random() - 0.5) * 120}%) scale(${0.5 + Math.random() * 0.5}) rotate(${Math.random() * 720}deg)`;
    const initialTransform2 = `translate(${(Math.random() - 0.5) * 120}%, ${(Math.random() - 0.5) * 120}%) scale(${0.5 + Math.random() * 0.5}) rotate(${Math.random() * 720}deg)`;
    const initialShape1 = shapes[Math.floor(Math.random() * shapes.length)];
    const initialShape2 = shapes2[Math.floor(Math.random() * shapes2.length)];

    // Apply initial styles immediately without transitions to prevent shifts
    // Start with opacity 0, then fade in after positions are set
    const fadeInBlob = (blob: HTMLDivElement, isDark: boolean) => {
      if (!blob) return;
      // Start hidden
      blob.style.opacity = "0";
      // Force a reflow to ensure styles are applied
      void blob.offsetHeight;
      // Add transitions back and fade in after a brief delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Set transition for opacity fade-in
          blob.style.transition = "opacity 1500ms ease-in";
          // Set initial opacity to base value
          blob.style.opacity = String(isDark ? 0.505 : 0.405);
        });
      });
    };

    // Blob 1 - light mode
    if (blob1Light) {
      blob1Light.style.transition = "none";
      blob1Light.style.top = `${initialTop1}%`;
      blob1Light.style.left = `${initialLeft1}%`;
      blob1Light.style.transform = initialTransform1;
      blob1Light.style.borderRadius = initialShape1;
      fadeInBlob(blob1Light, false);
    }

    // Blob 1 - dark mode
    if (blob1Dark) {
      blob1Dark.style.transition = "none";
      blob1Dark.style.top = `${initialTop1}%`;
      blob1Dark.style.left = `${initialLeft1}%`;
      blob1Dark.style.transform = initialTransform1;
      blob1Dark.style.borderRadius = initialShape1;
      fadeInBlob(blob1Dark, true);
    }

    // Blob 2 - light mode
    if (blob2Light) {
      blob2Light.style.transition = "none";
      blob2Light.style.top = `${initialTop2}%`;
      blob2Light.style.left = `${initialLeft2}%`;
      blob2Light.style.transform = initialTransform2;
      blob2Light.style.borderRadius = initialShape2;
      fadeInBlob(blob2Light, false);
    }

    // Blob 2 - dark mode
    if (blob2Dark) {
      blob2Dark.style.transition = "none";
      blob2Dark.style.top = `${initialTop2}%`;
      blob2Dark.style.left = `${initialLeft2}%`;
      blob2Dark.style.transform = initialTransform2;
      blob2Dark.style.borderRadius = initialShape2;
      fadeInBlob(blob2Dark, true);
    }

    const animateBlob = (
      blob: HTMLDivElement,
      blobNum: number,
      isDark: boolean,
      shouldFollowMouse: boolean
    ) => {
      // Get current mouse position (if available)
      const mousePos = mousePositionRef.current;

      // Calculate random positions with optional mouse influence
      let randomTop: number;
      let randomLeft: number;
      let randomX: number;
      let randomY: number;

      if (mousePos && shouldFollowMouse) {
        // This blob should follow the mouse - blend mouse position with randomness for volatile delay effect
        const mouseInfluence = 0.95; // 88% mouse influence, 12% randomness for even stronger following
        const pureRandomness = 1 - mouseInfluence;

        // Add extra volatility with random noise for delayed/erratic response
        const volatilityFactor = 4; // Minimal volatility for very responsive following
        const noiseX = (Math.random() - 0.5) * volatilityFactor;
        const noiseY = (Math.random() - 0.5) * volatilityFactor;

        // Random top/left with mouse influence and volatility
        randomTop =
          Math.random() * 100 * pureRandomness +
          mousePos.y * mouseInfluence +
          noiseY;
        randomLeft =
          Math.random() * 100 * pureRandomness +
          mousePos.x * mouseInfluence +
          noiseX;

        // Random transform with mouse influence (more noticeable but still volatile)
        randomX =
          (Math.random() - 0.5) * 120 * pureRandomness +
          (mousePos.x - 50) * 1.0;
        randomY =
          (Math.random() - 0.5) * 120 * pureRandomness +
          (mousePos.y - 50) * 1.0;

        // Clamp values to reasonable ranges
        randomTop = Math.max(0, Math.min(100, randomTop));
        randomLeft = Math.max(0, Math.min(100, randomLeft));
      } else {
        // No mouse or this blob shouldn't follow - pure random positioning
        randomX = (Math.random() - 0.5) * 120;
        randomY = (Math.random() - 0.5) * 120;
        randomTop = Math.random() * 100;
        randomLeft = Math.random() * 100;
      }

      const randomScale = 0.5 + Math.random() * 0.5;
      const randomRotation = Math.random() * 720;
      // Random opacity with partial fade effects for glass-morphic effect
      // For light mode: base opacity 0.405, for dark mode: base opacity 0.505
      const baseOpacity = isDark ? 0.505 : 0.405;
      const opacityRoll = Math.random();
      const randomOpacity =
        opacityRoll < 0.2
          ? 0
          : opacityRoll < 0.5
            ? baseOpacity * 0.5
            : opacityRoll < 0.85
              ? baseOpacity * 0.8
              : baseOpacity;
      const shapeIndex =
        blobNum === 1
          ? Math.floor(Math.random() * shapes.length)
          : Math.floor(Math.random() * shapes2.length);
      const shape = blobNum === 1 ? shapes[shapeIndex] : shapes2[shapeIndex];

      // Random transition duration between 3900ms and 9100ms (slowed by 30%)
      const randomDuration = 3900 + Math.random() * 5200;
      const borderRadiusDuration = 3900 + Math.random() * 2600;
      const opacityDuration = 2500 + Math.random() * 2000;
      const transition = `transform ${randomDuration}ms cubic-bezier(0.4, 0, 0.2, 1), border-radius ${borderRadiusDuration}ms ease-in-out, top ${randomDuration}ms cubic-bezier(0.4, 0, 0.2, 1), left ${randomDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${opacityDuration}ms ease-in-out`;

      blob.style.transition = transition;
      blob.style.opacity = String(randomOpacity);
      blob.style.top = `${randomTop}%`;
      blob.style.left = `${randomLeft}%`;
      blob.style.transform = `translate(${randomX}%, ${randomY}%) scale(${randomScale}) rotate(${randomRotation}deg)`;
      blob.style.borderRadius = shape;
    };

    // Start animations with completely different timings (slowed by 30%)
    // Blob 1 will animate more frequently with varied intervals
    const animateBlob1 = () => {
      if (blob1Light && blob1Dark) {
        // Randomly decide if blob 1 should follow mouse (50/50 chance)
        const shouldFollow = Math.random() < 0.5;
        animateBlob(blob1Light, 1, false, shouldFollow);
        animateBlob(blob1Dark, 1, true, shouldFollow);
      }
      const nextDelay = 2600 + Math.random() * 5200;
      setTimeout(animateBlob1, nextDelay);
    };

    // Blob 2 will animate with different timing from blob 1
    const animateBlob2 = () => {
      if (blob2Light && blob2Dark) {
        // Randomly decide if blob 2 should follow mouse (50/50 chance)
        const shouldFollow = Math.random() < 0.5;
        animateBlob(blob2Light, 2, false, shouldFollow);
        animateBlob(blob2Dark, 2, true, shouldFollow);
      }
      const nextDelay = 3250 + Math.random() * 5850;
      setTimeout(animateBlob2, nextDelay);
    };

    // Start blob 1 after a random delay
    const initialDelay1 = 650 + Math.random() * 1950;
    setTimeout(animateBlob1, initialDelay1);

    // Start blob 2 at a completely different time
    const initialDelay2 = 2600 + Math.random() * 3250;
    setTimeout(animateBlob2, initialDelay2);
  }, []);

  return (
    <>
      {/* Dynamic gradient blob 1 - Glass-morphic gradient (Light mode) */}
      <div
        ref={blob1LightRef}
        className="absolute w-[400px] h-[400px] dark:hidden blur-[140px] pointer-events-none hidden"
        style={{
          opacity: 0,
          background: gradientStylesLight[0],
          borderRadius: shapes[0],
          willChange: "transform, border-radius, top, left, opacity",
        }}
      />

      {/* Dynamic gradient blob 1 - Glass-morphic gradient (Dark mode) */}
      <div
        ref={blob1DarkRef}
        className="absolute w-[400px] h-[400px] hidden dark:block blur-[140px] pointer-events-none"
        style={{
          opacity: 0,
          background: gradientStylesDark[0],
          borderRadius: shapes[0],
          willChange: "transform, border-radius, top, left, opacity",
        }}
      />

      {/* Dynamic gradient blob 2 - Glass-morphic gradient (Light mode) */}
      <div
        ref={blob2LightRef}
        className="absolute w-[480px] h-[480px] dark:hidden blur-[140px] pointer-events-none hidden"
        style={{
          opacity: 0,
          background: gradientStyles2Light[0],
          borderRadius: shapes2[0],
          willChange: "transform, border-radius, top, left, opacity",
        }}
      />

      {/* Dynamic gradient blob 2 - Glass-morphic gradient (Dark mode) */}
      <div
        ref={blob2DarkRef}
        className="absolute w-[480px] h-[480px] hidden dark:block blur-[140px] pointer-events-none"
        style={{
          opacity: 0,
          background: gradientStyles2Dark[0],
          borderRadius: shapes2[0],
          willChange: "transform, border-radius, top, left, opacity",
        }}
      />
    </>
  );
}
