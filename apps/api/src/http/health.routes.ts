import { HttpRouter, HttpServerResponse } from "@effect/platform";

export const healthRoutes = HttpRouter.empty.pipe(
  HttpRouter.get("/health", HttpServerResponse.json({ status: "ok" })),
  HttpRouter.get("/", HttpServerResponse.text("Friend Media Picks API")),
);
