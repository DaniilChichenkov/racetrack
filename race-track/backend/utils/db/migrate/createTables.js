function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'pending',
      started_at INTEGER DEFAULT NULL,
      editing_last_seen INTEGER DEFAULT NULL,
      isCurrent TEXT NOT NULL DEFAULT 'false'
    );

    CREATE TABLE IF NOT EXISTS drivers(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      car_assigned INTEGER NOT NULL,
      session_id INTEGER NOT NULL,

      FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE CASCADE,

      UNIQUE(name, session_id)
    );

    CREATE TABLE IF NOT EXISTS race_mode(
      id INTEGER PRIMARY KEY,
      mode TEXT NOT NULL DEFAULT 'danger'
    );

    CREATE TABLE IF NOT EXISTS lap_line_records(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      driver_name TEXT NOT NULL,
      driver_car_number INTEGER NOT NULL,
      time INTEGER NOT NULL,
      lap_time INTEGER DEFAULT NULL,

      FOREIGN KEY (session_id) 
        REFERENCES sessions(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS best_lap_times(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      driver_name TEXT NOT NULL,
      driver_car_number INTEGER NOT NULL,
      lap_time INTEGER DEFAULT NULL,

      FOREIGN KEY (session_id) 
        REFERENCES sessions(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fastest_lap_for_car(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      car_number INTEGER NOT NULL,
      lap_time INTEGER DEFAULT NULL,

      FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS laps_count(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      car_number INTEGER NOT NULL,
      laps_count INTEGER DEFAULT NULL,

      FOREIGN KEY (session_id) 
        REFERENCES sessions(id)
        ON DELETE CASCADE
    )
  `);

  db.prepare(
    `INSERT OR IGNORE INTO race_mode(id, mode) VALUES(1, 'danger')`,
  ).run();
}

module.exports = createTables;
