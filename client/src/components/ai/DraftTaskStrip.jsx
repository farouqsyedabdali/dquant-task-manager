import { motion } from 'framer-motion';

const PRIORITY_BG = {
  URGENT: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#64748b',
};

/**
 * Horizontal strip of compact "draft" cards (tasks created from this chat session).
 */
export default function DraftTaskStrip({ items, onDismiss, onEdit }) {
  if (!items?.length) return null;

  return (
    <div
      className="shrink-0 z-20 border-b overflow-hidden"
      style={{
        borderColor: 'var(--color-border-default)',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-secondary) 85%, transparent)',
      }}
    >
      <div className="px-4 sm:px-6 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Created this session
        </p>
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 snap-x snap-mandatory">
          {items.map((item, i) => (
            <motion.article
              key={item.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.15), duration: 0.25 }}
              className="snap-start shrink-0 w-[min(100%,320px)] p-4 rounded-2xl border text-left max-w-sm"
              style={{
                borderColor: 'var(--color-border-default)',
                backgroundColor: 'var(--color-bg-primary)',
              }}
            >
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Draft task
              </p>
              <p className="font-semibold text-sm mb-2 leading-snug line-clamp-2">{item.title}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  {item.dueLabel}
                </span>
                {item.priority && item.priority !== '—' && (
                  <span
                    className="px-2 py-1 rounded-lg font-medium text-white"
                    style={{ backgroundColor: PRIORITY_BG[item.priority] || PRIORITY_BG.MEDIUM }}
                  >
                    {item.priority}
                  </span>
                )}
                <span className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  {item.projectLabel}
                </span>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onDismiss?.(item.key)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => onEdit?.(item)}
                  disabled={!item.taskId}
                  className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                >
                  Edit
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
