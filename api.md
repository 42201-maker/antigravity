# 📡 Documentação da API — CineManager

Documentação técnica completa da API RESTful para o Sistema de Gerenciamento de Filmes.

---

## 1. Visão Geral e URLs Base

- **Ambiente Local:** `http://localhost:3000/api/movies`
- **Ambiente de Produção (Vercel):** `https://seu-projeto-filmes.vercel.app/api/movies`
- **Status da API (Health Check):** `http://localhost:3000/api`

Todas as respostas são serializadas no formato `JSON`, utilizando a codificação `UTF-8`.

---

## 2. Variáveis de Ambiente Necessárias

Para execução local, crie um arquivo `.env` baseado no `.env.example`:

| Variável | Obrigatória | Padrão | Descrição |
| :--- | :---: | :---: | :--- |
| `PORT` | Não | `3000` | Porta onde o servidor Express escutará localmente |
| `MONGODB_URI` | **Sim** | — | URI de conexão com o cluster MongoDB Atlas |

> **Nota para Deploy na Vercel:**  
> No painel da Vercel, acesse **Settings > Environment Variables** e adicione a variável `MONGODB_URI` com a string de conexão do seu MongoDB Atlas.

---

## 3. Códigos de Status HTTP

| Código | Nome | Significado |
| :---: | :--- | :--- |
| **`200 OK`** | Sucesso | A requisição foi atendida com sucesso (listagem, busca, atualização ou exclusão). |
| **`201 Created`** | Criado | O filme foi cadastrado com sucesso no banco de dados. |
| **`400 Bad Request`** | Requisição Inválida | Campos obrigatórios ausentes, formato de ID inválido ou valores de enum inválidos. |
| **`404 Not Found`** | Não Encontrado | O filme com o ID informado não existe na base de dados. |
| **`500 Internal Error`**| Erro no Servidor | Falha inesperada ou erro de conexão com o MongoDB. |

---

---

## 4. Endpoints da API

### 4.1 `GET /api` — Status da API (Health Check)
Verifica se a API está online e pronta para responder.

#### Exemplo de Chamada (cURL)
```bash
curl -X GET http://localhost:3000/api
```

---

### 4.2 Autenticação (`/api/auth`)

#### `POST /api/auth/cadastro` — Criar Nova Conta
Cadastra um novo usuário no banco e retorna o token JWT.
```bash
curl -X POST http://localhost:3000/api/auth/cadastro \
  -H "Content-Type: application/json" \
  -d '{"nome":"Lucas Santos","email":"lucas@exemplo.com","senha":"senhaSegura123"}'
```

#### `POST /api/auth/login` — Entrar na Conta
Autentica as credenciais e retorna o token JWT para acesso aos filmes.
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lucas@exemplo.com","senha":"senhaSegura123"}'
```

#### `GET /api/auth/me` — Obter Dados do Usuário Logado
Retorna o perfil do usuário autenticado atual.
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <SEU_TOKEN_JWT>"
```

---

### 4.3 `GET /api/movies` — Listar Filmes do Usuário Autenticado
Retorna os filmes salvos exclusivamente pelo usuário conectado (requer cabeçalho `Authorization: Bearer <TOKEN>`).

#### Parâmetros de Query (Opcionais)
- `genero`: Filtra por gênero exato (ex: `Ação`, `Drama`, `Ficção Científica`).
- `classificacao`: Filtra por classificação indicativa (`Livre`, `10`, `12`, `14`, `16`, `18`).
- `busca`: Busca textual parcial pelo título do filme (case-insensitive).

#### Exemplo de Chamada (cURL)
```bash
# Listar todos os filmes
curl -X GET http://localhost:3000/api/movies

# Listar filtrando por gênero e classificação
curl -X GET "http://localhost:3000/api/movies?genero=Fic%C3%A7%C3%A3o%20Cient%C3%ADfica&classificacao=10"

# Buscar por título
curl -X GET "http://localhost:3000/api/movies?busca=Interestelar"
```

#### Exemplo de Resposta (`200 OK`)
```json
{
  "success": true,
  "total": 1,
  "data": [
    {
      "_id": "6724a291f9b3e1001a1b2c3d",
      "titulo": "Interestelar",
      "genero": "Ficção Científica",
      "classificacao": "10",
      "foto": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
      "createdAt": "2026-09-23T14:30:00.000Z",
      "updatedAt": "2026-09-23T14:30:00.000Z"
    }
  ]
}
```

---

### 4.3 `GET /api/movies/:id` — Buscar Filme por ID
Retorna os dados detalhados de um filme específico.

#### Parâmetros de Rota
- `id` (obrigatório): ObjectId do MongoDB correspondente ao filme.

#### Exemplo de Chamada (cURL)
```bash
curl -X GET http://localhost:3000/api/movies/6724a291f9b3e1001a1b2c3d
```

#### Exemplo de Resposta (`200 OK`)
```json
{
  "success": true,
  "data": {
    "_id": "6724a291f9b3e1001a1b2c3d",
    "titulo": "Interestelar",
    "genero": "Ficção Científica",
    "classificacao": "10",
    "foto": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    "createdAt": "2026-09-23T14:30:00.000Z",
    "updatedAt": "2026-09-23T14:30:00.000Z"
  }
}
```

#### Exemplo de Resposta de Erro (`404 Not Found`)
```json
{
  "success": false,
  "message": "Filme não encontrado."
}
```

---

### 4.4 `POST /api/movies` — Cadastrar Novo Filme
Cadastra um novo filme no acervo.

#### Campos Obrigatórios no Corpo (`application/json`)
- `titulo` (String): Nome do filme (1 a 200 caracteres).
- `genero` (String): Gênero cinematográfico (mínimo 2 caracteres).
- `classificacao` (String): Um dos valores aceitos: `"Livre"`, `"10"`, `"12"`, `"14"`, `"16"`, `"18"`.
- `foto` (String): URL direta da imagem (ex: `https://...`) ou imagem em formato Base64 Data URI (`data:image/png;base64,...`).

#### Exemplo de Chamada com URL (cURL)
```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "O Poderoso Chefão",
    "genero": "Drama",
    "classificacao": "16",
    "foto": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"
  }'
```

#### Exemplo de Chamada com Upload Base64 (cURL)
```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Matrix",
    "genero": "Ficção Científica",
    "classificacao": "14",
    "foto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

#### Exemplo de Resposta de Sucesso (`201 Created`)
```json
{
  "success": true,
  "message": "Filme cadastrado com sucesso!",
  "data": {
    "_id": "6724a291f9b3e1001a1b2c3e",
    "titulo": "O Poderoso Chefão",
    "genero": "Drama",
    "classificacao": "16",
    "foto": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    "createdAt": "2026-09-23T14:32:00.000Z",
    "updatedAt": "2026-09-23T14:32:00.000Z"
  }
}
```

#### Exemplo de Resposta de Erro de Validação (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Dados incompletos ou inválidos.",
  "erros": [
    "O campo \"titulo\" é obrigatório.",
    "O campo \"genero\" é obrigatório."
  ]
}
```

---

### 4.5 `PUT /api/movies/:id` — Atualizar Filme
Atualiza um ou mais campos de um filme já existente.

#### Exemplo de Chamada (cURL)
```bash
curl -X PUT http://localhost:3000/api/movies/6724a291f9b3e1001a1b2c3d \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Interestelar (Edição Remasterizada)",
    "classificacao": "12"
  }'
```

#### Exemplo de Resposta de Sucesso (`200 OK`)
```json
{
  "success": true,
  "message": "Filme atualizado com sucesso!",
  "data": {
    "_id": "6724a291f9b3e1001a1b2c3d",
    "titulo": "Interestelar (Edição Remasterizada)",
    "genero": "Ficção Científica",
    "classificacao": "12",
    "foto": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    "createdAt": "2026-09-23T14:30:00.000Z",
    "updatedAt": "2026-09-23T14:35:00.000Z"
  }
}
```

---

### 4.6 `DELETE /api/movies/:id` — Remover Filme
Remove um filme definitivamente do banco de dados.

#### Exemplo de Chamada (cURL)
```bash
curl -X DELETE http://localhost:3000/api/movies/6724a291f9b3e1001a1b2c3d
```

#### Exemplo de Resposta de Sucesso (`200 OK`)
```json
{
  "success": true,
  "message": "Filme removido com sucesso!",
  "data": {
    "id": "6724a291f9b3e1001a1b2c3d",
    "titulo": "Interestelar"
  }
}
```
