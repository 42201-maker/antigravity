# Contexto do Projeto — Sistema de Gerenciamento de Filmes

Documento vivo de contexto técnico, decisões de arquitetura e progresso das tarefas.

---

## 1. Visão Geral do Sistema
O **CineManager** é uma aplicação full-stack para gerenciamento de filmes (CRUD completo), desenvolvida para ser robusta, simples de executar localmente e 100% preparada para deploy serverless na plataforma Vercel com banco de dados MongoDB Atlas.

- **Backend:** Node.js + Express + Mongoose (`/api`), exportado como Serverless Functions compatíveis com a Vercel.
- **Banco de Dados:** MongoDB Atlas conectado exclusivamente via variável de ambiente `MONGODB_URI`, sem dados falsos de demonstração e sem banco em memória.
- **Frontend:** Single-Page Application estática em Vanilla JavaScript, HTML5 e CSS3 moderno (`/frontend`), com design cinematográfico escuro, responsividade e sem frameworks pesados.
- **Documentação e Acompanhamento:** `Roadmap.md`, `Contexto.md` e `api.md`.

---

## 2. Decisões Técnicas e Arquitetura

### 2.1 Armazenamento de Pôsteres / Fotos (URL vs Upload Base64)
- **Decisão:** O sistema aceita indistintamente **URL direta** (ex: `https://...`) e **Upload de arquivo local em Base64 Data URI** (`data:image/...;base64,...`).
- **Motivação:** Em ambientes serverless (Vercel), o disco é efêmero e não permite persistência de uploads locais. O armazenamento de imagens em Base64 diretamente no documento do MongoDB (com limite padrão BSON de 16MB) viabiliza um MVP 100% funcional imediatamente, sem depender da criação ou configuração de contas pagas em serviços como Cloudinary ou AWS S3. No frontend, o usuário tem abas com alternância intuitiva e visualizador (preview) do pôster em tempo real.

### 2.2 Reutilização de Conexão no Serverless da Vercel
- **Decisão:** Implementação de conexão singleton com cache global (`global.mongooseCached` e `bufferCommands: false`).
- **Motivação:** Em funções serverless da Vercel, contêineres podem ser congelados e reativados. Esse padrão impede que novas conexões sejam abertas a cada requisição, protegendo o limite de conexões simultâneas do MongoDB Atlas.

### 2.3 Conexão Estrita com o Banco de Dados Real
- **Decisão:** O sistema conecta unicamente ao cluster MongoDB Atlas real configurado no arquivo `.env` via `MONGODB_URI`. Nenhum dado simulado/mock é semeado na coleção, garantindo que o catálogo reflita fielmente os dados reais inseridos no banco.
- **Motivação:** Garantir integridade dos dados e fidelidade ao banco de dados do projeto.

### 2.4 Design e Estética Cinematográfica
- **Decisão:** Vanilla CSS estruturado com tema escuro (Dark Mode cinematográfico), acentos dourados e azuis, Google Fonts (*Outfit* e *Inter*), micro-animações em hover, modais com desfoque de fundo (`backdrop-filter`), toasts automáticos para mensagens de sucesso/erro e badges de classificação indicativa com as cores oficiais brasileiras:
  - **Livre:** Verde (#10b981)
  - **10 anos:** Azul (#0ea5e9)
  - **12 anos:** Amarelo (#facc15)
  - **14 anos:** Laranja (#f97316)
  - **16 anos:** Vermelho (#ef4444)
  - **18 anos:** Carmesim escuro com borda vermelha (#1e1b4b / #dc2626)

---

## 3. Estado Atual das Entregas

- [x] **Estrutura de pastas:** `/api` e `/frontend` totalmente estruturadas.
- [x] **Configuração do backend:** `package.json`, `index.js`, dependências instaladas (`bcryptjs` e `jsonwebtoken`).
- [x] **Conexão com MongoDB:** `api/config/db.js` com cache serverless conectado exclusivamente ao MongoDB Atlas real.
- [x] **Autenticação de Usuários:** `Usuario.js` com hash bcrypt, `auth.js` middleware e rotas `/api/auth/cadastro`, `/api/auth/login` e `/api/auth/me`.
- [x] **Model Movie:** `api/models/Movie.js` com validações rigorosas e vínculo exclusivo ao `usuario` proprietário.
- [x] **Rotas CRUD protegidas:** `GET /api/movies`, `GET /api/movies/:id`, `POST /api/movies`, `PUT /api/movies/:id`, `DELETE /api/movies/:id` com isolamento por usuário.
- [x] **Bateria de testes automatizados:** `test-api.js` cobrindo autenticação, senhas e CRUD de filmes.
- [x] **Configuração Vercel:** `vercel.json` configurado com rewrites para API serverless e frontend estático.
- [x] **Frontend HTML/CSS/JS:** Tela/Modal de Login e Cadastro, alternância de abas, saudação personalizada no cabeçalho, hero para visitantes, catálogo exclusivo por conta e persistência de sessão.
- [x] **Documentação de API:** `api.md` com rotas, códigos de status e comandos `curl`.

---

## 4. Como Executar Localmente

1. **Instalar dependências:**
   ```bash
   npm install
   ```
2. **(Opcional) Configurar MongoDB Atlas:**
   - Duplique `.env.example` para `.env`.
   - Adicione sua string `MONGODB_URI`.
   - *Nota:* Se omitida, o sistema utilizará banco em memória automaticamente para testes.
3. **Executar a suíte de testes da API:**
   ```bash
   npm run test:api
   ```
4. **Iniciar a aplicação:**
   ```bash
   npm start
   ```
   Acesse a aplicação no navegador em: `http://localhost:3000`

---

## 5. Como Fazer Deploy na Vercel

1. Instale a Vercel CLI (`npm i -g vercel`) ou conecte o repositório Git diretamente no [dashboard da Vercel](https://vercel.com).
2. Adicione a variável de ambiente:
   - Nome: `MONGODB_URI`
   - Valor: Sua connection string do MongoDB Atlas (ex: `mongodb+srv://...`)
3. Execute o comando `vercel` ou faça push no branch principal (`main`).
4. A Vercel utilizará o `vercel.json` para servir o frontend na raiz e a API sob a rota `/api/*`.
