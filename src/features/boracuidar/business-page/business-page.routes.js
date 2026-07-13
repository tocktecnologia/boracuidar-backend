import { Router } from "express";

import { db } from "../../../config/firebase.js";
import { requireFirebaseAuth } from "../../../middleware/firebase-auth.js";

const router = Router();

const PAGE_PUBLISHED_FIELD = "page_published";
const PAGE_PENDING_FIELD = "page_pending";
const PAGE_PERMISSIONS_TABLE = "page_permissions";
const PERMISSION_TYPE_PAGE = "page";

function toHttpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function decodeValue(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(decodeValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, decodeValue(item)]),
    );
  }
  return value;
}

function decodeDoc(snapshot, idField = "id") {
  const data = decodeValue(snapshot.data() ?? {});
  if (idField && (data[idField] == null || data[idField] === "")) {
    data[idField] = snapshot.id;
  }
  return data;
}

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "sim";
}

function firstText(values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return null;
}

function parseDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function compareDatesDesc(left, right) {
  const leftDate = parseDateTime(left);
  const rightDate = parseDateTime(right);
  if (!leftDate && !rightDate) return 0;
  if (!leftDate) return 1;
  if (!rightDate) return -1;
  return rightDate.getTime() - leftDate.getTime();
}

function normalizeBusinessPageMap({ businessId, rawPage }) {
  if (!rawPage || typeof rawPage !== "object" || Array.isArray(rawPage)) {
    return null;
  }
  const normalized = { ...rawPage };
  normalized.business_id = firstText([normalized.business_id, businessId]);
  normalized.id = firstText([normalized.id, businessId]);
  return normalized;
}

function permissionRequestType(request) {
  const raw = String(request?.request_type ?? "").trim().toLowerCase();
  return raw || PERMISSION_TYPE_PAGE;
}

function isPagePermissionRequest(request) {
  return permissionRequestType(request) === PERMISSION_TYPE_PAGE;
}

function isAnonymousEvaluation(evaluation) {
  if (
    toBool(evaluation?.is_anonymous) ||
    toBool(evaluation?.anonymous) ||
    toBool(evaluation?.anonimo) ||
    toBool(evaluation?.isAnonymous)
  ) {
    return true;
  }

  const name = firstText([evaluation?.name]);
  const email = firstText([evaluation?.email]);
  if (!name && !email) return true;

  const normalizedName = String(name ?? "").trim().toLowerCase();
  return Boolean(
    name &&
      !email &&
      (normalizedName.includes("anonymous") ||
        normalizedName.includes("anonim")),
  );
}

function publicEvaluations(rows) {
  return rows
    .filter((row) => !isAnonymousEvaluation(row))
    .sort((left, right) => compareDatesDesc(left.created_at, right.created_at));
}

async function readBusinessById(businessId) {
  const snapshot = await db.collection("business").doc(businessId).get();
  return snapshot.exists ? decodeDoc(snapshot, "id") : null;
}

async function readUserByUid(uid) {
  const docSnapshot = await db.collection("users").doc(uid).get();
  if (docSnapshot.exists) return decodeDoc(docSnapshot, "uid");

  const uidSnapshot = await db
    .collection("users")
    .where("uid", "==", uid)
    .limit(1)
    .get();
  if (!uidSnapshot.empty) return decodeDoc(uidSnapshot.docs[0], "uid");

  return null;
}

async function requesterAccess(firebaseUser, businessId) {
  const user = await readUserByUid(firebaseUser.uid);
  const isRoot = toBool(user?.root);
  const isBusinessOwner = String(user?.business_id ?? "").trim() === businessId;
  return { user, isRoot, isBusinessOwner, canEditPage: isRoot || isBusinessOwner };
}

function selectPage({ businessId, business, preferPending }) {
  const publishedPage = normalizeBusinessPageMap({
    businessId,
    rawPage: business?.[PAGE_PUBLISHED_FIELD] ?? business?.page,
  });
  const pendingPage = normalizeBusinessPageMap({
    businessId,
    rawPage: business?.[PAGE_PENDING_FIELD],
  });
  const page = (preferPending ? pendingPage : null) ?? publishedPage;
  return { page, publishedPage, pendingPage };
}

async function readPendingReview(businessId) {
  const directSnapshot = await db
    .collection(PAGE_PERMISSIONS_TABLE)
    .doc(businessId)
    .get();
  if (directSnapshot.exists) {
    const request = decodeDoc(directSnapshot, "id");
    if (toBool(request.pending) && isPagePermissionRequest(request)) {
      return request;
    }
  }

  const snapshot = await db
    .collection(PAGE_PERMISSIONS_TABLE)
    .where("business_id", "==", businessId)
    .where("pending", "==", true)
    .get();

  const requests = snapshot.docs
    .map((doc) => decodeDoc(doc, "id"))
    .filter(isPagePermissionRequest)
    .sort((left, right) =>
      compareDatesDesc(left.requested_at, right.requested_at),
    );
  return requests[0] ?? null;
}

async function readActiveRows(table, businessId) {
  const snapshot = await db
    .collection(table)
    .where("business_id", "==", businessId)
    .get();
  return snapshot.docs
    .map((doc) => decodeDoc(doc, "id"))
    .filter((row) => row.ativo !== false);
}

function normalizedEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function attachWorkersProfilePhoto(workers, business) {
  if (workers.length === 0) return workers;

  const emails = [
    ...new Set(
      workers.map((worker) => normalizedEmail(worker.email)).filter(Boolean),
    ),
  ];
  if (emails.length === 0) return workers;

  const photoByEmail = new Map();
  function absorbUsers(users) {
    for (const user of users) {
      const photo = firstText([
        user.photo_url,
        user.photoUrl,
        user.foto_url,
        user.avatar_url,
      ]);
      if (!photo || !photo.startsWith("http")) continue;
      const email = normalizedEmail(user.email);
      if (email && !photoByEmail.has(email)) {
        photoByEmail.set(email, photo);
      }
    }
  }

  for (let index = 0; index < emails.length; index += 10) {
    const chunk = emails.slice(index, index + 10);
    const snapshot = await db
      .collection("users")
      .where("email", "in", chunk)
      .get();
    absorbUsers(snapshot.docs.map((doc) => decodeDoc(doc, "uid")));
  }

  if (photoByEmail.size < emails.length) {
    const usersByBusiness = await db
      .collection("users")
      .where("business_id", "==", String(business?.id ?? ""))
      .get();
    absorbUsers(usersByBusiness.docs.map((doc) => decodeDoc(doc, "uid")));
  }

  return workers.map((worker) => {
    const photo = photoByEmail.get(normalizedEmail(worker.email));
    if (!photo) return worker;
    return {
      ...worker,
      photo_url: photo,
      photoUrl: photo,
      foto_url: photo,
    };
  });
}

async function readEvaluations(businessId) {
  const snapshot = await db
    .collection("Evaluations")
    .where("business_id", "==", businessId)
    .get();
  return publicEvaluations(snapshot.docs.map((doc) => decodeDoc(doc, "id")));
}

async function businessPagePayload({ businessId, firebaseUser }) {
  const business = await readBusinessById(businessId);
  if (!business) {
    throw toHttpError(404, "business-page/not-found", "Estabelecimento nao encontrado.");
  }

  const access = await requesterAccess(firebaseUser, businessId);
  const { page, publishedPage, pendingPage } = selectPage({
    businessId,
    business,
    preferPending: access.canEditPage,
  });

  const allowPage = toBool(page?.allow_page) || toBool(business.allow_page);
  if (!allowPage && !access.canEditPage) {
    throw toHttpError(
      403,
      "business-page/not-approved",
      "Esta pagina ainda nao esta disponivel no marketplace.",
    );
  }

  const [services, rawWorkers, evaluations, pendingReview] = await Promise.all([
    readActiveRows("servicos", businessId),
    readActiveRows("trabalhadores", businessId),
    readEvaluations(businessId),
    readPendingReview(businessId),
  ]);
  const workers = await attachWorkersProfilePhoto(rawWorkers, business);

  return {
    business,
    page,
    publishedPage,
    pendingPage,
    pendingReview,
    services,
    workers,
    evaluations,
    canEditPage: access.canEditPage,
    isBusinessOwner: access.isBusinessOwner,
    hasPersistedPage: Boolean(page),
  };
}

function sanitizeBusinessUpdates(rawUpdates) {
  const raw = rawUpdates && typeof rawUpdates === "object" ? rawUpdates : {};
  const allowed = ["nome", "endereco", "cnpj", "logo_url"];
  const updates = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      updates[field] = raw[field];
    }
  }
  return updates;
}

function normalizePageData({ businessId, rawPage }) {
  const page =
    rawPage && typeof rawPage === "object" && !Array.isArray(rawPage)
      ? { ...rawPage }
      : {};
  const now = new Date();
  page.business_id = businessId;
  page.id = page.id ?? businessId;
  page.allow_page = false;
  page.updated_at = now;
  page.pending_updated_at = now;
  delete page.instagram;
  delete page.facebook;
  return page;
}

function normalizeChanges(rawChanges) {
  const changes = Array.isArray(rawChanges) ? rawChanges : [];
  const normalized = [
    ...new Set(
      changes.map((item) => String(item ?? "").trim()).filter(Boolean),
    ),
  ];
  if (normalized.length === 0) {
    normalized.push("Atualizacao geral da pagina");
  }
  return normalized;
}

async function saveBusinessPage({ firebaseUser, body }) {
  const businessId = String(body?.businessId ?? "").trim();
  if (!businessId) {
    throw toHttpError(400, "business-page/missing-business-id", "businessId ausente.");
  }

  const businessRef = db.collection("business").doc(businessId);
  const businessSnapshot = await businessRef.get();
  if (!businessSnapshot.exists) {
    throw toHttpError(404, "business-page/not-found", "Estabelecimento nao encontrado.");
  }

  const business = decodeDoc(businessSnapshot, "id");
  const access = await requesterAccess(firebaseUser, businessId);
  if (!access.canEditPage) {
    throw toHttpError(403, "business-page/forbidden", "Sem permissao para editar esta pagina.");
  }

  const now = new Date();
  const businessUpdates = sanitizeBusinessUpdates(body?.businessUpdates);
  if (Object.keys(businessUpdates).length > 0) {
    await businessRef.set(
      { ...businessUpdates, updated_at: now },
      { merge: true },
    );
  }

  const pendingPage = normalizePageData({
    businessId,
    rawPage: body?.pageData,
  });
  await businessRef.set(
    {
      [PAGE_PENDING_FIELD]: pendingPage,
      allow_page: false,
      updated_at: now,
    },
    { merge: true },
  );

  const publishedPage = normalizeBusinessPageMap({
    businessId,
    rawPage: business[PAGE_PUBLISHED_FIELD] ?? business.page,
  });
  const hasPublishedPage =
    publishedPage != null &&
    (toBool(business.allow_page) || toBool(publishedPage.allow_page));

  const userName = firstText([
    body?.userName,
    access.user?.display_name,
    access.user?.displayName,
    firebaseUser.name,
    firebaseUser.email,
  ]) ?? "Usuario";
  const userEmail = firstText([
    body?.userEmail,
    access.user?.email,
    firebaseUser.email,
  ]) ?? "";
  const businessName = firstText([body?.businessName, businessUpdates.nome, business.nome]);

  await db.collection(PAGE_PERMISSIONS_TABLE).doc(businessId).set(
    {
      request_type: PERMISSION_TYPE_PAGE,
      business_id: businessId,
      ...(businessName ? { business_name: businessName } : {}),
      user_uid: firebaseUser.uid,
      user_name: userName,
      user_email: userEmail,
      changes: normalizeChanges(body?.changes),
      pending: true,
      status: "pending",
      requested_at: now,
      updated_at: now,
      allow_page: hasPublishedPage,
      has_published_page: hasPublishedPage,
    },
    { merge: true },
  );

  return businessPagePayload({ businessId, firebaseUser });
}

async function handleJson(req, res, handler) {
  try {
    const payload = await handler();
    return res.json({ ok: true, ...payload });
  } catch (error) {
    return res.status(error?.status || 500).json({
      ok: false,
      code: error?.code || "business-page/internal",
      message: error?.message || "Erro interno na pagina do estabelecimento.",
    });
  }
}

router.use(requireFirebaseAuth);

router.get("/preview", (req, res) =>
  handleJson(req, res, async () => {
    const businessId = String(req.query?.businessId ?? "").trim();
    if (!businessId) {
      throw toHttpError(400, "business-page/missing-business-id", "businessId ausente.");
    }
    return businessPagePayload({ businessId, firebaseUser: req.firebaseUser });
  }),
);

router.post("/save", (req, res) =>
  handleJson(req, res, async () =>
    saveBusinessPage({ firebaseUser: req.firebaseUser, body: req.body }),
  ),
);

export default router;
