import React, { useEffect, useState } from 'react';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats?coachId=coach_deepa')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      {stats ? <pre>{JSON.stringify(stats, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}
