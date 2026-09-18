function getLineCrossRecordByDriverNameAndSessionId(
  db,
  driver_name,
  session_id,
) {
  return db
    .prepare(
      `
    SElECT * 
    FROM lap_line_records
    WHERE session_id = ? 
    AND driver_name = ?
  `,
    )
    .get(session_id, driver_name);
}
module.exports = getLineCrossRecordByDriverNameAndSessionId;
