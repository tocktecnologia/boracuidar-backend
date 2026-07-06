# Bora Cuidar Backend

Backend Node/Express do Bora Cuidar para criacao e validacao server-side de agendamentos e acesso autenticado do app profissional.

## Stack

- Node.js 20+
- Express
- Firebase Admin SDK
- Cloud Run

## Estrutura

- `src/index.js`: bootstrap do servidor
- `src/app.js`: composicao do Express e montagem das rotas
- `src/config/`: configuracao compartilhada, incluindo Firebase Admin
- `src/features/boracuidar-web/`: rotas do site publico/marketplace
- `src/features/boracuidar/`: rotas do app profissional
- `src/middleware/`: middlewares compartilhados
- `Dockerfile`: imagem para deploy
- `docs/BOOKING_BACKEND.md`: documentacao operacional do fluxo de agendamento

## Instalacao

```bash
npm install
```

## Execucao local

O backend usa `firebase-admin` com `applicationDefault()`. Configure as credenciais do Google Cloud no ambiente local antes de iniciar.

```bash
npm run dev
```

Healthcheck:

```bash
GET /health
```

Endpoints de agendamento preservados:

```bash
GET /api/bookings/bootstrap
GET /api/bookings/availability
POST /api/bookings/create
```

Os mesmos handlers tambem estao disponiveis no namespace novo:

```bash
GET /api/boracuidar-web/bookings/bootstrap
GET /api/boracuidar-web/bookings/availability
POST /api/boracuidar-web/bookings/create
```

Endpoints autenticados do app profissional:

```bash
POST /api/boracuidar/firestore/query
POST /api/boracuidar/firestore/collection-group-query
POST /api/boracuidar/firestore/insert
POST /api/boracuidar/firestore/upsert
PATCH /api/boracuidar/firestore/update
DELETE /api/boracuidar/firestore/delete
```

Essas rotas exigem `Authorization: Bearer <firebase_id_token>`.

## Deploy no Cloud Run

```bash
gcloud run deploy boracuidar-booking-api ^
  --source . ^
  --region us-central1 ^
  --allow-unauthenticated
```

O service account do Cloud Run precisa ter permissao de leitura/escrita no Firestore.

## Seguranca

Nao commite `.env`, chaves privadas, arquivos JSON de service account ou credenciais locais. A configuracao sensivel deve ficar em variaveis de ambiente, Application Default Credentials ou Secret Manager.
