function deleteDriversOfSessionById(db, sessionId) {
  db.prepare(
    `
    DELETE
    FROM drivers
    WHERE session_id = ?
  `,
  ).run(sessionId);
}

module.exports = deleteDriversOfSessionById;
