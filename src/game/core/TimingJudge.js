export function judgeDelta(deltaMs) {
  const abs = Math.abs(deltaMs);
  if (abs <= 35) return 'perfect';
  if (abs <= 70) return 'great';
  if (abs <= 110) return 'good';
  if (abs <= 160) return deltaMs < 0 ? 'early' : 'late';
  return 'miss';
}

export function pointsFor(rating) {
  switch (rating) {
    case 'perfect': return 1000;
    case 'great': return 750;
    case 'good': return 500;
    case 'early':
    case 'late': return 150;
    default: return 0;
  }
}
