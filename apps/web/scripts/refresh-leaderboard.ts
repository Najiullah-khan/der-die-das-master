import { refreshLeaderboard } from "../lib/db/queries/leaderboard";

refreshLeaderboard()
  .then((n) => {
    console.log(`Leaderboard refreshed: ${n} row(s).`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Leaderboard refresh failed:", err);
    process.exit(1);
  });
