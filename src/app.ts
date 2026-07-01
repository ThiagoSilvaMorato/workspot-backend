import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { ZodTypeProvider, jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import prismaPlugin from "./infra/database/prisma.js";
import jwtPlugin from "./shared/plugins/jwt.plugin.js";
import emailPlugin from "./shared/plugins/email.plugin.js";
import errorHandlerPlugin from "./shared/plugins/error-handler.plugin.js";
import { authRoutes } from "./modules/auth/routes/auth.routes.js";
import { usersRoutes } from "./modules/users/routes/users.routes.js";
import { tagsRoutes } from "./modules/tags/routes/tags.routes.js";
import { workSpotsRoutes } from "./modules/workspots/routes/workspots.routes.js";
import { ratingsRoutes } from "./modules/ratings/routes/ratings.routes.js";
import { reviewsRoutes } from "./modules/reviews/routes/reviews.routes.js";

export function buildApp() {
  const app = fastify({
    logger: {
      level: "info",
      redact: ["req.headers.authorization", "body.password", "body.passwordHash"],
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // OpenAPI documentation (must be registered before routes)
  app.register(swagger, {
    openapi: {
      info: {
        title: "WorkSpot API",
        description: "API para descoberta de espaços de trabalho remoto",
        version: "1.0.0",
      },
      servers: [{ url: "/api/v1" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token JWT obtido via POST /auth/login",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  // Infrastructure plugins (fp — shared across all scopes)
  app.register(prismaPlugin);
  app.register(jwtPlugin);
  app.register(emailPlugin);
  app.register(errorHandlerPlugin);

  // Framework plugins — CSP disabled to allow Swagger UI inline scripts
  app.register(helmet, { contentSecurityPolicy: false });
  app.register(cors);

  app.register(
    async (api) => {
      api.register(authRoutes, { prefix: "/auth" });
      api.register(usersRoutes, { prefix: "/users" });
      api.register(tagsRoutes, { prefix: "/tags" });
      api.register(workSpotsRoutes, { prefix: "/workspots" });

      // Nested routes: /workspots/:workspotId/ratings and /workspots/:workspotId/reviews
      api.register(ratingsRoutes, { prefix: "/workspots/:workspotId/ratings" });
      api.register(reviewsRoutes, { prefix: "/workspots/:workspotId/reviews" });
    },
    { prefix: "/api/v1" },
  );

  return app;
}
