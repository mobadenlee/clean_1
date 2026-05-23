/**
 * Renders a circular avatar with the user's initials and brand colour.
 *
 * @param {{ user: Object, size?: number }} props
 */
export default function Avatar({ user, size = 36 }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: user?.color ?? '#9BA8BE',
        fontSize: size * 0.33,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {user?.initials ?? '?'}
    </div>
  );
}
