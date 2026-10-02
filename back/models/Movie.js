const mongoose = require('mongoose');

const CLASSIFICACOES_VALIDAS = ['Livre', '10', '12', '14', '16', '18'];

const movieSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'O título do filme é obrigatório.'],
      trim: true,
      minlength: [1, 'O título não pode estar vazio.'],
      maxlength: [200, 'O título deve ter no máximo 200 caracteres.'],
    },
    genero: {
      type: String,
      required: [true, 'O gênero do filme é obrigatório.'],
      trim: true,
      minlength: [2, 'O gênero deve ter pelo menos 2 caracteres.'],
      maxlength: [50, 'O gênero deve ter no máximo 50 caracteres.'],
    },
    classificacao: {
      type: String,
      required: [true, 'A classificação indicativa é obrigatória.'],
      trim: true,
      enum: {
        values: CLASSIFICACOES_VALIDAS,
        message: 'Classificação inválida. Valores aceitos: Livre, 10, 12, 14, 16, 18.',
      },
    },
    foto: {
      type: String,
      required: [true, 'A foto/pôster do filme é obrigatória (URL ou imagem).'],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || typeof v !== 'string') return false;
          // Aceita URLs válidas (http/https) ou Base64 Data URI de imagem
          const isUrl = /^https?:\/\/.+/i.test(v);
          const isBase64 = /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,.+/i.test(v);
          return isUrl || isBase64;
        },
        message: 'A foto deve ser uma URL válida (http/https) ou uma imagem em formato Base64 (Data URI).',
      },
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'O usuário proprietário do filme é obrigatório.'],
      index: true,
    },
  },
  {
    timestamps: true, // Gera automaticamente createdAt e updatedAt
    versionKey: false,
  }
);

// Mongoose model caching (evita re-compilar o modelo se já instanciado em hot reloads)
const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

module.exports = Movie;
