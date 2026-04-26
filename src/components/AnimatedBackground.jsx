import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const AnimatedBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const orbs = container.querySelectorAll('.orb');

    orbs.forEach((orb) => {
      gsap.set(orb, {
        x: 'random(-200, 200)vw',
        y: 'random(-200, 200)vh',
        scale: 'random(0.5, 2)',
        opacity: 'random(0.3, 0.7)'
      });

      gsap.to(orb, {
        x: 'random(-50, 50)vw',
        y: 'random(-50, 50)vh',
        duration: 'random(10, 20)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 'random(0, 2)'
      });
    });

    return () => {
      gsap.killTweensOf(orbs);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-rpg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rpg-panel/50 via-rpg-bg to-rpg-bg"></div>
      
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="orb absolute top-1/2 left-1/2 w-32 h-32 rounded-full blur-3xl mix-blend-screen"
          style={{
            backgroundColor: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#22c55e',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
