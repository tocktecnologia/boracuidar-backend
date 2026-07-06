import { admin } from "../config/firebase.js";

export async function requireFirebaseAuth(req, res, next) {
  const header = String(req.get("authorization") || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(header);

  if (!match) {
    return res.status(401).json({
      ok: false,
      code: "auth/missing-token",
      message: "Token Firebase ausente.",
    });
  }

  try {
    req.firebaseUser = await admin.auth().verifyIdToken(match[1]);
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      code: "auth/invalid-token",
      message: "Token Firebase invalido.",
    });
  }
}
