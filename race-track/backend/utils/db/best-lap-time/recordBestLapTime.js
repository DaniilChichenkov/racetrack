function recordBestLapTime(db, driver, lap_time) {
  db.prepare(
    `
    INSERT INTO best_lap_times
    (session_id, driver_name, driver_car_number, lap_time)
    VALUES (?, ?, ?, ?)
  `,
  ).run(driver.session_id, driver.name, driver.car_assigned, lap_time);
}
module.exports = recordBestLapTime;
