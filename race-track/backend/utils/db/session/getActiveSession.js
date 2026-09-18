function getActiveSession(db) {
  return db
    .prepare(
      `
    SELECT * 
    FROM sessions
    WHERE status = ?
  `,
    )
    .get("active");
}

module.exports = getActiveSession;
