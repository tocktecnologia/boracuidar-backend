import admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function checkAll() {
  const badBusinessId = '7188879e-0634-4ca7-a4ee-c688541b7d35'; // The business that might be causing issues

  console.log('Checking all agendamentos...');
  const apps = await db.collection('agendamentos').get();
  apps.forEach(doc => {
    const d = doc.data();
    const m = [];
    if (d.business_id == null) m.push('business_id');
    if (d.trabalhador_id == null) m.push('trabalhador_id');
    if (d.servico_id == null) m.push('servico_id');
    if (d.cliente_nome == null) m.push('cliente_nome');
    if (d.cliente_telefone == null) m.push('cliente_telefone');
    if (d.data_agendamento == null) m.push('data_agendamento');
    if (d.hora_inicio == null) m.push('hora_inicio');
    if (d.hora_fim == null) m.push('hora_fim');
    if (m.length > 0) console.log(`Appt ${doc.id} missing: ${m.join(',')}`);
  });

  console.log('Checking all trabalhadores...');
  const workers = await db.collection('trabalhadores').get();
  workers.forEach(doc => {
    const d = doc.data();
    const m = [];
    if (d.id == null) m.push('id');
    if (d.business_id == null) m.push('business_id');
    if (d.nome == null) m.push('nome');
    if (d.position == null) m.push('position');
    if (m.length > 0) console.log(`Worker ${doc.id} missing: ${m.join(',')}`);
  });

  console.log('Checking all servicos...');
  const services = await db.collection('servicos').get();
  services.forEach(doc => {
    const d = doc.data();
    const m = [];
    if (d.id == null) m.push('id');
    if (d.business_id == null) m.push('business_id');
    if (d.nome == null) m.push('nome');
    if (d.preco == null) m.push('preco');
    if (d.duracao_minutos == null) m.push('duracao_minutos');
    if (m.length > 0) console.log(`Service ${doc.id} missing: ${m.join(',')}`);
  });
  
  console.log('Done checking all.');
}

checkAll();
