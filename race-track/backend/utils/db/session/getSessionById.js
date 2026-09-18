function getSessionById(db, id) {
  return db
    .prepare(
      `
    SELECT * 
    FROM sessions
    WHERE id = ?
  `,
    )
    .get(id);
}

module.exports = getSessionById;
