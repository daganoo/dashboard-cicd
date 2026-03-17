export default function Skeleton({ width = '100%', height = 20, borderRadius = 8 }) {
    return (
      <div style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #1a1d2e 25%, #2a2d3e 50%, #1a1d2e 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
    )
  }