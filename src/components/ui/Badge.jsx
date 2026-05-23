import { CATEGORY_BADGE_MAP, URGENCY_CLASS_MAP } from '../../data/constants';

/**
 * Generic Badge.
 */
export function Badge({ text, variant = 'badge-gray', icon }) {
  return (
    <span className={`badge ${variant}`}>
      {icon && <span>{icon}</span>}
      {text}
    </span>
  );
}

/**
 * Category-aware Badge — looks up the correct colour automatically.
 */
export function CategoryBadge({ category }) {
  const variant = CATEGORY_BADGE_MAP[category] ?? 'badge-gray';
  return <Badge text={category} variant={variant} />;
}

/**
 * Urgency-aware Badge with priority dot.
 */
export function UrgencyBadge({ level }) {
  const cls = URGENCY_CLASS_MAP[level] ?? 'badge-gray';
  return (
    <span className={`badge ${cls}`}>
      <span className={`priority-dot priority-${level?.toLowerCase()}`} />
      {level}
    </span>
  );
}
