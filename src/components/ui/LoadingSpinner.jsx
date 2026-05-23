/**
 * Inline loading spinner.
 *
 * @param {{ size?: number, color?: string }} props
 */
export default function LoadingSpinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, borderTopColor: color }}
    />
  );
}
