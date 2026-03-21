import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup inactive lobbies",
  { hours: 24 },
  api.games.cleanupInactiveLobbies,
  {},
);

export default crons;
