# Roadmap do Projeto — Sistema de Gerenciamento de Filmes

Checklist de acompanhamento do desenvolvimento incremental do projeto:

- [x] **Etapa 1:** Estruturar pastas independentes do projeto (`back/` e `front/`)
- [x] **Etapa 2:** Configurar backend Node + Express (`package.json`, `index.js`, dependências)
- [x] **Etapa 3:** Configurar conexão com MongoDB (Mongoose com suporte a serverless e dev fallback)
- [x] **Etapa 4:** Criar model `Movie` com validações de dados (Livre, 10, 12, 14, 16, 18 e foto URL/Base64)
- [x] **Etapa 5:** Criar rotas CRUD da API (`GET`, `POST`, `PUT`, `DELETE` com status 200, 201, 400, 404, 500)
- [x] **Etapa 6:** Testar rotas da API localmente (14 casos de testes automatizados com 100% de aprovação)
- [x] **Etapa 7:** Configurar `vercel.json` e preparar deploy serverless do backend
- [x] **Etapa 8:** Criar estrutura HTML e estilização CSS moderna do frontend (Dark UI cinematográfico)
- [x] **Etapa 9:** Implementar listagem de filmes consumindo a API com cards e loading
- [x] **Etapa 10:** Implementar formulário de cadastro e edição (com suporte a URL e upload Base64)
- [x] **Etapa 11:** Implementar exclusão de filmes e filtros dinâmicos por gênero e classificação
- [x] **Etapa 12:** Testar integração completa frontend + backend (servidor ativo em http://localhost:3000)
- [x] **Etapa 13:** Implementar sistema de contas de usuários (Login, Cadastro com JWT e bcrypt) para isolamento seguro do acervo de cada pessoa
- [x] **Etapa 14:** Escrever documentação completa em `Contexto.md` e `api.md`
- [x] **Etapa 15:** Separação completa de `back/` e `front/` e guia detalhado de deploy (`GUIA-DEPLOY.md`)
