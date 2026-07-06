# Bora Cuidar Backend

Backend Node/Express do Bora Cuidar para criacao e validacao server-side de agendamentos.

## Stack

- Node.js 20+
- Express
- Firebase Admin SDK
- Cloud Run

## Estrutura

- `src/`: codigo da API
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

Endpoint principal:

```bash
POST /api/bookings/create
```

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
