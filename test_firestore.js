import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK.
// Since we are inside the backend directory, it might automatically pick up GOOGLE_APPLICATION_CREDENTIALS or default credentials.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkData() {
  try {
    const businessId = '1'; // Just a guess for businessId
    console.log('Checking Trabalhadores...');
    const workers = await db.collection('trabalhadores').limit(5).get();
    workers.forEach(doc => {
      console.log(`Worker Doc ID: ${doc.id}, Data ID: ${doc.data().id}, Name: ${doc.data().nome}`);
    });

    console.log('Checking Servicos...');
    const services = await db.collection('servicos').limit(5).get();
    services.forEach(doc => {
      console.log(`Service Doc ID: ${doc.id}, Data ID: ${doc.data().id}, Name: ${doc.data().nome}`);
    });

    console.log('Checking Agendamentos...');
    const appointments = await db.collection('agendamentos').limit(5).get();
    appointments.forEach(doc => {
      console.log(`Appointment Doc ID: ${doc.id}, Data ID: ${doc.data().id}`);
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

checkData();
