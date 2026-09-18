function deleteSessionById(db, id) {
  db.prepare(
    `
    DELETE FROM sessions
    WHERE id = ?
  `,
  ).run(id);
}

module.exports = deleteSessionById;
