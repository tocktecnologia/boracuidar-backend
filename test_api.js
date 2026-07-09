const fetch = require('node-fetch');

async function testQuery() {
  try {
    // Note: This endpoint might require auth (Bearer token).
    // Let's just see if we get a 401 Unauthorized or a 400 or 500.
    const res = await fetch('http://localhost:8080/api/boracuidar/firestore/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'agendamentos',
        conditions: [],
        orders: []
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e);
  }
}

testQuery();
