import { HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";
import { apiRouter } from "./tvshow/api/router.js";
import { makeAppLive } from "./runtime/app.layer.js";
import { makeStartupLogs } from "./runtime/startup-logs.js";

const port = Number(process.env.API_PORT ?? 3000);

const AppLive = makeAppLive();

const apiWithDependencies = apiRouter.pipe(Effect.provide(AppLive));

const nodeHttpServer = NodeHttpServer.layer(() => createServer(), { port });

const serverLayer = HttpServer.serve(apiWithDependencies).pipe(Layer.provide(nodeHttpServer));

const main = Effect.gen(function* () {
  yield* makeStartupLogs(port);
  return yield* Layer.launch(serverLayer);
});

NodeRuntime.runMain(main);
