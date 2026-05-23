/**
 * Reusable Button component.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'|'icon'}                  size
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...rest
}) {
  const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg', icon: 'btn-icon' }[size] ?? '';
  const varClass  = `btn-${variant}`;

  return (
    <button
      type={type}
      className={`btn ${varClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
