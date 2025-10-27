import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './Button.css';

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', // 'primary', 'secondary', 'theme'
  className = '',
  ...props 
}) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        y: -2,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(button.querySelector('.button-glow'), {
        opacity: 0.8,
        duration: 0.3
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(button.querySelector('.button-glow'), {
        opacity: 0,
        duration: 0.3
      });
    };

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      button.style.setProperty('--mouse-x', `${x}%`);
      button.style.setProperty('--mouse-y', `${y}%`);
    };

    const handleClick = (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      button.appendChild(ripple);

      gsap.fromTo(ripple, 
        { scale: 0, opacity: 1 },
        { 
          scale: 4, 
          opacity: 0, 
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => ripple.remove()
        }
      );

      // Bounce effect
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });

      if (onClick) onClick(e);
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('click', handleClick);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('click', handleClick);
    };
  }, [onClick]);

  return (
    <button 
      ref={buttonRef}
      className={`animated-button animated-button--${variant} ${className}`}
      {...props}
    >
      <div className="button-glow"></div>
      <span className="button-text">{children}</span>
    </button>
  );
};

export default AnimatedButton;
