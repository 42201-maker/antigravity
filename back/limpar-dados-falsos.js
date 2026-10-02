/**
 * Script para remover os dados falsos (filmes de demonstração e usuário demo)
 * diretamente do MongoDB Atlas, mantendo a coleção de filmes limpa para uso real.
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function limparDadosFalsos() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI não encontrada no arquivo .env!');
    process.exit(1);
  }

  console.log('🔄 Conectando ao MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ Conectado com sucesso ao banco:', mongoose.connection.name);

  // 1. Remover os filmes falsos (semeados com o usuário demo ou pelos títulos de teste)
  const titulosFalsos = [
    'Interestelar',
    'Batman: O Cavaleiro das Trevas',
    'O Poderoso Chefão',
    'Toy Story',
    'Oppenheimer',
  ];

  const resultadoFilmes = await mongoose.connection.collection('movies').deleteMany({
    $or: [
      { usuario: '6ab65ed19ed2a0c8c9b9a8e2' },
      { titulo: { $in: titulosFalsos } },
    ],
  });
  console.log(`🎬 Filmes falsos removidos do catálogo: ${resultadoFilmes.deletedCount}`);

  // 2. Remover usuário de demonstração (Usuário Demonstração / demo@cinemanager.com)
  const resultadoUsers = await mongoose.connection.collection('users').deleteMany({
    email: 'demo@cinemanager.com',
  });
  console.log(`👤 Usuários demo removidos: ${resultadoUsers.deletedCount}`);

  // Se a collection 'users' ficou vazia, podemos remover a collection
  const totalUsers = await mongoose.connection.collection('users').countDocuments().catch(() => 0);
  if (totalUsers === 0) {
    await mongoose.connection.collection('users').drop().catch(() => {});
    console.log('🗑️  Collection "users" de demonstração removida.');
  }

  // 3. Status atual do banco de dados
  const totalFilmesRestantes = await mongoose.connection.collection('movies').countDocuments();
  console.log(`📊 Total de filmes restantes no banco: ${totalFilmesRestantes}`);

  const totalUsuariosReais = await mongoose.connection.collection('usuarios').countDocuments().catch(() => 0);
  console.log(`🔒 Coleção de usuários reais ('usuarios') preservada intacta com: ${totalUsuariosReais} registros.`);

  await mongoose.disconnect();
  console.log('✨ Limpeza concluída com sucesso!');
}

limparDadosFalsos().catch((err) => {
  console.error('❌ Erro durante a limpeza:', err.message);
  process.exit(1);
});
