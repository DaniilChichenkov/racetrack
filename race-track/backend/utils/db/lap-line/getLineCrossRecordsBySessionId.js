function getLineCrossRecordsBySessionId(db, session_id) {
  return db
    .prepare(
      `
    SELECT * 
    FROM lap_line_records
    WHERE session_id = ?
  `,
    )
    .all(session_id);
}

module.exports = getLineCrossRecordsBySessionId;
