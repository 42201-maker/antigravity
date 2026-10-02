const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./index');

async function runTests() {
  console.log('🧪 Iniciando bateria de testes automatizados da API no back (Auth + Filmes)...\n');

  let mongod;
  try {
    // Inicializar MongoDB em memória para testes isolados
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'segredo_testes_super_seguro_jwt';

    // Conectar Mongoose ao MongoDB em memória
    await mongoose.connect(uri);
    console.log('✅ MongoDB em memória iniciado e conectado com sucesso.');

    let authToken = null;
    let filmeIdUrl = null;
    let filmeIdBase64 = null;

    // 1. Health Check
    console.log('\n--- 1. Testando Health Check da API ---');
    const resHealth = await request(app).get('/api');
    console.log('GET /api Status:', resHealth.status);
    if (resHealth.status !== 200 || !resHealth.body.success) {
      throw new Error(`Falha no health check: ${JSON.stringify(resHealth.body)}`);
    }
    console.log('✅ Health check respondeu com sucesso.');

    // 2. Cadastro de Usuário (POST /api/auth/cadastro)
    console.log('\n--- 2. Testando Cadastro de Novo Usuário ---');
    const resCadastro = await request(app)
      .post('/api/auth/cadastro')
      .send({
        nome: 'Usuário Teste',
        email: 'teste@cinemanager.com',
        senha: 'senhaSegura123',
      });
    console.log('POST /api/auth/cadastro Status:', resCadastro.status);
    if (resCadastro.status !== 201 || !resCadastro.body.token) {
      throw new Error(`Falha no cadastro: ${JSON.stringify(resCadastro.body)}`);
    }
    authToken = resCadastro.body.token;
    console.log('✅ Usuário cadastrado e token JWT gerado com sucesso.');

    // 3. Login de Usuário (POST /api/auth/login)
    console.log('\n--- 3. Testando Login de Usuário ---');
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teste@cinemanager.com',
        senha: 'senhaSegura123',
      });
    console.log('POST /api/auth/login Status:', resLogin.status);
    if (resLogin.status !== 200 || !resLogin.body.token) {
      throw new Error(`Falha no login: ${JSON.stringify(resLogin.body)}`);
    }
    console.log('✅ Login validado com sucesso.');

    // 4. Login com Senha Incorreta (401)
    console.log('\n--- 4. Testando Login com Senha Incorreta (401) ---');
    const resLoginInvalido = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teste@cinemanager.com',
        senha: 'senhaErrada',
      });
    console.log('POST /api/auth/login com senha errada Status:', resLoginInvalido.status);
    if (resLoginInvalido.status !== 401) {
      throw new Error(`Esperado status 401, recebido: ${resLoginInvalido.status}`);
    }
    console.log('✅ Bloqueio de credenciais inválidas funcionando.');

    // 5. Testar Rota Protegida sem Token (401)
    console.log('\n--- 5. Testando Acesso a Filmes sem Token (401) ---');
    const resSemAuth = await request(app).get('/api/movies');
    console.log('GET /api/movies sem token Status:', resSemAuth.status);
    if (resSemAuth.status !== 401) {
      throw new Error(`Esperado status 401 para requisição sem token, recebido: ${resSemAuth.status}`);
    }
    console.log('✅ Proteção de rota por autenticação funcionando.');

    // 6. Validação: POST com campos faltando
    console.log('\n--- 6. Testando Validação de Campos Obrigatórios (POST 400) ---');
    const resInvalido = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ titulo: 'Sem outros campos' });
    console.log('POST /api/movies incompleto Status:', resInvalido.status);
    if (resInvalido.status !== 400 || !resInvalido.body.erros) {
      throw new Error(`Esperado status 400 com lista de erros, recebido: ${resInvalido.status}`);
    }
    console.log('✅ Validação de campos obrigatórios funcionando:', resInvalido.body.erros);

    // 7. Criação: POST com URL válida
    console.log('\n--- 7. Testando Criação de Filme com URL (POST 201) ---');
    const resCriaUrl = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        titulo: 'Interestelar',
        genero: 'Ficção Científica',
        classificacao: '10',
        foto: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      });
    console.log('POST /api/movies com URL Status:', resCriaUrl.status);
    if (resCriaUrl.status !== 201 || !resCriaUrl.body.data._id) {
      throw new Error(`Falha ao criar filme com URL: ${JSON.stringify(resCriaUrl.body)}`);
    }
    filmeIdUrl = resCriaUrl.body.data._id;
    console.log('✅ Filme criado com sucesso e vinculado ao usuário (ID:', filmeIdUrl, ')');

    // 8. Criação: POST com imagem Base64 válida
    console.log('\n--- 8. Testando Criação de Filme com Upload Base64 (POST 201) ---');
    const base64Pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resCriaBase64 = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        titulo: 'O Poderoso Chefão',
        genero: 'Drama',
        classificacao: '16',
        foto: base64Pixel,
      });
    console.log('POST /api/movies com Base64 Status:', resCriaBase64.status);
    if (resCriaBase64.status !== 201 || !resCriaBase64.body.data._id) {
      throw new Error(`Falha ao criar filme com Base64: ${JSON.stringify(resCriaBase64.body)}`);
    }
    filmeIdBase64 = resCriaBase64.body.data._id;
    console.log('✅ Filme com Base64 criado com sucesso (ID:', filmeIdBase64, ')');

    // 9. Listagem do Usuário: GET /api/movies
    console.log('\n--- 9. Testando Listagem Geral do Usuário Autenticado (GET 200) ---');
    const resLista = await request(app)
      .get('/api/movies')
      .set('Authorization', `Bearer ${authToken}`);
    console.log('GET /api/movies Status:', resLista.status, 'Total retornado:', resLista.body.total);
    if (resLista.status !== 200 || resLista.body.total !== 2) {
      throw new Error(`Esperado 2 filmes cadastrados para o usuário, recebido: ${resLista.body.total}`);
    }
    console.log('✅ Listagem retornou os 2 filmes exclusivos do usuário com sucesso.');

    // 10. Atualização: PUT /api/movies/:id
    console.log('\n--- 10. Testando Atualização de Filme (PUT 200) ---');
    const resUpdate = await request(app)
      .put(`/api/movies/${filmeIdUrl}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        titulo: 'Interestelar (Edição Especial)',
        classificacao: '12',
      });
    console.log('PUT /api/movies/:id Status:', resUpdate.status);
    if (
      resUpdate.status !== 200 ||
      resUpdate.body.data.titulo !== 'Interestelar (Edição Especial)' ||
      resUpdate.body.data.classificacao !== '12'
    ) {
      throw new Error(`Falha na atualização do filme: ${JSON.stringify(resUpdate.body)}`);
    }
    console.log('✅ Atualização PUT realizada com sucesso:', resUpdate.body.data.titulo);

    // 11. Exclusão: DELETE /api/movies/:id
    console.log('\n--- 11. Testando Exclusão de Filme (DELETE 200) ---');
    const resDelete = await request(app)
      .delete(`/api/movies/${filmeIdUrl}`)
      .set('Authorization', `Bearer ${authToken}`);
    console.log('DELETE /api/movies/:id Status:', resDelete.status);
    if (resDelete.status !== 200) {
      throw new Error(`Falha ao deletar filme: ${JSON.stringify(resDelete.body)}`);
    }
    console.log('✅ Filme excluído com sucesso.');

    console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!\n');
  } catch (error) {
    console.error('❌ Falha nos testes:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  }
}

runTests();
