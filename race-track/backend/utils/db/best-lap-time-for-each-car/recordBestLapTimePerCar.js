function recordBestLapTimePerCar(db, session_id, car_number, lap_time) {
  db.prepare(
    `
    INSERT INTO fastest_lap_for_car (session_id, car_number, lap_time)
    VALUES (?, ?, ?)
  `,
  ).run(session_id, car_number, lap_time);
}
module.exports = recordBestLapTimePerCar;
