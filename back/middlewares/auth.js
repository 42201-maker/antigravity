const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido. Por favor, faça login.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'cinemanager_super_secret_jwt_key_2026_auth_token';

  try {
    const decoded = jwt.verify(token, secret);
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sua sessão expirou. Por favor, faça login novamente.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token de autenticação inválido.',
    });
  }
}

module.exports = authMiddleware;
