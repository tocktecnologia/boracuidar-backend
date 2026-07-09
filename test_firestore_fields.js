import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function checkData() {
  try {
    const apps = await db.collection('agendamentos').limit(50).get();
    apps.forEach(doc => {
      const d = doc.data();
      const missing = [];
      if (d.business_id == null) missing.push('business_id');
      if (d.trabalhador_id == null) missing.push('trabalhador_id');
      if (d.servico_id == null) missing.push('servico_id');
      if (d.cliente_nome == null) missing.push('cliente_nome');
      if (d.cliente_telefone == null) missing.push('cliente_telefone');
      if (d.data_agendamento == null) missing.push('data_agendamento');
      if (d.hora_inicio == null) missing.push('hora_inicio');
      if (d.hora_fim == null) missing.push('hora_fim');
      
      if (missing.length > 0) {
        console.log(`Appointment Doc ID: ${doc.id} missing fields: ${missing.join(', ')}`);
      }
    });
    
    console.log('Finished checking.');
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

checkData();
