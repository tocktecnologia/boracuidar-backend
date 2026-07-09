const fetch = require('node-fetch');

async function testQuery() {
  try {
    const res = await fetch('http://localhost:8080/api/boracuidar/firestore/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'agendamentos',
        conditions: [],
        orders: [],
        limit: 1
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text.substring(0, 200));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testQuery();
