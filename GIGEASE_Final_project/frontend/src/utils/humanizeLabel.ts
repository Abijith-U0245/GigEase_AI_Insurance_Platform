/** zone_risk_score → Zone risk score */
export function humanizeSnake(s: string): string {
  return s
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}
