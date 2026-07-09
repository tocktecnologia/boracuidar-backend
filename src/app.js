import cors from "cors";
import express from "express";

import boracuidarFirestoreRoutes from "./features/boracuidar/firestore/firestore.routes.js";
import boracuidarOnboardingRoutes from "./features/boracuidar/onboarding/onboarding.routes.js";
import bookingRoutes from "./features/boracuidar-web/bookings/booking.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "512kb" }));

  // Middleware para logar todas as requisições no terminal
  app.use((req, res, next) => {
    console.log(`[Backend Log] ${req.method} ${req.url}`);
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/bookings", bookingRoutes);
  app.use("/api/boracuidar-web/bookings", bookingRoutes);
  app.use("/api/boracuidar/firestore", boracuidarFirestoreRoutes);
  app.use("/api/boracuidar/onboarding", boracuidarOnboardingRoutes);

  return app;
}
