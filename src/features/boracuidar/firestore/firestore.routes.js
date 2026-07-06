import { Router } from "express";

import { db } from "../../../config/firebase.js";
import { requireFirebaseAuth } from "../../../middleware/firebase-auth.js";

const router = Router();

const NUMERIC_ID_TABLES = new Set([
  "agendamentos",
  "horarios_excecoes",
  "horarios_padrao",
  "notifications",
  "servicos",
  "trabalhador_servico",
  "trabalhadores",
]);

const STRING_PRIMARY_KEY_BY_TABLE = new Map([
  ["business", "id"],
  ["business_type", "type"],
  ["subscriptions", "name"],
]);

const ALLOWED_TABLES = new Set([
  "agendamento_slot_locks",
  "agendamentos",
  "business",
  "business_type",
  "business_pages",
  "horarios_excecoes",
  "horarios_padrao",
  "notifications",
  "page_permissions",
  "payment",
  "schedule",
  "servicos",
  "shift",
  "subscriptions",
  "trabalhador_servico",
  "trabalhadores",
  "users",
]);

const ALLOWED_COLLECTION_GROUPS = new Set(["evaluations"]);
const BOOKING_SLOT_LOCKS_TABLE = "agendamento_slot_locks";
const BOOKING_LOCK_STEP_MINUTES = 5;

function toHttpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizeTable(rawTable) {
  const table = String(rawTable ?? "").trim();
  if (!ALLOWED_TABLES.has(table)) {
    throw toHttpError(400, "firestore/table-not-allowed", "Colecao nao permitida.");
  }
  return table;
}

function normalizeCollectionGroup(rawCollectionGroup) {
  const collectionGroup = String(rawCollectionGroup ?? "").trim();
  if (!ALLOWED_COLLECTION_GROUPS.has(collectionGroup)) {
    throw toHttpError(400, "firestore/collection-group-not-allowed", "Collection group nao permitido.");
  }
  return collectionGroup;
}

function normalizeConditions(rawConditions) {
  if (!Array.isArray(rawConditions)) return [];
  return rawConditions
    .map((condition) => ({
      field: String(condition?.field ?? "").trim(),
      operator: String(condition?.operator ?? "").trim(),
      value: condition?.value,
    }))
    .filter((condition) => condition.field && condition.operator);
}

function normalizeOrders(rawOrders) {
  if (!Array.isArray(rawOrders)) return [];
  return rawOrders
    .map((order) => ({
      field: String(order?.field ?? "").trim(),
      ascending: order?.ascending !== false,
    }))
    .filter((order) => order.field);
}

function applyCondition(query, condition) {
  switch (condition.operator) {
    case "eq":
      return query.where(condition.field, "==", condition.value);
    case "neq":
      return query.where(condition.field, "!=", condition.value);
    case "lt":
      return query.where(condition.field, "<", condition.value);
    case "lte":
      return query.where(condition.field, "<=", condition.value);
    case "gt":
      return query.where(condition.field, ">", condition.value);
    case "gte":
      return query.where(condition.field, ">=", condition.value);
    case "inFilter": {
      const values = Array.isArray(condition.value) ? condition.value : [];
      if (values.length === 0) return null;
      return query.where(condition.field, "in", values.slice(0, 10));
    }
    case "contains":
      return query.where(condition.field, "array-contains", condition.value);
    case "overlaps": {
      const values = Array.isArray(condition.value) ? condition.value : [];
      if (values.length === 0) return null;
      return query.where(condition.field, "array-contains-any", values.slice(0, 10));
    }
    default:
      throw toHttpError(400, "firestore/operator-not-supported", `Operador nao suportado: ${condition.operator}`);
  }
}

function buildQuery(ref, { conditions = [], orders = [], limit = null }) {
  let query = ref;
  for (const condition of conditions) {
    const nextQuery = applyCondition(query, condition);
    if (nextQuery == null) return null;
    query = nextQuery;
  }

  for (const order of orders) {
    query = query.orderBy(order.field, order.ascending === false ? "desc" : "asc");
  }

  const normalizedLimit = Number(limit);
  if (Number.isInteger(normalizedLimit) && normalizedLimit >= 0) {
    query = query.limit(normalizedLimit);
  }

  return query;
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
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeValue(item)]));
  }
  return value;
}

function decodeDoc(table, snapshot) {
  const data = decodeValue(snapshot.data() ?? {});
  if (NUMERIC_ID_TABLES.has(table) && data.id == null) {
    const parsed = Number(snapshot.id);
    if (Number.isInteger(parsed)) data.id = parsed;
  }

  const stringPkField = STRING_PRIMARY_KEY_BY_TABLE.get(table);
  if (stringPkField && (data[stringPkField] == null || data[stringPkField] === "")) {
    data[stringPkField] = snapshot.id;
  }
  return data;
}

function normalizeComparable(value) {
  if (value && typeof value.toDate === "function") return value.toDate();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value : new Date(parsed);
  }
  return value;
}

function compareValues(left, right) {
  const a = normalizeComparable(left);
  const b = normalizeComparable(right);
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
  return String(a).localeCompare(String(b));
}

function matchesCondition(row, condition) {
  const left = row[condition.field];
  const right = condition.value;

  switch (condition.operator) {
    case "eq":
      return compareValues(left, right) === 0;
    case "neq":
      return compareValues(left, right) !== 0;
    case "lt":
      return compareValues(left, right) < 0;
    case "lte":
      return compareValues(left, right) <= 0;
    case "gt":
      return compareValues(left, right) > 0;
    case "gte":
      return compareValues(left, right) >= 0;
    case "inFilter":
      return (Array.isArray(right) ? right : []).some((item) => compareValues(item, left) === 0);
    case "contains":
      return Array.isArray(left) && left.some((item) => compareValues(item, right) === 0);
    case "overlaps": {
      if (!Array.isArray(left)) return false;
      const leftValues = new Set(left.map((item) => String(normalizeComparable(item))));
      return (Array.isArray(right) ? right : []).some((item) => leftValues.has(String(normalizeComparable(item))));
    }
    default:
      return false;
  }
}

function filterAndSortRows(rows, { conditions = [], orders = [], limit = null }) {
  let result = rows.filter((row) => conditions.every((condition) => matchesCondition(row, condition)));

  if (orders.length > 0) {
    result = [...result].sort((left, right) => {
      for (const order of orders) {
        const comparison = compareValues(left[order.field], right[order.field]);
        if (comparison !== 0) return order.ascending === false ? -comparison : comparison;
      }
      return 0;
    });
  }

  const normalizedLimit = Number(limit);
  if (Number.isInteger(normalizedLimit) && normalizedLimit >= 0) {
    result = result.slice(0, normalizedLimit);
  }
  return result;
}

function filterAndSortDocRows(docRows, { conditions = [], orders = [], limit = null }) {
  let result = docRows.filter((row) => conditions.every((condition) => matchesCondition(row.data, condition)));

  if (orders.length > 0) {
    result = [...result].sort((left, right) => {
      for (const order of orders) {
        const comparison = compareValues(left.data[order.field], right.data[order.field]);
        if (comparison !== 0) return order.ascending === false ? -comparison : comparison;
      }
      return 0;
    });
  }

  const normalizedLimit = Number(limit);
  if (Number.isInteger(normalizedLimit) && normalizedLimit >= 0) {
    result = result.slice(0, normalizedLimit);
  }
  return result;
}

async function queryDocRows({ table, conditions, orders, limit }) {
  const query = buildQuery(db.collection(table), { conditions, orders, limit });
  if (query == null) return [];

  try {
    const snapshot = await query.get();
    const docRows = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: decodeDoc(table, doc),
    }));
    return filterAndSortDocRows(docRows, { conditions, orders, limit });
  } catch (_error) {
    const snapshot = await db.collection(table).get();
    const docRows = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: decodeDoc(table, doc),
    }));
    return filterAndSortDocRows(docRows, { conditions, orders, limit });
  }
}

async function queryRows({ table, conditions, orders, limit }) {
  const docRows = await queryDocRows({ table, conditions, orders, limit });
  return docRows.map((row) => row.data);
}

async function queryCollectionGroupRows({ collectionGroup, conditions, orders, limit }) {
  const query = buildQuery(db.collectionGroup(collectionGroup), { conditions, orders, limit });
  if (query == null) return [];

  try {
    const snapshot = await query.get();
    return filterAndSortRows(snapshot.docs.map((doc) => decodeCollectionGroupDoc(doc)), { conditions, orders, limit });
  } catch (_error) {
    const snapshot = await db.collectionGroup(collectionGroup).get();
    const rows = snapshot.docs.map((doc) => decodeCollectionGroupDoc(doc));
    return filterAndSortRows(rows, { conditions, orders, limit });
  }
}

function decodeCollectionGroupDoc(snapshot) {
  const data = decodeValue(snapshot.data() ?? {});
  data.id = snapshot.id;
  const parentId = snapshot.ref.parent.parent?.id;
  if (parentId) data.business_id = parentId;
  return data;
}

function generateIntId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function prepareInsertData(table, data) {
  const now = new Date();
  const row = { ...data };

  if (NUMERIC_ID_TABLES.has(table) && row.id == null) {
    row.id = generateIntId();
  }

  const stringPkField = STRING_PRIMARY_KEY_BY_TABLE.get(table);
  if (stringPkField && (row[stringPkField] == null || String(row[stringPkField]).trim() === "")) {
    row[stringPkField] = table === "business" ? db.collection(table).doc().id : db.collection(table).doc().id;
  }

  switch (table) {
    case "agendamentos":
      row.status ??= "agendado";
      row.lembrete_count ??= -1;
      row.created_at ??= now;
      row.cliente_endereco ??= "";
      break;
    case "business":
      row.ativo ??= true;
      row.created_at ??= now;
      row.updated_at ??= now;
      row.whatsapp_bot ??= "5585996121437";
      row.subscription ??= "free";
      row.business_type ??= "BARBEARIA";
      row.vaucher ??= "000000";
      row.domicile ??= false;
      row.desconto ??= 0.0;
      row.status_payment ??= true;
      row.average_stars ??= 0.0;
      row.reviews_count ??= 0;
      row.pre_reminder_count ??= 0;
      break;
    case "horarios_padrao":
    case "servicos":
    case "trabalhadores":
      row.ativo ??= true;
      row.created_at ??= now;
      break;
    case "notifications":
      row.read ??= false;
      row.type ??= "geral";
      row.trabalhador_nome ??= "";
      row.created_at ??= now;
      break;
    default:
      row.created_at ??= row.created_at;
      break;
  }

  return row;
}

function prepareUpdateData(table, data) {
  const row = { ...data };
  if (table === "business") row.updated_at = new Date();
  delete row.created_at;
  return row;
}

function docIdForRow(table, row) {
  if (NUMERIC_ID_TABLES.has(table)) return String(row.id);
  const stringPkField = STRING_PRIMARY_KEY_BY_TABLE.get(table);
  if (stringPkField) return String(row[stringPkField]);
  if (row.id != null) return String(row.id);
  return db.collection(table).doc().id;
}

function parseDateKey(rawDate) {
  const text = String(rawDate ?? "").trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(text);
  return match ? match[1] : text;
}

function minuteOfDay(rawTime) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(rawTime ?? "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return hour * 60 + minute;
}

function sanitizeLockKeyPart(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function slotLockIdsForRange({ businessId, workerId, dateKey, startTime, endTime }) {
  const startMinute = minuteOfDay(startTime);
  const endMinute = minuteOfDay(endTime);
  if (startMinute == null || endMinute == null || endMinute <= startMinute) return [];

  const ids = [];
  const normalizedDate = String(dateKey ?? "").replace(/-/g, "");
  for (let cursor = startMinute; cursor < endMinute; cursor += BOOKING_LOCK_STEP_MINUTES) {
    ids.push(`${sanitizeLockKeyPart(businessId)}__${sanitizeLockKeyPart(workerId)}__${normalizedDate}__${String(cursor).padStart(4, "0")}`);
  }
  return ids;
}

function lockIdsForScheduleRow(row) {
  if (Array.isArray(row?.lock_ids) && row.lock_ids.length > 0) {
    return row.lock_ids.map((item) => String(item)).filter(Boolean);
  }
  return slotLockIdsForRange({
    businessId: row?.business_id,
    workerId: row?.trabalhador_id,
    dateKey: parseDateKey(row?.data_agendamento),
    startTime: row?.hora_inicio ?? row?.start_time,
    endTime: row?.hora_fim ?? row?.end_time,
  });
}

function isCancelledStatus(status) {
  const text = String(status ?? "").trim().toLowerCase();
  return text === "cancelado" || text === "canceled" || text === "cancelled";
}

async function releaseScheduleLocksForRows(rows) {
  const lockIds = new Set();
  for (const row of rows) {
    for (const lockId of lockIdsForScheduleRow(row)) lockIds.add(lockId);
  }
  const ids = [...lockIds];
  for (let index = 0; index < ids.length; index += 450) {
    const batch = db.batch();
    for (const lockId of ids.slice(index, index + 450)) {
      batch.delete(db.collection(BOOKING_SLOT_LOCKS_TABLE).doc(lockId));
    }
    await batch.commit();
  }
}

async function handleJson(req, res, handler) {
  try {
    const payload = await handler();
    return res.json({ ok: true, ...payload });
  } catch (error) {
    return res.status(error?.status || 500).json({
      ok: false,
      code: error?.code || "firestore/internal",
      message: error?.message || "Erro interno no acesso ao Firestore.",
    });
  }
}

router.use(requireFirebaseAuth);

router.post("/query", (req, res) =>
  handleJson(req, res, async () => {
    const table = normalizeTable(req.body?.table);
    const conditions = normalizeConditions(req.body?.conditions);
    const orders = normalizeOrders(req.body?.orders);
    const rows = await queryRows({ table, conditions, orders, limit: req.body?.limit });
    return { rows };
  }),
);

router.post("/collection-group-query", (req, res) =>
  handleJson(req, res, async () => {
    const collectionGroup = normalizeCollectionGroup(req.body?.collectionGroup);
    const conditions = normalizeConditions(req.body?.conditions);
    const orders = normalizeOrders(req.body?.orders);
    const rows = await queryCollectionGroupRows({ collectionGroup, conditions, orders, limit: req.body?.limit });
    return { rows };
  }),
);

router.post("/insert", (req, res) =>
  handleJson(req, res, async () => {
    const table = normalizeTable(req.body?.table);
    const row = prepareInsertData(table, req.body?.data ?? {});
    const requestedDocId = String(req.body?.docId ?? "").trim();
    const ref = db.collection(table).doc(requestedDocId || docIdForRow(table, row));
    await ref.set(row);
    const snapshot = await ref.get();
    return { row: decodeDoc(table, snapshot) };
  }),
);

router.patch("/update", (req, res) =>
  handleJson(req, res, async () => {
    const table = normalizeTable(req.body?.table);
    const conditions = normalizeConditions(req.body?.conditions);
    const targets = await queryDocRows({ table, conditions, orders: [], limit: null });
    const updateData = prepareUpdateData(table, req.body?.data ?? {});

    if (targets.length > 0) {
      const batch = db.batch();
      for (const target of targets) {
        batch.update(target.ref, updateData);
      }
      await batch.commit();
    }

    if (table === "agendamentos" && isCancelledStatus(updateData.status)) {
      await releaseScheduleLocksForRows(targets.map((target) => target.data));
    }

    if (req.body?.returnRows !== true) return { rows: [] };
    const rows = targets.length === 0
      ? []
      : await queryRows({ table, conditions, orders: [], limit: null });
    return { rows };
  }),
);

router.delete("/delete", (req, res) =>
  handleJson(req, res, async () => {
    const table = normalizeTable(req.body?.table);
    const conditions = normalizeConditions(req.body?.conditions);
    const targets = await queryDocRows({ table, conditions, orders: [], limit: null });

    if (targets.length > 0) {
      const batch = db.batch();
      for (const target of targets) {
        batch.delete(target.ref);
      }
      await batch.commit();
    }

    return { rows: req.body?.returnRows === true ? targets.map((target) => target.data) : [] };
  }),
);

router.post("/upsert", (req, res) =>
  handleJson(req, res, async () => {
    const table = normalizeTable(req.body?.table);
    const data = req.body?.data ?? {};
    const conflictFields = Array.isArray(req.body?.conflictFields) ? req.body.conflictFields : [];

    if (conflictFields.length > 0) {
      const conditions = conflictFields
        .filter((field) => Object.prototype.hasOwnProperty.call(data, field))
        .map((field) => ({ field, operator: "eq", value: data[field] }));
      const existing = await queryRows({ table, conditions, orders: [], limit: 1 });
      if (existing.length > 0) {
        const updateData = prepareUpdateData(table, data);
        await db.collection(table).doc(docIdForRow(table, existing[0])).set(updateData, { merge: true });
        const snapshot = await db.collection(table).doc(docIdForRow(table, existing[0])).get();
        return { row: decodeDoc(table, snapshot) };
      }
    }

    const row = prepareInsertData(table, data);
    const ref = db.collection(table).doc(docIdForRow(table, row));
    await ref.set(row, { merge: true });
    const snapshot = await ref.get();
    return { row: decodeDoc(table, snapshot) };
  }),
);

export default router;
