function getSessionsInQueue(db) {
  return db
    .prepare(
      `
    SELECT * 
    FROM sessions
    WHERE isCurrent != ?
  `,
    )
    .all("true");
}

module.exports = getSessionsInQueue;
