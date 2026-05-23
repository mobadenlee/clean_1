/**
 * Horizontal progress bar.
 *
 * @param {{ value: number, height?: number, color?: string }} props
 *   value — 0–100 percentage
 */
export default function ProgressBar({
  value = 0,
  height = 6,
  color = 'var(--gradient)',
}) {
  return (
    <div className="progress-bar" style={{ height }}>
      <div
        className="progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}
