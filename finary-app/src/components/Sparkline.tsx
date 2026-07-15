/** Mini-courbe de prix en SVG pur (verte si en hausse, rouge sinon). */
export function Sparkline({
  data,
  width = 160,
  height = 44,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const h = height - pad * 2;
  const stepX = width / (data.length - 1);
  const pts = data.map(
    (v, i) => `${(i * stepX).toFixed(1)},${(pad + (1 - (v - min) / span) * h).toFixed(1)}`,
  );
  const up = data[data.length - 1] >= data[0];
  const color = up ? '#22c55e' : '#ef4444';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(' ')}
      />
    </svg>
  );
}
