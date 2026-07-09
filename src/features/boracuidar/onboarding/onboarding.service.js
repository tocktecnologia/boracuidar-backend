import { db } from "../../../config/firebase.js";
import { getDefaultServicesByBusinessType } from "./defaultServices.js";
import crypto from "crypto";

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

  // 1. Determine Business ID
  const businessId = forcedBusinessId || crypto.randomUUID();

  // Create a batch
  const batch = db.batch();
  const now = new Date();

  // 1. Insert into 'business' collection
  const businessRef = db.collection("business").doc(businessId);
  batch.set(
    businessRef,
    {
      id: businessId,
      entity_name: entityName || null,
      email: email || null,
      phone_number: whatsapp || null,
      subscription_type: subscription || "GRATUITO",
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
    const serviceRef = db.collection("servicos").doc();
    service.id = serviceRef.id;
    service.created_at = now;
    batch.set(serviceRef, service);
    serviceIds.push(serviceRef.id);
  }

  // 5. Create Worker Master
  const workerRef = db.collection("trabalhadores").doc();
  const workerId = workerRef.id;
  const workerData = {
    id: workerId,
    user_uid: userUid,
    business_id: businessId,
    nome: ownerName || null,
    ativo: true,
    created_at: now,
  };
  batch.set(workerRef, workerData);

  // Default worker schedules
  const defaultSchedule = {
    seg: { check: true, start: "09:00", end: "18:00" },
    ter: { check: true, start: "09:00", end: "18:00" },
    qua: { check: true, start: "09:00", end: "18:00" },
    qui: { check: true, start: "09:00", end: "18:00" },
    sex: { check: true, start: "09:00", end: "18:00" },
    sab: { check: true, start: "09:00", end: "12:00" },
    dom: { check: false, start: "09:00", end: "18:00" },
  };

  const scheduleRef = db.collection("horarios_padrao").doc();
  batch.set(scheduleRef, {
    id: scheduleRef.id,
    business_id: businessId,
    trabalhador_id: workerId,
    horarios: defaultSchedule,
    created_at: now,
  });

  // Link worker to services
  for (const serviceId of serviceIds) {
    const workerServiceRef = db.collection("trabalhador_servico").doc();
    batch.set(workerServiceRef, {
      id: workerServiceRef.id,
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
