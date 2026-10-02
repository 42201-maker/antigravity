const express = require('express');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const connectDB = require('../config/db');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Middleware para garantir conexão ativa com o banco em cada requisição serverless
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao conectar com o banco de dados MongoDB.',
      error: error.message,
    });
  }
});

// Todas as rotas de filmes exigem autenticação do usuário
router.use(authMiddleware);

/**
 * @route   GET /api/movies
 * @desc    Lista todos os filmes do usuário autenticado com filtros opcionais
 * @access  Privado (requer token JWT)
 */
router.get('/', async (req, res) => {
  try {
    const { genero, classificacao, busca } = req.query;
    // Isolar os filmes exclusivamente para o usuário logado
    const filtro = { usuario: req.usuario.id };

    if (genero && genero.trim() !== '') {
      filtro.genero = new RegExp(`^${genero.trim()}$`, 'i');
    }

    if (classificacao && classificacao.trim() !== '') {
      filtro.classificacao = classificacao.trim();
    }

    if (busca && busca.trim() !== '') {
      filtro.titulo = { $regex: busca.trim(), $options: 'i' };
    }

    const movies = await Movie.find(filtro).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: movies.length,
      data: movies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Falha ao buscar filmes.',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/movies/:id
 * @desc    Busca um filme específico do usuário pelo ID
 * @access  Privado (requer token JWT)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador (ID) de filme inválido.',
      });
    }

    const movie = await Movie.findOne({ _id: id, usuario: req.usuario.id });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Filme não encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Falha ao buscar o filme.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/movies
 * @desc    Cadastra um novo filme vinculado ao usuário autenticado
 * @access  Privado (requer token JWT)
 */
router.post('/', async (req, res) => {
  try {
    const { titulo, genero, classificacao, foto } = req.body;

    // Validações explícitas de campos obrigatórios
    const erros = [];
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      erros.push('O campo "titulo" é obrigatório.');
    }
    if (!genero || typeof genero !== 'string' || genero.trim() === '') {
      erros.push('O campo "genero" é obrigatório.');
    }
    if (!classificacao || typeof classificacao !== 'string' || classificacao.trim() === '') {
      erros.push('O campo "classificacao" é obrigatório.');
    }
    if (!foto || typeof foto !== 'string' || foto.trim() === '') {
      erros.push('O campo "foto" é obrigatório (URL ou imagem em Base64).');
    }

    if (erros.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos ou inválidos.',
        erros,
      });
    }

    const novoFilme = new Movie({
      titulo: titulo.trim(),
      genero: genero.trim(),
      classificacao: classificacao.trim(),
      foto: foto.trim(),
      usuario: req.usuario.id, // Vincula ao usuário autenticado
    });

    const filmeSalvo = await novoFilme.save();

    return res.status(201).json({
      success: true,
      message: 'Filme cadastrado com sucesso!',
      data: filmeSalvo,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagens = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erro de validação nos dados do filme.',
        erros: mensagens,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Falha ao cadastrar o filme.',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/movies/:id
 * @desc    Atualiza um filme existente pertencente ao usuário
 * @access  Privado (requer token JWT)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, genero, classificacao, foto } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador (ID) de filme inválido.',
      });
    }

    const updates = {};
    if (titulo !== undefined) {
      if (typeof titulo !== 'string' || titulo.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'O título não pode estar vazio.',
        });
      }
      updates.titulo = titulo.trim();
    }

    if (genero !== undefined) {
      if (typeof genero !== 'string' || genero.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'O gênero não pode estar vazio.',
        });
      }
      updates.genero = genero.trim();
    }

    if (classificacao !== undefined) {
      if (typeof classificacao !== 'string' || classificacao.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'A classificação não pode estar vazia.',
        });
      }
      updates.classificacao = classificacao.trim();
    }

    if (foto !== undefined) {
      if (typeof foto !== 'string' || foto.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'A foto não pode estar vazia.',
        });
      }
      updates.foto = foto.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado informado para atualização.',
      });
    }

    const filmeAtualizado = await Movie.findOneAndUpdate(
      { _id: id, usuario: req.usuario.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!filmeAtualizado) {
      return res.status(404).json({
        success: false,
        message: 'Filme não encontrado para atualização.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Filme atualizado com sucesso!',
      data: filmeAtualizado,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensagens = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erro de validação nos dados do filme.',
        erros: mensagens,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Falha ao atualizar o filme.',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/movies/:id
 * @desc    Remove um filme existente pertencente ao usuário
 * @access  Privado (requer token JWT)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador (ID) de filme inválido.',
      });
    }

    const filmeRemovido = await Movie.findOneAndDelete({ _id: id, usuario: req.usuario.id });

    if (!filmeRemovido) {
      return res.status(404).json({
        success: false,
        message: 'Filme não encontrado para remoção.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Filme removido com sucesso!',
      data: { id: filmeRemovido._id, titulo: filmeRemovido.titulo },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Falha ao remover o filme.',
      error: error.message,
    });
  }
});

module.exports = router;
