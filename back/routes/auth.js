const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const connectDB = require('../config/db');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Garantir conexão ativa com o MongoDB em cada requisição
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao conectar ao banco de dados.',
      error: error.message,
    });
  }
});

/**
 * Função utilitária para gerar token JWT
 */
function gerarToken(usuario) {
  const secret = process.env.JWT_SECRET || 'cinemanager_super_secret_jwt_key_2026_auth_token';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: usuario._id.toString(),
      nome: usuario.nome,
      email: usuario.email,
    },
    secret,
    { expiresIn }
  );
}

/**
 * @route   POST /api/auth/cadastro
 * @desc    Cria uma nova conta de usuário
 * @access  Público
 */
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const erros = [];
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      erros.push('O nome deve conter pelo menos 2 caracteres.');
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      erros.push('Informe um endereço de e-mail válido.');
    }
    if (!senha || typeof senha !== 'string' || senha.length < 6) {
      erros.push('A senha deve conter no mínimo 6 caracteres.');
    }

    if (erros.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos para cadastro.',
        erros,
      });
    }

    const emailLimpo = email.trim().toLowerCase();

    // Verificar se já existe usuário com este e-mail
    const usuarioExistente = await Usuario.findOne({ email: emailLimpo });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma conta cadastrada com este endereço de e-mail.',
      });
    }

    const novoUsuario = new Usuario({
      nome: nome.trim(),
      email: emailLimpo,
      senha: senha,
      ativo: true,
    });

    await novoUsuario.save();

    const token = gerarToken(novoUsuario);

    return res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso! Seja bem-vindo(a).',
      token,
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
      },
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao realizar cadastro.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Autentica um usuário existente e retorna o token JWT
 * @access  Público
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Informe o e-mail e a senha para entrar.',
      });
    }

    const emailLimpo = email.trim().toLowerCase();

    // Buscar usuário pelo e-mail
    const usuario = await Usuario.findOne({ email: emailLimpo });
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha incorretos.',
      });
    }

    // Verificar senha
    const senhaValida = await usuario.compararSenha(senha);
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha incorretos.',
      });
    }

    const token = gerarToken(usuario);

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao realizar login.',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Retorna os dados do usuário autenticado atual
 * @access  Privado
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-senha');
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter dados do usuário.',
      error: error.message,
    });
  }
});

module.exports = router;
