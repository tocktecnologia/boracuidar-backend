import { db } from "../../../config/firebase.js";
import { getDefaultServicesByBusinessType } from "./defaultServices.js";
import crypto from "crypto";

let lastGeneratedIntId = 0;

function generateIntId() {
  const candidate = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  if (candidate <= lastGeneratedIntId) {
    lastGeneratedIntId += 1;
    return lastGeneratedIntId;
  }
  lastGeneratedIntId = candidate;
  return candidate;
}

export async function finalizeOnboarding({
  firebaseUser,
  forcedBusinessId,
  entityName,
  email,
  whatsapp,
  subscription,
  businessType,
  ownerName,
}) {
  const userUid = firebaseUser.uid;
  const userEmail = firebaseUser.email || email;
  const normalizedWorkerEmail = String(userEmail || email || "").trim().toLowerCase();
  const normalizedWorkerPhone = String(whatsapp || "").replace(/\D/g, "");

  // 1. Determine Business ID
  const businessId = forcedBusinessId || crypto.randomUUID();

  // Create a batch
  const batch = db.batch();
  const now = new Date();

  // 1. Insert into 'business' collection
  const businessRef = db.collection("business").doc(businessId);
  const existingBusinessSnapshot = await businessRef.get();
  const existingBusinessData = existingBusinessSnapshot.exists
    ? existingBusinessSnapshot.data() ?? {}
    : {};
  const businessIsActive = existingBusinessData.ativo === false ? false : true;

  batch.set(
    businessRef,
    {
      id: businessId,
      entity_name: entityName || null,
      email: email || null,
      phone_number: whatsapp || null,
      subscription_type: subscription || "GRATUITO",
      ativo: businessIsActive,
      created_at: now,
      updated_at: now,
    },
    { merge: true }
  );

  // 2. Upsert business page permissions (page_published)
  const businessPageData = {
    entity_name: entityName || null,
    business_id: businessId,
    created_at: now,
    updated_at: now,
  };
  batch.set(
    businessRef,
    { page_published: businessPageData },
    { merge: true }
  );

  // 3. Update/Insert user document
  const userRef = db.collection("users").doc(userUid);
  batch.set(
    userRef,
    {
      uid: userUid,
      email: userEmail,
      display_name: ownerName || null,
      phone_number: whatsapp || null,
      business_id: businessId,
      created_time: now,
      business_type: businessType || null,
      role: "Master",
    },
    { merge: true }
  );

  // 4. Create default services
  const defaultServices = getDefaultServicesByBusinessType(
    businessType,
    businessId
  );
  
  const serviceIds = [];
  for (const service of defaultServices) {
    const serviceId = generateIntId();
    const serviceRef = db.collection("servicos").doc(String(serviceId));
    batch.set(serviceRef, {
      ...service,
      id: serviceId,
      created_at: now,
    });
    serviceIds.push(serviceId);
  }

  // 5. Create Worker Master
  const workerId = generateIntId();
  const workerRef = db.collection("trabalhadores").doc(String(workerId));
  const workerData = {
    id: workerId,
    user_uid: userUid,
    business_id: businessId,
    nome: ownerName || null,
    email: normalizedWorkerEmail || null,
    telefone: normalizedWorkerPhone || null,
    position: "Master",
    ativo: true,
    created_at: now,
  };
  batch.set(workerRef, workerData);

  // Default worker schedules
  for (let i = 0; i <= 6; i++) {
    const scheduleId = generateIntId();
    const scheduleRef = db.collection("horarios_padrao").doc(String(scheduleId));
    batch.set(scheduleRef, {
      id: scheduleId,
      business_id: businessId,
      trabalhador_id: workerId,
      dia_semana: i,
      hora_inicio: "08:00:00",
      hora_fim: "19:00:00",
      intervalo_inicio: "12:00:00",
      intervalo_fim: "13:00:00",
      ativo: true,
      created_at: now,
    });
  }

  // Link worker to services
  for (const serviceId of serviceIds) {
    const workerServiceId = generateIntId();
    const workerServiceRef = db.collection("trabalhador_servico").doc(String(workerServiceId));
    batch.set(workerServiceRef, {
      id: workerServiceId,
      trabalhador_id: workerId,
      servico_id: serviceId,
      ativo: true,
      business_id: businessId,
      created_at: now,
    });
  }

  // Commit everything transactionally
  await batch.commit();

  return { success: true, businessId, workerId };
}

export async function saveProgress({ firebaseUser, step, data }) {
  const userUid = firebaseUser.uid;
  const now = new Date();
  
  const userRef = db.collection("users").doc(userUid);
  await userRef.set(
    {
      onboarding_progress: {
        step,
        data,
        updated_at: now,
      }
    },
    { merge: true }
  );

  return { success: true };
}

export async function getProgress({ firebaseUser }) {
  const userUid = firebaseUser.uid;
  
  const userDoc = await db.collection("users").doc(userUid).get();
  if (!userDoc.exists) {
    return { step: 1, data: {} };
  }
  
  const userData = userDoc.data();
  if (userData.onboarding_progress) {
    return userData.onboarding_progress;
  }
  
  return { step: 1, data: {} };
}
