function updateBestLapTimePerCar(db, session_id, car_number, lap_time) {
  db.prepare(
    `
    UPDATE fastest_lap_for_car
    SET lap_time = ?
    WHERE session_id = ? AND car_number = ?
  `,
  ).run(lap_time, session_id, car_number);
}
module.exports = updateBestLapTimePerCar;
