import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

type AvatarSize = 'sm' | 'md' | 'lg';

/** Colour palette for avatar backgrounds (WCAG AA contrast on white text). */
const AVATAR_PALETTE = [
  '#1976d2', // blue
  '#388e3c', // green
  '#7b1fa2', // purple
  '#c62828', // red
  '#0097a7', // cyan
  '#e64a19', // deep-orange
  '#5d4037', // brown
  '#00796b', // teal
  '#f57c00', // orange
  '#455a64', // blue-grey
];

/**
 * Generates a deterministic index into AVATAR_PALETTE from a string.
 */
function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0; // keep as 32-bit unsigned
  }
  return hash % AVATAR_PALETTE.length;
}

/**
 * Extracts up to two uppercase initials from a display name.
 * "John Doe" → "JD", "Admin" → "A"
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0] ?? '';
  const second = words.length > 1 ? (words[1][0] ?? '') : '';
  return (first + second).toUpperCase();
}

const SIZE_MAP: Record<AvatarSize, string> = {
  sm: '28px',
  md: '36px',
  lg: '48px',
};

const FONT_SIZE_MAP: Record<AvatarSize, string> = {
  sm: '11px',
  md: '13px',
  lg: '18px',
};

/**
 * Standalone avatar component that renders a coloured circle with initials.
 * The background colour is derived deterministically from the name.
 *
 * Usage: <app-avatar [name]="user.displayName" size="md" />
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      class="avatar"
      [style.width]="dimension()"
      [style.height]="dimension()"
      [style.font-size]="fontSize()"
      [style.background-color]="bgColor()"
      [attr.aria-label]="name()"
      role="img"
    >
      {{ initials() }}
    </div>
  `,
  styles: [`
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #fff;
      font-weight: 700;
      letter-spacing: 0.04em;
      flex-shrink: 0;
      user-select: none;
    }
  `],
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<AvatarSize>('md');

  readonly initials = computed(() => getInitials(this.name()));
  readonly bgColor = computed(() => AVATAR_PALETTE[hashName(this.name())]);
  readonly dimension = computed(() => SIZE_MAP[this.size()]);
  readonly fontSize = computed(() => FONT_SIZE_MAP[this.size()]);
}
