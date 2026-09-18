export function getRemainingTime(startedAt) {
  const duration = 10 * 60 * 1000; // 10 minutes
  const elapsed = Date.now() - startedAt;

  const remaining = Math.max(duration - elapsed, 0);

  const minutes = Math.floor(remaining / 1000 / 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return {
    minutes,
    seconds,
  };
}
