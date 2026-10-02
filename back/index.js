const express = require('express');
const cors = require('cors');
require('dotenv').config();

const moviesRoutes = require('./routes/movies');
const authRoutes = require('./routes/auth');

const app = express();

// Middlewares essenciais
// Habilita CORS irrestrito para aceitar requisições de qualquer frontend (Vercel, localhost, etc.)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Limite aumentado para suportar upload de imagens em formato Base64 (Data URI)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rota raiz (Health Check e boas-vindas)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🎬 CineManager Backend API está online!',
    version: '1.0.0',
    endpoints: {
      health: '/api',
      auth: '/api/auth',
      movies: '/api/movies',
    },
  });
});

// Rota de verificação de status (Health Check)
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🎬 API do Sistema de Gerenciamento de Filmes ativa!',
    endpoints: {
      auth: '/api/auth',
      movies: '/api/movies',
    },
    version: '1.0.0',
  });
});

// Rotas da API sob o prefixo /api
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);

// Fallback amigável também para quem chamar sem o prefixo /api
app.use('/auth', authRoutes);
app.use('/movies', moviesRoutes);

// Rota 404 para endpoints não mapeados
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.originalUrl} não encontrada no backend.`,
  });
});

// Tratamento global de erros não capturados
app.use((err, req, res, next) => {
  console.error('Erro global na API:', err);
  res.status(err.status || 500).json({
    success: false,
    message: 'Erro interno no servidor.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Exporta para execução como Serverless Function (Vercel)
module.exports = app;

// Se executado diretamente (localmente ou em serviços como Render/Railway via node index.js)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend CineManager rodando em: http://localhost:${PORT}`);
    console.log(`📡 Healthcheck disponível em: http://localhost:${PORT}/api`);
    console.log(`🎬 Filmes disponíveis em: http://localhost:${PORT}/api/movies`);
  });
}
