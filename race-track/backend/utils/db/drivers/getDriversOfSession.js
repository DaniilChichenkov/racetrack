function getDriversOfSession(db, sessionId) {
  return db
    .prepare(
      `
    SELECT *
    FROM drivers
    WHERE session_id = ?
  `,
    )
    .all(sessionId);
}

module.exports = getDriversOfSession;
