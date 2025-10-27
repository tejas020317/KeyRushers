// src/components/MagicBento.jsx

import React, { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import './MagicBento.css';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = [132, 0, 255];
const MOBILE_BREAKPOINT = 768;

function createParticleElement(x, y, color = DEFAULT_GLOW_COLOR) {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color.join(',')}, 1);
    box-shadow: 0 0 6px rgba(${color.join(',')}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
}

export default function ParticleCard({
  children,
  className = '',
  disableAnimations = false,
  style = {},
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  enableMagnetism = false,
}) {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.length = 0;
    particlesRef.current.forEach(p => {
      if (p.parentNode) p.parentNode.removeChild(p);
    });
    particlesRef.current.length = 0;
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = window.setTimeout(() => {
        if (!cardRef.current || !isHoveredRef.current) return;

        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const p = createParticleElement(x, y, glowColor);
        cardRef.current.appendChild(p);
        particlesRef.current.push(p);

        gsap.fromTo(
          p,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );
        gsap.to(p, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 1 + Math.random(),
          ease: 'none',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(p, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
        });
      }, i * 100);

      timeoutsRef.current.push(timeoutId);
    }
  }, [glowColor, particleCount]);

  useEffect(() => {
    if (disableAnimations) return;
    const el = cardRef.current;
    if (!el) return;

    function handleMouseEnter() {
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt) {
        gsap.to(el, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      }
    }

    function handleMouseLeave() {
      isHoveredRef.current = false;
      clearAllParticles();
      if (enableTilt) {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      }
      if (enableMagnetism) {
        gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      }
    }

    function handleMouseMove(e) {
      if (!enableTilt && !enableMagnetism) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotX = ((y - centerY) / centerY) * 10;
        const rotY = ((x - centerX) / centerX) * 10;
        gsap.to(el, {
          rotateX: rotX,
          rotateY: rotY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        const magX = (x - centerX) * 0.05;
        const magY = (y - centerY) * 0.05;
        gsap.to(el, { x: magX, y: magY, duration: 0.3, ease: 'power2.out' });
      }
    }

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousemove', handleMouseMove);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousemove', handleMouseMove);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism]);

  return (
    <div
      ref={cardRef}
      className={`particle-container ${className}`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
}
