import { openApiComponents } from "./openapi.components.js";
import { openApiPaths } from "./openapi.paths.js";

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Friend Media Picks API",
    version: "1.0.0",
    description: "API for creating and reading friend media picks.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "API status endpoints.",
    },
    {
      name: "TV Shows",
      description: "TV show catalog endpoints.",
    },
  ],
  paths: openApiPaths,
  components: openApiComponents,
} as const;
