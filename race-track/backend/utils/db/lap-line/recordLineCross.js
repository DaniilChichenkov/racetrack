function recordLineCross(db, driver, lap_time) {
  db.prepare(
    `
    INSERT INTO lap_line_records (driver_name, driver_car_number, session_id, time, lap_time)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(
    driver.name,
    driver.car_assigned,
    driver.session_id,
    Date.now(),
    lap_time,
  );
}

module.exports = recordLineCross;
