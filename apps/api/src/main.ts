import {
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { createServer } from "node:http";

import {
  SerieRepository,
  type SerieRepositoryErrorReason,
} from "./application/serie/serie.repo.port.js";
import { SerieRepoLive } from "./infra/database/serie.repository.js";
import { createSerieHttpHandler } from "./interface/serie/serie.controller.js";

const port = Number(process.env.API_PORT ?? 3000);

const createSerieRoute = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const body = yield* request.json;

  const serie = yield* createSerieHttpHandler(body);

  return yield* HttpServerResponse.json(serie, { status: 201 });
}).pipe(
  Effect.catchAll((error) => {
    if (error && typeof error === "object" && "_tag" in error) {
      const taggedError = error as {
        _tag: string;
        message?: string;
        reason?: SerieRepositoryErrorReason;
      };

      if (taggedError._tag === "ValidationError" || taggedError._tag === "DomainError") {
        return HttpServerResponse.json(
          { message: taggedError.message ?? "Invalid request payload" },
          { status: 400 },
        );
      }

      if (taggedError._tag === "SerieRepositoryError") {
        return HttpServerResponse.json(
          {
            message: taggedError.message ?? "Repository error",
            reason: taggedError.reason ?? "unknown",
          },
          { status: 500 },
        );
      }
    }

    return HttpServerResponse.json(
      { message: "Unexpected error", error: String(error) },
      { status: 500 },
    );
  }),
);

const app = HttpRouter.empty.pipe(
  HttpRouter.get("/health", HttpServerResponse.json({ status: "ok" })),
  HttpRouter.get("/", HttpServerResponse.text("Friend Media Picks API")),
  HttpRouter.post("/series", createSerieRoute),
  HttpRouter.provideService(SerieRepository, SerieRepoLive),
);

const program = HttpServer.serveEffect(app).pipe(
  Effect.provide(NodeHttpServer.layer(() => createServer(), { port })),
);

NodeRuntime.runMain(Effect.scoped(program));
