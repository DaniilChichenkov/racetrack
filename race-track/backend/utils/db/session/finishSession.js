function finishSession(db, id) {
  db.prepare(
    `
      UPDATE sessions
      SET status = ? 
      WHERE id = ?
    `,
  ).run("finished", id);
}

module.exports = finishSession;
