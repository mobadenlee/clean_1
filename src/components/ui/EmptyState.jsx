/**
 * Generic empty-state placeholder.
 */
export default function EmptyState({ icon = '📭', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      {title && <div className="empty-title">{title}</div>}
      {text  && <div className="empty-text">{text}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
