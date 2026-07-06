import cors from "cors";
import express from "express";

import boracuidarFirestoreRoutes from "./features/boracuidar/firestore/firestore.routes.js";
import bookingRoutes from "./features/boracuidar-web/bookings/booking.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "512kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/bookings", bookingRoutes);
  app.use("/api/boracuidar-web/bookings", bookingRoutes);
  app.use("/api/boracuidar/firestore", boracuidarFirestoreRoutes);

  return app;
}
