import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup inactive lobbies",
  { hours: 2 },
  api.games.cleanupInactiveLobbies,
  {},
);

export default crons;
