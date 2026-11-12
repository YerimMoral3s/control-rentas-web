import { ICONS, type IconName } from './icons';

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  /** Solo para iconos que comunican algo sin texto visible al lado. */
  label?: string;
};

export function Icon({ name, size = 20, strokeWidth = 2, label }: IconProps) {
  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  if (name === 'more') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        focusable="false"
        {...a11y}
      >
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      style={{ flex: 'none' }}
      {...a11y}
    >
      {ICONS[name]}
    </svg>
  );
}

export type { IconName };
