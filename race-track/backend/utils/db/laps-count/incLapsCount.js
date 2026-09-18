function incLapsCount(db, session_id, car) {
  db.prepare(
    `
      UPDATE laps_count
      SET laps_count = laps_count + 1
      WHERE session_id = ? AND car_number = ?  
  `,
  ).run(session_id, car);
}

module.exports = incLapsCount;
