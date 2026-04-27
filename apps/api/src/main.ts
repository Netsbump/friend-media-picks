import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { createServer } from "node:http";

const port = Number(process.env.API_PORT ?? 3000);

const app = HttpRouter.empty.pipe(
  HttpRouter.get("/health", HttpServerResponse.json({ status: "ok" })),
  HttpRouter.get("/", HttpServerResponse.text("Friend Media Picks API")),
);

const program = HttpServer.serveEffect(app).pipe(
  Effect.provide(NodeHttpServer.layer(() => createServer(), { port })),
);

NodeRuntime.runMain(Effect.scoped(program));
