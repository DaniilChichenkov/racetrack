function getRaceMode(db) {
  return db
    .prepare(
      `
      SELECT mode
      FROM race_mode
      WHERE id = ?
    `,
    )
    .get(1);
}

module.exports = getRaceMode;
