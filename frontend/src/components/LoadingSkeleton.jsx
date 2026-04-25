export function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton skeleton--row" style={{ width: '100%', animationDelay: `${i * 0.08}s` }} />
  ));
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className="skeleton skeleton--heading" />
      <div className="skeleton skeleton--text" style={{ width: '80%' }} />
      <div className="skeleton skeleton--text" style={{ width: '60%' }} />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="card profile-card" style={{ padding: '32px' }}>
      <div className="skeleton skeleton--avatar" />
      <div className="skeleton skeleton--text" style={{ width: '40%', margin: '0 auto 24px' }} />
      <div className="skeleton skeleton--text" />
      <div className="skeleton skeleton--text" />
      <div className="skeleton skeleton--text" style={{ width: '70%' }} />
    </div>
  );
}
