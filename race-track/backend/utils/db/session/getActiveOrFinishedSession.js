function getActiveOrFinishedSession(db) {
  return db
    .prepare(
      `
    SELECT * 
    FROM sessions
    WHERE status = ? OR status = ?
  `,
    )
    .get("active", "finished");
}

module.exports = getActiveOrFinishedSession;
