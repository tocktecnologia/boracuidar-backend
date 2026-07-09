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

---

# Guia de Teste Local - Bora Cuidar

Este guia explica como rodar os projetos `boracuidar` (Flutter) e `boracuidar-backend` (Node.js) localmente e de forma integrada para você testar as modificações feitas no processo de cadastro/onboarding.

**IMPORTANTE:**
> Certifique-se de que não subimos essas alterações para o repositório remoto (`git push`) até que você conclua os seus testes localmente e aprove o comportamento.

---

## Passo 1: Executando o Backend (Node.js) Localmente

1. Abra um terminal e navegue até a pasta do backend:
   ```bash
   cd "d:\TOCK\Bora Cuidar\webapp\boracuidar-backend"
   ```

2. Certifique-se de que as dependências estão instaladas (você provavelmente já as tem):
   ```bash
   npm install
   ```

3. Inicie o servidor localmente em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   > Por padrão, o backend irá rodar na porta `8080` (ex: `http://localhost:8080`). Se estiver configurado em outra porta via `.env`, anote essa porta.

---

## Passo 2: Apontando o Flutter para o Backend Local

O aplicativo Flutter utiliza a constante `BORACUIDAR_API_URL` para se comunicar com o backend (via `--dart-define` ou arquivo de variáveis). Se a URL não for fornecida, ele usa a URL de produção do Cloud Run como fallback.

Para rodar localmente e apontar o Flutter para o seu Node.js rodando no `localhost`, faça o seguinte:

1. Abra um **novo** terminal (mantenha o backend rodando no anterior) e navegue até a pasta do flutter:
   ```bash
   cd "d:\TOCK\Bora Cuidar\webapp\boracuidar"
   ```

2. Pare qualquer execução anterior do Flutter (se houver, feche ou pressione `q` no terminal onde o `flutter run` está ativo).

3. Inicie o Flutter no Chrome, injetando a variável de ambiente para que ele converse com o backend local em vez de produção:
   ```bash
   flutter run -d chrome --dart-define=BORACUIDAR_API_URL=http://localhost:3000
   ```
   *Nota: Caso o seu backend esteja rodando em uma porta diferente de `3000`, altere no comando acima.*

---

## Passo 3: Testando a Funcionalidade

1. No Chrome que abrir, inicie o fluxo de registro (`/signup`).
2. Prossiga preenchendo todos os dados necessários (Nome do negócio, WhatsApp, e-mail, plano, tipo de negócio).
3. Na última etapa, ao clicar em "Finalizar", observe no terminal do backend se ele processou a requisição `/api/boracuidar/onboarding/finalize`.
4. Verifique no painel do Firebase Console se os novos documentos foram criados corretamente nas coleções: `business`, `users`, `servicos`, `trabalhadores`, `trabalhador_servico` e `horarios_padrao`.

Se ocorrer algum erro durante a finalização do cadastro, verifique a mensagem de erro que aparecerá no console/terminal do Node.js (`npm run dev`), onde temos logs mais detalhados agora!
