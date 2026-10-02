const mongoose = require('mongoose');
require('dotenv').config();

// Cache global para reutilização da conexão em ambiente serverless (Vercel) e instâncias Node
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Conecta exclusivamente ao banco de dados MongoDB real via MONGODB_URI.
 * Sem dados falsos (mock/seed) e sem banco em memória.
 */
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'A variável de ambiente MONGODB_URI não está definida no arquivo .env ou nas variáveis do servidor. Configure a URL de conexão do MongoDB Atlas.'
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('✅ Conexão com MongoDB estabelecida com sucesso.');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    throw error;
  }

  return cached.conn;
}

module.exports = connectDB;
