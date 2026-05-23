import Icon from './Icon';

/**
 * Fixed-position toast notification.
 *
 * @param {{ message: string, type?: 'info'|'success'|'error', onClose: Function }} props
 */
export default function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button onClick={onClose} style={{ opacity: 0.7, marginLeft: 8 }}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
