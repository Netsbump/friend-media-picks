export const openApiPaths = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      operationId: "getHealth",
      responses: {
        "200": {
          description: "API is running.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    example: "ok",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/tvshows": {
    get: {
      tags: ["TV Shows"],
      summary: "List TV shows",
      operationId: "getTvShows",
      responses: {
        "200": {
          description: "TV shows list.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/TvShow",
                },
              },
            },
          },
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
    post: {
      tags: ["TV Shows"],
      summary: "Create a TV show",
      operationId: "createTvShow",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateTvShowRequest",
            },
            examples: {
              dark: {
                summary: "Dark",
                value: {
                  name: "Dark",
                  description: "Sci-fi mystery series",
                  seasons: 3,
                  episodes: 26,
                  releaseAt: "2017-12-01",
                  directors: [
                    {
                      firstName: "Baran",
                      lastName: "bo Odar",
                    },
                  ],
                  writers: [
                    {
                      firstName: "Jantje",
                      lastName: "Friese",
                    },
                  ],
                  stars: [
                    {
                      firstName: "Louis",
                      lastName: "Hofmann",
                    },
                  ],
                  genres: [
                    {
                      name: "Sci-fi",
                      description: "Science fiction",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "TV show created.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TvShow",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/BadRequest",
        },
        "422": {
          $ref: "#/components/responses/UnprocessableEntity",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },
  "/tvshows/{id}": {
    get: {
      tags: ["TV Shows"],
      summary: "Get a TV show by id",
      operationId: "getTvShowById",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          example: "0192d511-ed73-732e-904a-0d6610c15c75",
        },
      ],
      responses: {
        "200": {
          description: "TV show found.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TvShow",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/BadRequest",
        },
        "404": {
          $ref: "#/components/responses/NotFound",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },
} as const;
