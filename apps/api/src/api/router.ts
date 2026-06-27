import { HttpRouter } from "@effect/platform";
import { healthRoutes } from "./health.routes.js";
import { tvShowRoutes } from "./tvshow.routes.js";

export const apiRouter = HttpRouter.concatAll(healthRoutes, tvShowRoutes);
