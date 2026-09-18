function startSession(db, id) {
  db.prepare(`UPDATE sessions SET status = ?, started_at = ? WHERE id = ?`).run(
    "active",
    Date.now(),
    id,
  );
}

module.exports = startSession;
