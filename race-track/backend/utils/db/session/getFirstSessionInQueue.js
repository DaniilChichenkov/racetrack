function getFirstSessionInQueue(db) {
  return db
    .prepare(
      `
        SELECT * FROM sessions
        WHERE status != ? AND status != ?
        ORDER BY id ASC
        LIMIT 1
      `,
    )
    .get("active", "finished");
}

module.exports = getFirstSessionInQueue;
