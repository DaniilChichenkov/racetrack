function getCurrentSession(db) {
  return db
    .prepare(
      `
    SELECT * FROM sessions
    WHERE isCurrent = ?
  `,
    )
    .get("true");
}

module.exports = getCurrentSession;
