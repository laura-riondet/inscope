import { avatarColorFor, initialsOf } from '../utils/senderLabel';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 36 }: AvatarProps) {
  const { bg, fg } = avatarColorFor(name);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.36,
      }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
