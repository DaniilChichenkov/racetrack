function getDriverByCarNumber(db, session_id, car_number) {
  return db
    .prepare(
      `
      SELECT *
      FROM drivers
      WHERE session_id = ? AND car_assigned = ?
    `,
    )
    .get(session_id, car_number);
}

module.exports = getDriverByCarNumber;
