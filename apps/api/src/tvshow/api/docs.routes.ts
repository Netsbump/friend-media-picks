import { HttpRouter, HttpServerResponse } from "@effect/platform";
import { openApiSpec } from "./openapi.js";

const scalarHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Friend Media Picks API Docs</title>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export const docsRoutes = HttpRouter.empty.pipe(
  HttpRouter.get("/docs", HttpServerResponse.html(scalarHtml)),
  HttpRouter.get("/openapi.json", HttpServerResponse.json(openApiSpec)),
);
