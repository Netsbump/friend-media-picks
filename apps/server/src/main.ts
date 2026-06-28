import { HttpApiBuilder, HttpApiScalar, HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";
import { makeAppLive } from "./runtime/app.layer.js";
import { makeStartupLogs } from "./runtime/startup-logs.js";
import { friendMediaPicksApi } from "./tvshow/api/tvshow.api.js";
import { healthApiLive, tvShowsApiLive } from "./tvshow/api/tvshow.api.live.js";

const port = Number(process.env.API_PORT ?? 3000);

const AppLive = makeAppLive();

const ApiLive = HttpApiBuilder.api(friendMediaPicksApi).pipe(
  Layer.provide(healthApiLive),
  Layer.provide(tvShowsApiLive),
  Layer.provide(AppLive),
);

const nodeHttpServer = NodeHttpServer.layer(() => createServer(), { port });

const serverLayer = HttpApiBuilder.serve().pipe(
  Layer.provide(HttpApiBuilder.middlewareOpenApi()),
  Layer.provide(HttpApiScalar.layerCdn({ path: "/docs" })),
  HttpServer.withLogAddress,
  Layer.provide(ApiLive),
  Layer.provide(nodeHttpServer),
);

const main = Effect.gen(function* () {
  yield* makeStartupLogs(port);
  return yield* Layer.launch(serverLayer);
});

NodeRuntime.runMain(main);
