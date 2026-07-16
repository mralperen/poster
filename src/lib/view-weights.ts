export function getViewWeights(progress: number, viewCount: number): number[] {
  const clamped = Math.max(0, Math.min(1, progress));

  if (viewCount <= 1) return [1];
  if (viewCount === 2) return [1 - clamped, clamped];

  const weights = new Array(viewCount).fill(0);
  const scaled = clamped * (viewCount - 1);
  const index = Math.min(Math.floor(scaled), viewCount - 2);
  const t = scaled - index;

  weights[index] = 1 - t;
  weights[index + 1] = t;
  return weights;
}

export function getViewLabel(
  progress: number,
  viewCount: number,
  labels: string[],
): string {
  if (viewCount === 2) {
    if (progress < 0.35) return labels[0] ?? "Sol";
    if (progress > 0.65) return labels[1] ?? "Sağ";
    return "Geçiş";
  }

  if (viewCount === 3) {
    if (progress < 0.25) return labels[0] ?? "Sol";
    if (progress > 0.75) return labels[2] ?? "Sağ";
    return labels[1] ?? "Orta";
  }

  const weights = getViewWeights(progress, viewCount);
  const maxIndex = weights.indexOf(Math.max(...weights));
  return labels[maxIndex] ?? `Görünüm ${maxIndex + 1}`;
}
