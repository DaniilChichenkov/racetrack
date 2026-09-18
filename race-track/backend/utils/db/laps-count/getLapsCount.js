function getLapsCount(db, session_id) {
  return db
    .prepare(
      `
    SELECT * 
    FROM laps_count
    WHERE session_id = ?
  `,
    )
    .all(session_id);
}

module.exports = getLapsCount;
