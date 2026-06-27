import { HttpRouter } from "@effect/platform";
import { healthRoutes } from "./health.routes.js";
import { serieRoutes } from "./serie.routes.js";
import { tvShowRoutes } from "./tvshow.routes.js";

export const apiRouter = HttpRouter.concatAll(healthRoutes, serieRoutes, tvShowRoutes);
