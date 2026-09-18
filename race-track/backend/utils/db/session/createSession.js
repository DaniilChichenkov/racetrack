function createSession(db) {
  const { lastInsertRowid } = db
    .prepare(
      `
          INSERT INTO sessions(created_at, status)
          VALUES(?, ?)
        `,
    )
    .run(Date.now(), "pending");

  return lastInsertRowid;
}

module.exports = createSession;
