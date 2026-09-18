function getNonFinishedSessions(db) {
  return db
    .prepare(
      `
    SELECT * FROM sessions
    WHERE status != ?
  `,
    )
    .all("finished");
}

module.exports = getNonFinishedSessions;
