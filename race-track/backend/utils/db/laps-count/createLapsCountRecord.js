function createLapsCountRecord(db, session_id, car) {
  db.prepare(
    `
    INSERT INTO laps_count (session_id, car_number, laps_count)
    VALUES (?, ?, ?)
  `,
  ).run(session_id, car, 0);
}
module.exports = createLapsCountRecord;
