import { HttpRouter } from "@effect/platform";
import { docsRoutes } from "./docs.routes.js";
import { healthRoutes } from "./health.routes.js";
import { tvShowRoutes } from "./tvshow.routes.js";

export const apiRouter = HttpRouter.concatAll(healthRoutes, docsRoutes, tvShowRoutes);
