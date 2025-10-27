// src/components/Page.jsx
import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";

/**
 * Page
 * - Smooth left → right entrance with fade and subtle scale.
 * - Triggers on first mount, on route (pathname) changes, and when animKey changes.
 * - Pass animKey={user ? "in" : "out"} from App to replay on login/logout
 *   even if the path doesn't change (e.g., staying on /compete).
 *
 * Usage:
 *   <Page animKey={user ? "in" : "out"}>
 *     <YourPageContent />
 *   </Page>
 */
export default function Page({ children, delay = 0, animKey }) {
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!ref.current) return;

    // Kill any previous tweens so replays are clean
    gsap.killTweensOf(ref.current);
    gsap.killTweensOf(ref.current.querySelectorAll("*"));

    // Container motion: slower and smoother
    gsap.fromTo(
      ref.current,
      { x: -24, opacity: 0, scale: 0.985 },
      { x: 0, opacity: 1, scale: 1, duration: 0.65, ease: "power2.out", delay }
    );

    // Stagger typical child nodes for a cascading effect
    const items = ref.current.querySelectorAll(
      "h1, h2, h3, h4, p, ul, ol, li, section, article, .card, .panel, .box, .fx-slide-in"
    );
    if (items.length) {
      gsap.fromTo(
        items,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.05, delay: delay + 0.08 }
      );
    }
  }, [pathname, animKey, delay]);

  return <div ref={ref}>{children}</div>;
}
