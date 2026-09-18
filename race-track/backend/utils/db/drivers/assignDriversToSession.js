function assignDriversToSession(db, sessionId, driver) {
  db.prepare(
    `
      INSERT INTO drivers(name, car_assigned, session_id)
      VALUES(?, ?, ?)
    `,
  ).run(driver.name, driver.car, sessionId);
}

module.exports = assignDriversToSession;
