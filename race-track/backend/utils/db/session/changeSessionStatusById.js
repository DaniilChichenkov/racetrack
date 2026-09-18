function changeSessionStatusById(db, newStatus, sessionId) {
  db.prepare(
    `
    UPDATE sessions
    SET status = ?
    WHERE id = ?
  `,
  ).run(newStatus, sessionId);
}

module.exports = changeSessionStatusById;
