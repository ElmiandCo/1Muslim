export type AvatarPosition = -1 | 0 | 1;

/** Convert pointer travel into a position bounded by the available track. */
export function avatarDragPosition(start: AvatarPosition, deltaX: number, travel: number): number {
 if (travel <= 0) return start;
 return Math.max(-1, Math.min(1, start + deltaX / travel));
}

/** Snap to the nearest of the three positions. */
export function snapAvatarPosition(position: number): AvatarPosition {
 return position < -0.5 ? -1 : position > 0.5 ? 1 : 0;
}
