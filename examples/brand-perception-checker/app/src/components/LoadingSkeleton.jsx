import { motion } from 'framer-motion';

export function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="loading-container"
    >
      <div className="grid-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel skeleton-pulse" style={{ height: '100px' }}></div>
        ))}
      </div>
      <div className="glass-panel skeleton-pulse" style={{ height: '80px', marginBottom: '16px' }}></div>
      <div className="grid-bento">
        <div className="glass-panel col-8 skeleton-pulse" style={{ height: '400px' }}></div>
        <div className="glass-panel col-4 skeleton-pulse" style={{ height: '400px' }}></div>
      </div>
    </motion.div>
  );
}
