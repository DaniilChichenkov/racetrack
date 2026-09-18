function updateLineCrossRecord(db, record_id, lap_time) {
  db.prepare(
    `
    UPDATE lap_line_records
    SET time = ?, lap_time = ?
    WHERE id = ?
  `,
  ).run(Date.now(), lap_time, record_id);
}
module.exports = updateLineCrossRecord;
