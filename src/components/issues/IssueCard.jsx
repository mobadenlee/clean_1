import { useNavigate } from 'react-router-dom';
import Avatar   from '../ui/Avatar';
import { Badge, CategoryBadge, UrgencyBadge } from '../ui/Badge';
import Icon     from '../ui/Icon';
import { truncate } from '../../utils/formatters';

/**
 * Renders a single issue as a clickable card.
 *
 * @param {{ issue: Object, compact?: boolean }} props
 */
export default function IssueCard({ issue, compact = false }) {
  const navigate = useNavigate();

  const urgentClass = issue.urgency === 'Critical' ? 'urgent' : '';
  const solvedClass = issue.solved ? 'solved' : '';

  return (
    <article
      className={`issue-card ${solvedClass} ${urgentClass}`}
      onClick={() => navigate(`/issue/${issue.id}`)}
    >
      {/* Title row */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12, marginBottom: 10,
        }}
      >
        <h3 style={{ fontSize: compact ? '13.5px' : '15px', fontWeight: 600, lineHeight: 1.4, flex: 1 }}>
          {issue.title}
        </h3>
        {issue.solved && <Badge text="Solved" variant="badge-green" icon="✓" />}
      </div>

      {/* Tag row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <CategoryBadge category={issue.category} />
        <UrgencyBadge  level={issue.urgency} />
        <Badge text={issue.state} variant="badge-gray" icon="📍" />
      </div>

      {/* Description preview */}
      {!compact && (
        <p
          style={{
            fontSize: 13.5, color: 'var(--text-secondary)',
            lineHeight: 1.6, marginBottom: 14,
          }}
        >
          {truncate(issue.description, 120)}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Stat icon="chevronUp" value={issue.upvotes}   />
          <Stat icon="message"   value={issue.responses} />
          <Stat icon="eye"       value={issue.views}     />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar user={issue.author} size={22} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {issue.author.name} · {issue.createdAt}
          </span>
          {issue.author.ambassador && (
            <Badge text="Ambassador" variant="badge-blue" icon="🛡️" />
          )}
        </div>
      </div>
    </article>
  );
}

function Stat({ icon, value }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--text-muted)' }}>
      <Icon name={icon} size={13} /> {value}
    </span>
  );
}
