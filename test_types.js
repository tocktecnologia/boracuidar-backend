import admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function checkTypes() {
  const workers = await db.collection('trabalhadores').limit(5).get();
  workers.forEach(doc => {
    console.log(`Worker ${doc.id} id type: ${typeof doc.data().id}`);
  });
  
  const servs = await db.collection('servicos').limit(5).get();
  servs.forEach(doc => {
    console.log(`Service ${doc.id} id type: ${typeof doc.data().id}`);
  });

  const agendamentos = await db.collection('agendamentos').limit(5).get();
  agendamentos.forEach(doc => {
    const d = doc.data();
    console.log(`Appt ${doc.id} trabalhador_id type: ${typeof d.trabalhador_id}, servico_id type: ${typeof d.servico_id}, id type: ${typeof d.id}`);
  });
}

checkTypes();
