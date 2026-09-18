const getCurrentSession = require("./getCurrentSession.js");
const getFirstSessionInQueue = require("./getFirstSessionInQueue.js");

function assignCurrentSession(db) {
  const currentSession = getCurrentSession(db);
  // If no current session was found -> Mark first one as current
  if (!currentSession) {
    const firstSessionInQueue = getFirstSessionInQueue(db);

    // If something was found
    if (firstSessionInQueue) {
      db.prepare(
        `
        UPDATE sessions
        SET isCurrent = ?
        WHERE id = ?
      `,
      ).run("true", firstSessionInQueue.id);
    }
  }
}

module.exports = assignCurrentSession;
