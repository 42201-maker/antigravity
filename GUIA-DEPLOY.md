# 🚀 Guia Completo de Deploy — CineManager

Este projeto foi totalmente reestruturado em duas pastas independentes:
- 📁 **`back/`**: API Node.js + Express + Mongoose + JWT + MongoDB Atlas.
- 📁 **`front/`**: Interface visual Vanilla HTML5 + CSS3 moderno + JavaScript.

---

## ❓ Por que o Backend costuma dar problema na Vercel?

A Vercel é uma plataforma criada prioritariamente para **Frontends** e **Funções Serverless** (que executam em milissegundos e encerram). Servidores tradicionais Express com bancos como MongoDB sofrem na Vercel por três motivos comuns:

1. **Root Directory indefinido:** Ao importar um repositório com front e back juntos, a Vercel não sabe qual `package.json` executar.
2. **Timeout de Conexão com MongoDB:** Funções serverless "congelam" contêineres; se a variável `MONGODB_URI` não estiver configurada no painel da Vercel ou demorar mais de 10s, dá erro `504 Gateway Timeout` ou `500 Server Error`.
3. **Frontend chamando `/api` no domínio errado:** Ao subir só o frontend na Vercel (ex: `https://meu-front.vercel.app`), ele tenta chamar a API no próprio domínio dele. Se o backend estiver em outro lugar ou offline, retorna `404 Not Found` ou `Failed to fetch`.

Para resolver isso de forma definitiva, preparamos duas soluções testadas:

---

## 🌟 Opção 1 (Recomendada): Front na Vercel + Back no Render

Esta é a arquitetura padrão da indústria e a mais aceita em cursos técnicos e faculdades: o **Render** roda o servidor Node.js de forma contínua (sem limitações serverless) e a **Vercel** entrega o frontend estático ultra-rápido.

### Passo 1: Subir o Backend no Render (Gratuito)

1. Acesse [render.com](https://render.com) e crie uma conta gratuita.
2. No painel, clique em **New +** e escolha **Web Service**.
3. Conecte o seu repositório do GitHub.
4. Preencha as configurações:
   - **Name:** `cinemanager-backend` (ou o nome que preferir)
   - **Root Directory:** `back`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Em **Environment Variables** (Variáveis de Ambiente), adicione:
   - `MONGODB_URI`: Sua string do MongoDB Atlas (ex: `mongodb+srv://...`)
   - `JWT_SECRET`: `cinemanager_super_secret_jwt_key_2026_auth_token`
   - `NODE_ENV`: `production`
6. Clique em **Create Web Service**.
7. Aguarde o deploy terminar e copie a URL gerada (ex: `https://cinemanager-backend.onrender.com`).

---

### Passo 2: Subir o Frontend na Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New...** -> **Project**.
2. Selecione o mesmo repositório do GitHub.
3. Na seção **Root Directory**, clique em **Edit** e selecione a pasta:
   ```
   front
   ```
4. Clique em **Deploy**.
5. Em poucos segundos seu frontend estará no ar (ex: `https://cinemanager-front.vercel.app`)!

---

### Passo 3: Conectar o Front ao Back

Abra o seu site publicado na Vercel:
1. No canto superior direito da página, clique no botão **"⚙️ Servidor"** (com a bolinha indicadora).
2. Cole a URL do seu backend gerada no Render (ex: `https://cinemanager-backend.onrender.com`).
3. Clique em **"Testar Conexão"** (o status ficará verde: *✅ Conexão estabelecida com sucesso!*).
4. Clique em **"Salvar e Conectar"**.
5. Pronto! O frontend salvará essa URL no navegador e funcionará perfeitamente.

---

## ⚡ Opção 2: Subir AMBOS na Vercel (Dois Projetos Separados)

Se você preferir manter tudo dentro da Vercel, já deixamos a pasta `back/` com o arquivo `back/vercel.json` e `back/api/index.js` preparados para Serverless:

### Projeto 1: Backend na Vercel
1. No painel da Vercel, clique em **Add New...** -> **Project**.
2. Selecione seu repositório.
3. Em **Root Directory**, selecione:
   ```
   back
   ```
4. Em **Environment Variables**, adicione obrigatoriamente:
   - `MONGODB_URI`: `mongodb+srv://42201:rds3y2c1s@cluster0.xwbicbq.mongodb.net/?appName=Cluster0`
   - `JWT_SECRET`: `cinemanager_super_secret_jwt_key_2026_auth_token`
   - `NODE_ENV`: `production`
5. Clique em **Deploy**. A Vercel criará seu backend (ex: `https://cinemanager-back.vercel.app`).
6. Teste abrindo `https://seu-backend.vercel.app/api` no navegador. Deve responder com o JSON da API!

### Projeto 2: Frontend na Vercel
1. Repita o processo criando outro projeto com **Root Directory** apontando para `front`.
2. Após o deploy, acesse o frontend e configure a URL do seu backend no botão **"⚙️ Servidor"** no topo da página.

---

## 💻 Como Rodar Tudo Localmente no Computador

Para testar na sua máquina antes de subir:

### 1. Iniciar o Backend
Abra um terminal na pasta do projeto e execute:
```bash
cd back
npm install
npm start
```
O servidor iniciará em `http://localhost:3000`.

### 2. Abrir o Frontend
Basta dar duplo clique no arquivo `front/index.html` ou abri-lo pelo VS Code com a extensão **Live Server** (porta 5500). O frontend detecta automaticamente a porta local `http://localhost:3000`!

### 3. Rodar a Bateria de Testes Automatizados
Para garantir que 100% das rotas de autenticação e CRUD de filmes continuam íntegras:
```bash
cd back
npm test
```
*(Todos os 11 testes passarão com 100% de sucesso)*.
