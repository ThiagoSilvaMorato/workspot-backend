import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import prismaPlugin from "./infra/database/prisma.js";
import jwtPlugin from "./shared/plugins/jwt.plugin.js";
import errorHandlerPlugin from "./shared/plugins/error-handler.plugin.js";
import { authRoutes } from "./modules/auth/routes/auth.routes.js";
import { usersRoutes } from "./modules/users/routes/users.routes.js";
import { tagsRoutes } from "./modules/tags/routes/tags.routes.js";
import { workSpotsRoutes } from "./modules/workspots/routes/workspots.routes.js";
import { ratingsRoutes } from "./modules/ratings/routes/ratings.routes.js";
import { reviewsRoutes } from "./modules/reviews/routes/reviews.routes.js";
import "dotenv/config";

export function buildApp() {
  const app = fastify({
    logger: {
      level: "info",
      redact: ["req.headers.authorization", "body.password", "body.passwordHash"],
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Infrastructure plugins (fp — shared across all scopes)
  app.register(prismaPlugin);
  app.register(jwtPlugin);
  app.register(errorHandlerPlugin);

  // Framework plugins
  app.register(helmet);
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
