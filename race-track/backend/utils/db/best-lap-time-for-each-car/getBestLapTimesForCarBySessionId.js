function getBestLapTimesForCarBySessionId(db, session_id) {
  return db
    .prepare(
      `
    SELECT * 
    FROM fastest_lap_for_car
    WHERE session_id = ?
  `,
    )
    .all(session_id);
}

module.exports = getBestLapTimesForCarBySessionId;
