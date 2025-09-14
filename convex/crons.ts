import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update trending status every hour
crons.interval(
  "update trending status",
  { hours: 1 },
  internal.topics.updateTrendingStatus,
  {}
);

export default crons;