import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const GlitchText = ({ text, className = "", as: Component = "h1" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <Component className="relative z-10 text-white">{text}</Component>
      <Component 
        className="absolute top-0 left-0 -ml-[4px] text-[#00ffff] opacity-80 mix-blend-screen"
        style={{ animation: 'glitch-anim-1 2s infinite linear alternate-reverse' }}
        aria-hidden="true"
      >
        {text}
      </Component>
      <Component 
        className="absolute top-0 left-0 ml-[4px] text-[#ff003c] opacity-80 mix-blend-screen"
        style={{ animation: 'glitch-anim-2 3s infinite linear alternate-reverse' }}
        aria-hidden="true"
      >
        {text}
      </Component>
    </div>
  );
};

const DeadFileIcon = () => (
  <div className="relative inline-block w-[120px] h-[140px] md:w-[150px] md:h-[180px]">
    {/* Base SVG */}
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full">
      <path d="M10 5 H70 L95 30 V115 H10 Z" fill="white" />
      <path d="M30 45 L45 60 M45 45 L30 60" stroke="black" strokeWidth="8" strokeLinecap="round" />
      <path d="M55 45 L70 60 M70 45 L55 60" stroke="black" strokeWidth="8" strokeLinecap="round" />
      <path d="M35 90 Q50 70 65 90" stroke="black" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
    
    {/* Glitch 1 (Cyan) */}
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" 
         className="absolute top-0 left-0 -ml-[6px] opacity-70 mix-blend-screen w-full h-full"
         style={{ animation: 'glitch-anim-1 2s infinite linear alternate-reverse' }}>
      <path d="M10 5 H70 L95 30 V115 H10 Z" fill="#00ffff" />
    </svg>

    {/* Glitch 2 (Rose) */}
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" 
         className="absolute top-0 left-0 ml-[6px] opacity-70 mix-blend-screen w-full h-full"
         style={{ animation: 'glitch-anim-2 2.5s infinite linear alternate-reverse' }}>
      <path d="M10 5 H70 L95 30 V115 H10 Z" fill="#ff003c" />
    </svg>
  </div>
);

const BackgroundLines = () => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    setLines(Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      width: Math.floor(Math.random() * 60) + 20,
      height: Math.random() > 0.8 ? 8 : 4,
      top: Math.floor(Math.random() * 100),
      left: Math.floor(Math.random() * 100),
      color: ['bg-[#00ffff]', 'bg-[#ff003c]', 'bg-white', 'bg-white', 'bg-slate-700'][Math.floor(Math.random() * 5)],
      duration: Math.random() * 0.3 + 0.1, 
      delay: Math.random() * 2,
      xAnim: [0, Math.random() > 0.5 ? 20 : -20, 0, Math.random() > 0.5 ? 10 : -10, 0]
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {lines.map((line) => (
        <motion.div
          key={line.id}
          className={`absolute ${line.color}`}
          style={{
            width: `${line.width}px`,
            height: `${line.height}px`,
            top: `${line.top}%`,
            left: `${line.left}%`,
          }}
          animate={{
            opacity: [0, 1, 0, 0, 1, 0],
            x: line.xAnim,
          }}
          transition={{
            duration: line.duration * 4,
            repeat: Infinity,
            delay: line.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const NotFound = () => {
  return (
    <>
      <style>
        {`
          @keyframes glitch-anim-1 {
            0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
            20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
            40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
            60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
            80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
            100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
          }
          @keyframes glitch-anim-2 {
            0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -1px); }
            20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 2px); }
            40% { clip-path: inset(30% 0 20% 0); transform: translate(2px, -2px); }
            60% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 1px); }
            80% { clip-path: inset(20% 0 50% 0); transform: translate(1px, -1px); }
            100% { clip-path: inset(50% 0 30% 0); transform: translate(-1px, 2px); }
          }
        `}
      </style>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-black overflow-hidden font-mono">
        <BackgroundLines />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <DeadFileIcon />
          </motion.div>

          <GlitchText 
            text="404" 
            as="h1" 
            className="text-7xl md:text-9xl font-black tracking-widest drop-shadow-lg" 
          />
          
          <GlitchText 
            text="PAGE NOT FOUND" 
            as="h2" 
            className="mt-2 text-xl md:text-3xl font-bold tracking-[0.2em]" 
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-12"
          >
            <Link 
              to="/dashboard"
              className="relative inline-block group"
            >
              <div className="absolute inset-0 bg-[#00ffff] translate-x-[4px] translate-y-[4px] group-hover:translate-x-[6px] group-hover:translate-y-[6px] transition-transform duration-200 z-0" />
              <div className="absolute inset-0 bg-[#ff003c] -translate-x-[4px] -translate-y-[4px] group-hover:-translate-x-[6px] group-hover:-translate-y-[6px] transition-transform duration-200 z-0" />
              <div className="relative z-10 border-2 border-white bg-black px-8 py-3 font-bold text-white uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-colors duration-200">
                RETURN
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
