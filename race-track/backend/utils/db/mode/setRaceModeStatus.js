function setRaceModeStatus(db, status) {
  db.prepare(
    `
      UPDATE race_mode
      SET mode = ?
      WHERE id = ?
    `,
  ).run(status, 1);
}

module.exports = setRaceModeStatus;
