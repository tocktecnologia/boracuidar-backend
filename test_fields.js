import admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function checkData() {
  const workers = await db.collection('trabalhadores').get();
  workers.forEach(doc => {
    const d = doc.data();
    if (typeof d.id !== 'number') {
      console.log(`Worker ${doc.id} has id: ${d.id} (type: ${typeof d.id})`);
    }
    if (d.business_id == '7188879e-0634-4ca7-a4ee-c688541b7d35') {
       console.log(`Worker ${doc.id} belongs to the bad business`);
    }
  });
  console.log('Workers check done.');
}

checkData();
