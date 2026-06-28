const apiErrorContent = {
  "application/json": {
    schema: {
      $ref: "#/components/schemas/ApiError",
    },
  },
} as const;

export const openApiComponents = {
  schemas: {
    ApiError: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: {
          type: "string",
          examples: ["VALIDATION_ERROR", "NOT_FOUND", "UNEXPECTED_ERROR"],
        },
        message: {
          type: "string",
        },
        details: {},
      },
    },
    CreateGenre: {
      type: "object",
      required: ["name", "description"],
      properties: {
        name: {
          type: "string",
          minLength: 1,
        },
        description: {
          type: "string",
        },
      },
    },
    CreatePerson: {
      type: "object",
      required: ["firstName", "lastName"],
      properties: {
        firstName: {
          type: "string",
          minLength: 1,
        },
        lastName: {
          type: "string",
          minLength: 1,
        },
      },
    },
    CreateTvShowRequest: {
      type: "object",
      required: [
        "name",
        "description",
        "seasons",
        "episodes",
        "releaseAt",
        "directors",
        "writers",
        "stars",
        "genres",
      ],
      properties: {
        name: {
          type: "string",
          minLength: 1,
        },
        description: {
          type: "string",
        },
        seasons: {
          type: "integer",
          minimum: 1,
        },
        episodes: {
          type: "integer",
          minimum: 1,
        },
        releaseAt: {
          type: "string",
          format: "date",
        },
        directors: {
          type: "array",
          items: {
            $ref: "#/components/schemas/CreatePerson",
          },
        },
        writers: {
          type: "array",
          items: {
            $ref: "#/components/schemas/CreatePerson",
          },
        },
        stars: {
          type: "array",
          items: {
            $ref: "#/components/schemas/CreatePerson",
          },
        },
        genres: {
          type: "array",
          items: {
            $ref: "#/components/schemas/CreateGenre",
          },
        },
      },
    },
    Genre: {
      allOf: [
        {
          $ref: "#/components/schemas/CreateGenre",
        },
        {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
            },
          },
        },
      ],
    },
    Person: {
      allOf: [
        {
          $ref: "#/components/schemas/CreatePerson",
        },
        {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
            },
          },
        },
      ],
    },
    TvShow: {
      type: "object",
      required: [
        "id",
        "name",
        "description",
        "seasons",
        "episodes",
        "releaseAt",
        "directors",
        "writers",
        "stars",
        "genres",
      ],
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        seasons: {
          type: "integer",
        },
        episodes: {
          type: "integer",
        },
        releaseAt: {
          type: "string",
          format: "date-time",
        },
        directors: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Person",
          },
        },
        writers: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Person",
          },
        },
        stars: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Person",
          },
        },
        genres: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Genre",
          },
        },
      },
    },
  },
  responses: {
    BadRequest: {
      description: "Invalid request.",
      content: apiErrorContent,
    },
    NotFound: {
      description: "Resource not found.",
      content: apiErrorContent,
    },
    UnprocessableEntity: {
      description: "Domain validation failed.",
      content: apiErrorContent,
    },
    InternalServerError: {
      description: "Unexpected or persistence error.",
      content: apiErrorContent,
    },
  },
} as const;
