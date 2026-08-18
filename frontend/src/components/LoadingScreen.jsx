import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background text-text z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="relative flex items-center justify-center bg-primary/10 p-5 rounded-3xl shadow-[0_0_40px_-10px_var(--color-primary)] border border-primary/20"
        >
          <Package className="h-12 w-12 text-primary drop-shadow-md" />
        </motion.div>
        
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-text-muted tracking-[0.3em] uppercase">
            {message}
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
