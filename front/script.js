/**
 * CineManager — Lógica do Frontend (Vanilla JavaScript)
 * Autenticação de Usuários (Login e Cadastro), Gerenciamento de Filmes exclusivos,
 * Modais, Uploads Base64/URL e Filtros.
 */

// ==========================================================================
// Configuração Dinâmica das URLs da API (Backend)
// ==========================================================================
let ENV_API_URL = '';

/**
 * Lê o arquivo .env do frontend caso esteja disponível via requisição estática
 */
async function carregarEnv() {
  try {
    const response = await fetch('.env');
    if (response.ok) {
      const text = await response.text();
      const match = text.match(/^\s*API_URL\s*=\s*(.+)$/m);
      if (match && match[1]) {
        const url = match[1].trim().replace(/['"]/g, '').replace(/\/+$/, '');
        if (url) {
          ENV_API_URL = url;
          atualizarUrlsApi();
        }
      }
    }
  } catch (err) {
    // Se o navegador/servidor bloquear leitura de .env, usará config.js ou fallback
  }
}

function getBaseHost() {
  // 1. Prioridade: URL salva manualmente pelo usuário no modal de configuração
  const custom = localStorage.getItem('cinemanager_backend_url');
  if (custom && custom.trim() !== '') {
    return custom.trim().replace(/\/+$/, '');
  }

  // 2. Prioridade: URL lida do arquivo .env do front
  if (ENV_API_URL && ENV_API_URL.trim() !== '') {
    return ENV_API_URL.trim().replace(/\/+$/, '');
  }

  // 3. Prioridade: URL definida no arquivo config.js (window.ENV.API_URL)
  if (typeof window !== 'undefined' && window.ENV && window.ENV.API_URL) {
    return window.ENV.API_URL.trim().replace(/\/+$/, '');
  }

  // 4. Se executando localmente em Live Server (5500), Vite (5173), etc.
  const isDevPort = window.location.port && !['3000', '80', '443', ''].includes(window.location.port);
  if (isDevPort) {
    return 'http://localhost:3000';
  }

  // 5. Se rodando na porta 3000 (servidor Express local)
  if (window.location.port === '3000') {
    return 'http://localhost:3000';
  }

  // 6. Se aberto diretamente via arquivo local (file://)
  if (window.location.protocol === 'file:') {
    return 'http://localhost:3000';
  }

  // 7. Em produção (mesma origem se hospedado junto)
  return '';
}

let BASE_HOST = getBaseHost();
let API_BASE_URL = `${BASE_HOST}/api/movies`;
let AUTH_BASE_URL = `${BASE_HOST}/api/auth`;

function atualizarUrlsApi() {
  BASE_HOST = getBaseHost();
  API_BASE_URL = `${BASE_HOST}/api/movies`;
  AUTH_BASE_URL = `${BASE_HOST}/api/auth`;
}

const STORAGE_AUTH_KEY = 'cinemanager_auth_v1';

// ==========================================================================
// Estado Global da Aplicação
// ==========================================================================
const appState = {
  // Autenticação
  usuario: null, // { id, nome, email }
  token: null, // string JWT
  modoAuth: 'login', // 'login' ou 'cadastro'

  // Filmes e Filtros
  filmes: [],
  filtroBusca: '',
  filtroGenero: '',
  filtroClassificacao: '',
  filmeEmEdicaoId: null,
  filmeParaExcluir: null,
  fotoBase64: '',
  modoFoto: 'url', // 'url' ou 'upload'
};

// ==========================================================================
// Elementos do DOM
// ==========================================================================
const dom = {
  // Cabeçalho e Autenticação
  authActionsGuest: document.getElementById('auth-actions-guest'),
  authActionsUser: document.getElementById('auth-actions-user'),
  btnAbrirLogin: document.getElementById('btn-abrir-login'),
  btnAbrirCadastro: document.getElementById('btn-abrir-cadastro'),
  nomeUsuarioLogado: document.getElementById('nome-usuario-logado'),
  btnLogout: document.getElementById('btn-logout'),

  // Apresentação Visitante (Hero)
  guestHeroSection: document.getElementById('guest-hero-section'),
  btnHeroLogin: document.getElementById('btn-hero-login'),
  btnHeroCadastro: document.getElementById('btn-hero-cadastro'),

  // Seções Protegidas do Usuário
  userControlsSection: document.getElementById('user-controls-section'),
  userStatusBar: document.getElementById('user-status-bar'),

  // Filtros e Busca
  filtroBusca: document.getElementById('filtro-busca'),
  btnLimparBusca: document.getElementById('btn-limpar-busca'),
  filtroGenero: document.getElementById('filtro-genero'),
  filtroClassificacao: document.getElementById('filtro-classificacao'),
  btnResetarFiltros: document.getElementById('btn-resetar-filtros'),
  contadorFilmes: document.getElementById('contador-filmes'),
  totalFilmesTexto: document.getElementById('total-filmes-texto'),

  // Listagem e Estados
  filmesContainer: document.getElementById('filmes-container'),
  loadingState: document.getElementById('loading-state'),
  emptyState: document.getElementById('empty-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  btnTentarNovamente: document.getElementById('btn-tentar-novamente'),
  btnEmptyCadastrar: document.getElementById('btn-empty-cadastrar'),

  // Modal de Autenticação (Login / Cadastro)
  modalAuth: document.getElementById('modal-auth'),
  modalAuthTitulo: document.getElementById('modal-auth-titulo'),
  btnFecharAuth: document.getElementById('btn-fechar-auth'),
  tabLogin: document.getElementById('tab-login'),
  tabCadastro: document.getElementById('tab-cadastro'),

  formLogin: document.getElementById('form-login'),
  loginEmail: document.getElementById('login-email'),
  loginSenha: document.getElementById('login-senha'),
  erroLoginEmail: document.getElementById('erro-login-email'),
  erroLoginSenha: document.getElementById('erro-login-senha'),
  btnSubmitLogin: document.getElementById('btn-submit-login'),
  btnLoginTexto: document.getElementById('btn-login-texto'),
  linkIrParaCadastro: document.getElementById('link-ir-para-cadastro'),

  formCadastro: document.getElementById('form-cadastro'),
  cadastroNome: document.getElementById('cadastro-nome'),
  cadastroEmail: document.getElementById('cadastro-email'),
  cadastroSenha: document.getElementById('cadastro-senha'),
  cadastroSenhaConfirm: document.getElementById('cadastro-senha-confirm'),
  erroCadastroNome: document.getElementById('erro-cadastro-nome'),
  erroCadastroEmail: document.getElementById('erro-cadastro-email'),
  erroCadastroSenha: document.getElementById('erro-cadastro-senha'),
  erroCadastroSenhaConfirm: document.getElementById('erro-cadastro-senha-confirm'),
  btnSubmitCadastro: document.getElementById('btn-submit-cadastro'),
  btnCadastroTexto: document.getElementById('btn-cadastro-texto'),
  linkIrParaLogin: document.getElementById('link-ir-para-login'),

  // Modal de Cadastro/Edição de Filme
  btnNovoFilme: document.getElementById('btn-novo-filme'),
  modalFilme: document.getElementById('modal-filme'),
  modalTitulo: document.getElementById('modal-titulo'),
  btnFecharModal: document.getElementById('btn-fechar-modal'),
  btnCancelarModal: document.getElementById('btn-cancelar-modal'),
  formFilme: document.getElementById('form-filme'),
  filmeId: document.getElementById('filme-id'),
  campoTitulo: document.getElementById('campo-titulo'),
  campoGenero: document.getElementById('campo-genero'),
  campoClassificacao: document.getElementById('campo-classificacao'),
  campoFotoUrl: document.getElementById('campo-foto-url'),
  campoFotoFile: document.getElementById('campo-foto-file'),
  btnSalvarFilme: document.getElementById('btn-salvar-filme'),
  btnSalvarTexto: document.getElementById('btn-salvar-texto'),

  // Abas e Preview de Foto
  tabUrl: document.getElementById('tab-url'),
  tabUpload: document.getElementById('tab-upload'),
  painelUrl: document.getElementById('painel-url'),
  painelUpload: document.getElementById('painel-upload'),
  dropzone: document.getElementById('dropzone'),
  previewContainer: document.getElementById('preview-container'),
  previewImg: document.getElementById('preview-img'),
  btnRemoverFoto: document.getElementById('btn-remover-foto'),

  // Erros de Formulário de Filme
  erroTitulo: document.getElementById('erro-titulo'),
  erroGenero: document.getElementById('erro-genero'),
  erroClassificacao: document.getElementById('erro-classificacao'),
  erroFoto: document.getElementById('erro-foto'),

  // Modal de Exclusão
  modalExcluir: document.getElementById('modal-excluir'),
  nomeFilmeExcluir: document.getElementById('nome-filme-excluir'),
  btnFecharExcluir: document.getElementById('btn-fechar-excluir'),
  btnCancelarExcluir: document.getElementById('btn-cancelar-excluir'),
  btnConfirmarExcluir: document.getElementById('btn-confirmar-excluir'),

  // Toasts
  toastContainer: document.getElementById('toast-container'),

  // Configuração do Servidor / Backend
  btnConfigApi: document.getElementById('btn-config-api'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusText: document.getElementById('api-status-text'),
  modalConfigApi: document.getElementById('modal-config-api'),
  btnFecharConfigApi: document.getElementById('btn-fechar-config-api'),
  inputApiUrl: document.getElementById('input-api-url'),
  apiTestFeedback: document.getElementById('api-test-feedback'),
  btnTestarApi: document.getElementById('btn-testar-api'),
  btnSalvarApi: document.getElementById('btn-salvar-api'),
};

// ==========================================================================
// Funções de Toasts (Notificações Flutuantes)
// ==========================================================================
function showToast(mensagem, tipo = 'info', duracao = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;

  const icones = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  toast.innerHTML = `
    <span class="toast-icon">${icones[tipo] || 'ℹ️'}</span>
    <span class="toast-message">${escapeHtml(mensagem)}</span>
  `;

  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

// Utilitário de escape para prevenir XSS
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// Gerenciamento da Conexão com o Servidor (Backend)
// ==========================================================================
function abrirModalConfigApi() {
  const custom = localStorage.getItem('cinemanager_backend_url') || '';
  if (dom.inputApiUrl) {
    dom.inputApiUrl.value = custom;
  }
  if (dom.apiTestFeedback) {
    dom.apiTestFeedback.textContent = '';
    dom.apiTestFeedback.style.color = 'var(--text-muted)';
  }
  if (dom.modalConfigApi) {
    dom.modalConfigApi.classList.remove('hidden');
    dom.inputApiUrl.focus();
  }
}

function fecharModalConfigApi() {
  if (dom.modalConfigApi) {
    dom.modalConfigApi.classList.add('hidden');
  }
}

async function verificarStatusServidor() {
  if (dom.apiStatusDot) {
    dom.apiStatusDot.className = 'status-dot checking';
  }
  if (dom.apiStatusText) {
    dom.apiStatusText.textContent = 'Servidor...';
  }

  try {
    const host = getBaseHost();
    const endpoint = host ? `${host}/api` : '/api';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      if (dom.apiStatusDot) dom.apiStatusDot.className = 'status-dot online';
      if (dom.apiStatusText) dom.apiStatusText.textContent = 'Servidor Online';
      return true;
    } else {
      if (dom.apiStatusDot) dom.apiStatusDot.className = 'status-dot offline';
      if (dom.apiStatusText) dom.apiStatusText.textContent = 'Servidor Offline';
      return false;
    }
  } catch (err) {
    if (dom.apiStatusDot) dom.apiStatusDot.className = 'status-dot offline';
    if (dom.apiStatusText) dom.apiStatusText.textContent = 'Servidor Offline';
    return false;
  }
}

async function testarConexaoApi() {
  const urlDigitada = dom.inputApiUrl ? dom.inputApiUrl.value.trim().replace(/\/+$/, '') : '';
  const urlParaTestar = urlDigitada || getBaseHost();
  const endpoint = urlParaTestar ? `${urlParaTestar}/api` : '/api';

  if (dom.apiTestFeedback) {
    dom.apiTestFeedback.style.color = '#f59e0b';
    dom.apiTestFeedback.textContent = '🔄 Testando conexão com o servidor...';
  }
  if (dom.btnTestarApi) {
    dom.btnTestarApi.disabled = true;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      if (dom.apiTestFeedback) {
        dom.apiTestFeedback.style.color = '#10b981';
        dom.apiTestFeedback.textContent = '✅ Conexão estabelecida com sucesso!';
      }
      return true;
    } else {
      if (dom.apiTestFeedback) {
        dom.apiTestFeedback.style.color = '#ef4444';
        dom.apiTestFeedback.textContent = `⚠️ Servidor respondeu com status HTTP ${res.status}.`;
      }
      return false;
    }
  } catch (err) {
    if (dom.apiTestFeedback) {
      dom.apiTestFeedback.style.color = '#ef4444';
      dom.apiTestFeedback.textContent = '❌ Não foi possível conectar a esta URL. Verifique se o servidor está ativo.';
    }
    return false;
  } finally {
    if (dom.btnTestarApi) {
      dom.btnTestarApi.disabled = false;
    }
  }
}

async function salvarConfigApi() {
  const novaUrl = dom.inputApiUrl ? dom.inputApiUrl.value.trim().replace(/\/+$/, '') : '';

  if (novaUrl) {
    localStorage.setItem('cinemanager_backend_url', novaUrl);
    showToast('URL do backend configurada com sucesso!', 'success');
  } else {
    localStorage.removeItem('cinemanager_backend_url');
    showToast('Configuração resetada para o padrão automático.', 'info');
  }

  atualizarUrlsApi();
  fecharModalConfigApi();
  await verificarStatusServidor();

  if (appState.token) {
    await carregarFilmes();
  }
}

// ==========================================================================
// Gerenciamento de Autenticação (Login, Cadastro e Sessão)
// ==========================================================================

/**
 * Inicializa a sessão a partir do localStorage
 */
function carregarSessaoSalva() {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    if (data.token && data.usuario) {
      appState.token = data.token;
      appState.usuario = data.usuario;
    }
  } catch (e) {
    console.warn('Erro ao restaurar sessão salva:', e);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  }
}

/**
 * Salva a sessão no localStorage
 */
function salvarSessao(token, usuario) {
  appState.token = token;
  appState.usuario = usuario;
  localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({ token, usuario }));
}

/**
 * Realiza logout do usuário atual
 */
function fazerLogout(sessaoExpirada = false) {
  appState.token = null;
  appState.usuario = null;
  appState.filmes = [];
  localStorage.removeItem(STORAGE_AUTH_KEY);

  atualizarInterfaceAutenticacao();

  if (sessaoExpirada) {
    showToast('Sua sessão expirou. Faça login novamente.', 'info', 4500);
    abrirModalAuth('login');
  } else {
    showToast('Você saiu da sua conta com sucesso.', 'info');
  }
}

/**
 * Atualiza os elementos visuais conforme o usuário esteja logado ou não
 */
function atualizarInterfaceAutenticacao() {
  const isAutenticado = Boolean(appState.token && appState.usuario);

  if (isAutenticado) {
    // Esconde hero de visitante e botões de login/cadastro no topo
    dom.guestHeroSection.classList.add('hidden');
    dom.authActionsGuest.classList.add('hidden');

    // Exibe dados e ações do usuário logado
    dom.authActionsUser.classList.remove('hidden');
    dom.nomeUsuarioLogado.textContent = appState.usuario.nome.split(' ')[0] || appState.usuario.nome;
    dom.nomeUsuarioLogado.title = `${appState.usuario.nome} (${appState.usuario.email})`;

    // Exibe os controles de busca, filtros, contagem e grid de filmes
    dom.userControlsSection.classList.remove('hidden');
    dom.userStatusBar.classList.remove('hidden');
    dom.filmesContainer.classList.remove('hidden');

    // Carrega o acervo exclusivo deste usuário
    carregarFilmes();
  } else {
    // Visitante (não autenticado)
    dom.guestHeroSection.classList.remove('hidden');
    dom.authActionsGuest.classList.remove('hidden');

    dom.authActionsUser.classList.add('hidden');
    dom.userControlsSection.classList.add('hidden');
    dom.userStatusBar.classList.add('hidden');
    dom.filmesContainer.classList.add('hidden');

    // Ocultar estados de loading/empty/error de filmes
    dom.loadingState.classList.add('hidden');
    dom.emptyState.classList.add('hidden');
    dom.errorState.classList.add('hidden');
  }
}

// --------------------------------------------------------------------------
// Modal de Autenticação (Abertura, Troca de Abas e Envio)
// --------------------------------------------------------------------------

function abrirModalAuth(modo = 'login') {
  trocarAbaAuth(modo);
  limparErrosAuth();
  dom.modalAuth.classList.remove('hidden');

  if (modo === 'login') {
    dom.loginEmail.focus();
  } else {
    dom.cadastroNome.focus();
  }
}

function fecharModalAuth() {
  dom.modalAuth.classList.add('hidden');
  dom.formLogin.reset();
  dom.formCadastro.reset();
  limparErrosAuth();
}

function trocarAbaAuth(modo) {
  appState.modoAuth = modo;
  limparErrosAuth();

  if (modo === 'login') {
    dom.modalAuthTitulo.textContent = 'Entrar no CineManager';
    dom.tabLogin.classList.add('active');
    dom.tabLogin.setAttribute('aria-selected', 'true');
    dom.tabCadastro.classList.remove('active');
    dom.tabCadastro.setAttribute('aria-selected', 'false');

    dom.formLogin.classList.remove('hidden');
    dom.formCadastro.classList.add('hidden');
  } else {
    dom.modalAuthTitulo.textContent = 'Criar Minha Conta';
    dom.tabCadastro.classList.add('active');
    dom.tabCadastro.setAttribute('aria-selected', 'true');
    dom.tabLogin.classList.remove('active');
    dom.tabLogin.setAttribute('aria-selected', 'false');

    dom.formCadastro.classList.remove('hidden');
    dom.formLogin.classList.add('hidden');
  }
}

function limparErrosAuth() {
  dom.erroLoginEmail.textContent = '';
  dom.erroLoginSenha.textContent = '';
  dom.erroCadastroNome.textContent = '';
  dom.erroCadastroEmail.textContent = '';
  dom.erroCadastroSenha.textContent = '';
  dom.erroCadastroSenhaConfirm.textContent = '';
}

/**
 * Processa o Login do Usuário
 */
async function processarLogin(e) {
  e.preventDefault();
  limparErrosAuth();

  const email = dom.loginEmail.value.trim();
  const senha = dom.loginSenha.value;

  let temErro = false;
  if (!email) {
    dom.erroLoginEmail.textContent = 'Informe o seu e-mail.';
    temErro = true;
  }
  if (!senha) {
    dom.erroLoginSenha.textContent = 'Informe a sua senha.';
    temErro = true;
  }
  if (temErro) return;

  dom.btnSubmitLogin.disabled = true;
  dom.btnLoginTexto.textContent = 'Entrando...';

  try {
    const res = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Erro ao realizar login.');
    }

    salvarSessao(data.token, data.usuario);
    fecharModalAuth();
    atualizarInterfaceAutenticacao();
    showToast(`Bem-vindo(a) de volta, ${data.usuario.nome}!`, 'success');
  } catch (error) {
    const isNetworkError = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
    const msg = isNetworkError 
      ? 'Erro de conexão com o backend. Verifique se o servidor está ativo ou configure a URL no botão "Servidor" no topo.'
      : error.message;
    dom.erroLoginSenha.textContent = msg;
    showToast(msg, 'error', 5000);
    if (isNetworkError && dom.apiStatusDot) {
      dom.apiStatusDot.className = 'status-dot offline';
      if (dom.apiStatusText) dom.apiStatusText.textContent = 'Servidor Offline';
    }
  } finally {
    dom.btnSubmitLogin.disabled = false;
    dom.btnLoginTexto.textContent = 'Entrar na Conta';
  }
}

/**
 * Processa o Cadastro de Nova Conta
 */
async function processarCadastro(e) {
  e.preventDefault();
  limparErrosAuth();

  const nome = dom.cadastroNome.value.trim();
  const email = dom.cadastroEmail.value.trim();
  const senha = dom.cadastroSenha.value;
  const senhaConfirm = dom.cadastroSenhaConfirm.value;

  let temErro = false;
  if (!nome || nome.length < 2) {
    dom.erroCadastroNome.textContent = 'O nome deve ter no mínimo 2 caracteres.';
    temErro = true;
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    dom.erroCadastroEmail.textContent = 'Informe um endereço de e-mail válido.';
    temErro = true;
  }
  if (!senha || senha.length < 6) {
    dom.erroCadastroSenha.textContent = 'A senha deve ter no mínimo 6 caracteres.';
    temErro = true;
  }
  if (senha !== senhaConfirm) {
    dom.erroCadastroSenhaConfirm.textContent = 'As senhas informadas não coincidem.';
    temErro = true;
  }
  if (temErro) return;

  dom.btnSubmitCadastro.disabled = true;
  dom.btnCadastroTexto.textContent = 'Criando conta...';

  try {
    const res = await fetch(`${AUTH_BASE_URL}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.erros && Array.isArray(data.erros)) {
        throw new Error(data.erros.join(' '));
      }
      throw new Error(data.message || 'Erro ao criar conta.');
    }

    salvarSessao(data.token, data.usuario);
    fecharModalAuth();
    atualizarInterfaceAutenticacao();
    showToast(`Conta criada com sucesso! Olá, ${data.usuario.nome}.`, 'success');
  } catch (error) {
    const isNetworkError = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
    const msg = isNetworkError 
      ? 'Erro de conexão com o backend. Verifique se o servidor está ativo ou configure a URL no botão "Servidor" no topo.'
      : error.message;
    dom.erroCadastroEmail.textContent = msg;
    showToast(msg, 'error', 5000);
    if (isNetworkError && dom.apiStatusDot) {
      dom.apiStatusDot.className = 'status-dot offline';
      if (dom.apiStatusText) dom.apiStatusText.textContent = 'Servidor Offline';
    }
  } finally {
    dom.btnSubmitCadastro.disabled = false;
    dom.btnCadastroTexto.textContent = 'Criar Minha Conta';
  }
}

// ==========================================================================
// Consumo da API de Filmes (Protegida por Token JWT)
// ==========================================================================

/**
 * Busca a lista de filmes do usuário logado
 */
async function carregarFilmes() {
  if (!appState.token) {
    atualizarInterfaceAutenticacao();
    return;
  }

  mostrarEstado('loading');

  try {
    const params = new URLSearchParams();
    if (appState.filtroBusca.trim()) params.append('busca', appState.filtroBusca.trim());
    if (appState.filtroGenero.trim()) params.append('genero', appState.filtroGenero.trim());
    if (appState.filtroClassificacao.trim()) params.append('classificacao', appState.filtroClassificacao.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}${queryString}`, {
      headers: {
        'Authorization': `Bearer ${appState.token}`,
      },
    });

    if (response.status === 401) {
      fazerLogout(true);
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }

    const result = await response.json();
    appState.filmes = result.data || [];

    renderizarCatalogo();
  } catch (error) {
    console.error('Erro ao carregar filmes:', error);
    const isNetworkError = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
    dom.errorMessage.textContent = 
      isNetworkError
        ? 'Não foi possível conectar ao servidor backend. Verifique se o servidor está rodando ou clique no botão "Servidor" no topo para configurar a URL.'
        : error.message;
    if (isNetworkError && dom.apiStatusDot) {
      dom.apiStatusDot.className = 'status-dot offline';
      if (dom.apiStatusText) dom.apiStatusText.textContent = 'Servidor Offline';
    }
    mostrarEstado('error');
  }
}

/**
 * Cadastra ou atualiza um filme do usuário logado
 */
async function salvarFilme(dadosFilme, id = null) {
  if (!appState.token) {
    abrirModalAuth('login');
    showToast('Por favor, faça login para salvar seus filmes.', 'info');
    return;
  }

  const isEdicao = Boolean(id);
  const url = isEdicao ? `${API_BASE_URL}/${id}` : API_BASE_URL;
  const method = isEdicao ? 'PUT' : 'POST';

  setBotaoSalvarLoading(true);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appState.token}`,
      },
      body: JSON.stringify(dadosFilme),
    });

    if (response.status === 401) {
      fazerLogout(true);
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      if (result.erros && Array.isArray(result.erros)) {
        throw new Error(result.erros.join(' '));
      }
      throw new Error(result.message || 'Erro ao processar requisição.');
    }

    showToast(
      isEdicao ? 'Filme atualizado com sucesso!' : 'Filme salvo na sua conta com sucesso!',
      'success'
    );

    fecharModalFilme();
    await carregarFilmes();
  } catch (error) {
    console.error('Erro ao salvar filme:', error);
    showToast(error.message, 'error', 5000);
  } finally {
    setBotaoSalvarLoading(false);
  }
}

/**
 * Remove um filme pertencente ao usuário
 */
async function excluirFilme(id) {
  if (!appState.token) {
    abrirModalAuth('login');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${appState.token}`,
      },
    });

    if (response.status === 401) {
      fazerLogout(true);
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao excluir filme.');
    }

    showToast('Filme excluído da sua conta.', 'success');
    fecharModalExcluir();
    await carregarFilmes();
  } catch (error) {
    console.error('Erro ao excluir filme:', error);
    showToast(error.message, 'error');
  }
}

// ==========================================================================
// Renderização do Catálogo
// ==========================================================================
function renderizarCatalogo() {
  const total = appState.filmes.length;
  dom.contadorFilmes.textContent = `${total} ${total === 1 ? 'filme' : 'filmes'}`;

  if (total === 0) {
    mostrarEstado('empty');
    return;
  }

  mostrarEstado('content');
  dom.filmesContainer.innerHTML = appState.filmes.map(criarCardFilmeHtml).join('');

  // Listeners dos botões de cada card
  document.querySelectorAll('.btn-card-edit').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalEdicao(btn.dataset.id));
  });

  document.querySelectorAll('.btn-card-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const filme = appState.filmes.find((f) => f._id === id);
      abrirModalExclusao(filme || { _id: id, titulo: 'este filme' });
    });
  });
}

function criarCardFilmeHtml(filme) {
  const ratingClass = obterClasseClassificacao(filme.classificacao);
  const ratingText = filme.classificacao === 'Livre' ? 'L' : `${filme.classificacao}`;

  return `
    <article class="movie-card" data-id="${filme._id}">
      <div class="movie-poster-box">
        <img 
          src="${escapeHtml(filme.foto)}" 
          alt="Pôster de ${escapeHtml(filme.titulo)}" 
          class="movie-poster" 
          loading="lazy"
          onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'movie-poster-fallback\\'><span>🎬</span><p>${escapeHtml(filme.titulo)}</p></div>';"
        >
        <div class="poster-badges">
          <span class="badge-genre">${escapeHtml(filme.genero)}</span>
          <span class="badge-rating ${ratingClass}" title="Classificação indicativa: ${escapeHtml(filme.classificacao)}">
            ${ratingText}
          </span>
        </div>
      </div>

      <div class="movie-info">
        <h3 class="movie-title" title="${escapeHtml(filme.titulo)}">${escapeHtml(filme.titulo)}</h3>
        <div class="movie-meta">
          <span>📅 ${formatarData(filme.createdAt)}</span>
        </div>
      </div>

      <div class="movie-actions">
        <button class="btn-card-action btn-card-edit" data-id="${filme._id}" title="Editar informações">
          <span>✏️</span> Editar
        </button>
        <button class="btn-card-action btn-card-delete" data-id="${filme._id}" title="Excluir filme">
          <span>🗑️</span> Excluir
        </button>
      </div>
    </article>
  `;
}

function obterClasseClassificacao(classificacao) {
  const mapa = {
    'Livre': 'rating-livre',
    '10': 'rating-10',
    '12': 'rating-12',
    '14': 'rating-14',
    '16': 'rating-16',
    '18': 'rating-18',
  };
  return mapa[classificacao] || 'rating-livre';
}

function formatarData(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function mostrarEstado(estado) {
  dom.loadingState.classList.add('hidden');
  dom.emptyState.classList.add('hidden');
  dom.errorState.classList.add('hidden');
  dom.filmesContainer.classList.add('hidden');

  if (estado === 'loading') {
    dom.loadingState.classList.remove('hidden');
    dom.contadorFilmes.textContent = 'Carregando...';
  } else if (estado === 'empty') {
    dom.emptyState.classList.remove('hidden');
  } else if (estado === 'error') {
    dom.errorState.classList.remove('hidden');
    dom.contadorFilmes.textContent = 'Erro';
  } else if (estado === 'content') {
    dom.filmesContainer.classList.remove('hidden');
  }
}

// ==========================================================================
// Modais e Formulário de Cadastro/Edição de Filme
// ==========================================================================

function abrirModalNovoFilme() {
  if (!appState.token) {
    abrirModalAuth('login');
    showToast('Faça login ou crie sua conta para cadastrar filmes.', 'info');
    return;
  }

  appState.filmeEmEdicaoId = null;
  dom.modalTitulo.textContent = 'Cadastrar Novo Filme';
  dom.btnSalvarTexto.textContent = 'Salvar Filme';
  dom.formFilme.reset();
  dom.filmeId.value = '';
  limparErrosFormularioFilme();
  removerFotoPreview();
  trocarAbaFoto('url');
  dom.modalFilme.classList.remove('hidden');
  dom.campoTitulo.focus();
}

function abrirModalEdicao(id) {
  const filme = appState.filmes.find((f) => f._id === id);
  if (!filme) return;

  appState.filmeEmEdicaoId = id;
  dom.modalTitulo.textContent = 'Editar Filme';
  dom.btnSalvarTexto.textContent = 'Salvar Alterações';
  limparErrosFormularioFilme();

  dom.filmeId.value = filme._id;
  dom.campoTitulo.value = filme.titulo;
  dom.campoGenero.value = filme.genero;
  dom.campoClassificacao.value = filme.classificacao;

  // Foto existente
  if (filme.foto.startsWith('data:image/')) {
    trocarAbaFoto('upload');
    appState.fotoBase64 = filme.foto;
    atualizarPreviewFoto(filme.foto);
  } else {
    trocarAbaFoto('url');
    dom.campoFotoUrl.value = filme.foto;
    atualizarPreviewFoto(filme.foto);
  }

  dom.modalFilme.classList.remove('hidden');
  dom.campoTitulo.focus();
}

function fecharModalFilme() {
  dom.modalFilme.classList.add('hidden');
  dom.formFilme.reset();
  limparErrosFormularioFilme();
  removerFotoPreview();
  appState.filmeEmEdicaoId = null;
}

function abrirModalExclusao(filme) {
  appState.filmeParaExcluir = filme;
  dom.nomeFilmeExcluir.textContent = `"${filme.titulo}"`;
  dom.modalExcluir.classList.remove('hidden');
}

function fecharModalExcluir() {
  dom.modalExcluir.classList.add('hidden');
  appState.filmeParaExcluir = null;
}

// ==========================================================================
// Gerenciamento de Foto (URL vs Upload Base64)
// ==========================================================================

function trocarAbaFoto(modo) {
  appState.modoFoto = modo;
  if (modo === 'url') {
    dom.tabUrl.classList.add('active');
    dom.tabUrl.setAttribute('aria-selected', 'true');
    dom.tabUpload.classList.remove('active');
    dom.tabUpload.setAttribute('aria-selected', 'false');
    dom.painelUrl.classList.remove('hidden');
    dom.painelUpload.classList.add('hidden');
  } else {
    dom.tabUpload.classList.add('active');
    dom.tabUpload.setAttribute('aria-selected', 'true');
    dom.tabUrl.classList.remove('active');
    dom.tabUrl.setAttribute('aria-selected', 'false');
    dom.painelUpload.classList.remove('hidden');
    dom.painelUrl.classList.add('hidden');
  }
}

function atualizarPreviewFoto(src) {
  if (!src) {
    removerFotoPreview();
    return;
  }
  dom.previewImg.src = src;
  dom.previewContainer.classList.remove('hidden');
  dom.erroFoto.textContent = '';
}

function removerFotoPreview() {
  appState.fotoBase64 = '';
  dom.previewImg.src = '';
  dom.campoFotoUrl.value = '';
  dom.campoFotoFile.value = '';
  dom.previewContainer.classList.add('hidden');
}

function processarArquivoUpload(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    dom.erroFoto.textContent = 'Por favor, selecione apenas arquivos de imagem (PNG, JPG, WEBP).';
    return;
  }

  const MAX_SIZE_MB = 5;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    dom.erroFoto.textContent = `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.`;
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    appState.fotoBase64 = e.target.result;
    atualizarPreviewFoto(appState.fotoBase64);
  };
  reader.onerror = () => {
    dom.erroFoto.textContent = 'Erro ao processar imagem selecionada.';
  };
  reader.readAsDataURL(file);
}

// ==========================================================================
// Validação e Envio do Formulário de Filme
// ==========================================================================

function validarFormularioFilme() {
  limparErrosFormularioFilme();
  let valido = true;

  const titulo = dom.campoTitulo.value.trim();
  const genero = dom.campoGenero.value.trim();
  const classificacao = dom.campoClassificacao.value.trim();

  if (!titulo) {
    dom.erroTitulo.textContent = 'Informe o título do filme.';
    valido = false;
  }

  if (!genero) {
    dom.erroGenero.textContent = 'Selecione um gênero.';
    valido = false;
  }

  if (!classificacao) {
    dom.erroClassificacao.textContent = 'Selecione a classificação indicativa.';
    valido = false;
  }

  let fotoValor = '';
  if (appState.modoFoto === 'url') {
    fotoValor = dom.campoFotoUrl.value.trim();
    if (!fotoValor) {
      dom.erroFoto.textContent = 'Informe o link da foto do pôster.';
      valido = false;
    } else if (!/^https?:\/\/.+/i.test(fotoValor)) {
      dom.erroFoto.textContent = 'A URL da foto deve iniciar com http:// ou https://';
      valido = false;
    }
  } else {
    fotoValor = appState.fotoBase64;
    if (!fotoValor) {
      dom.erroFoto.textContent = 'Faça upload de uma foto de pôster.';
      valido = false;
    }
  }

  return valido ? { titulo, genero, classificacao, foto: fotoValor } : null;
}

function limparErrosFormularioFilme() {
  dom.erroTitulo.textContent = '';
  dom.erroGenero.textContent = '';
  dom.erroClassificacao.textContent = '';
  dom.erroFoto.textContent = '';
}

function setBotaoSalvarLoading(isLoading) {
  dom.btnSalvarFilme.disabled = isLoading;
  dom.btnSalvarTexto.textContent = isLoading
    ? 'Processando...'
    : appState.filmeEmEdicaoId
    ? 'Salvar Alterações'
    : 'Salvar Filme';
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function inicializarEventListeners() {
  // Abertura e troca do modal de autenticação
  dom.btnAbrirLogin.addEventListener('click', () => abrirModalAuth('login'));
  dom.btnAbrirCadastro.addEventListener('click', () => abrirModalAuth('cadastro'));
  dom.btnHeroLogin.addEventListener('click', () => abrirModalAuth('login'));
  dom.btnHeroCadastro.addEventListener('click', () => abrirModalAuth('cadastro'));

  dom.btnFecharAuth.addEventListener('click', fecharModalAuth);
  dom.tabLogin.addEventListener('click', () => trocarAbaAuth('login'));
  dom.tabCadastro.addEventListener('click', () => trocarAbaAuth('cadastro'));

  dom.linkIrParaCadastro.addEventListener('click', () => trocarAbaAuth('cadastro'));
  dom.linkIrParaLogin.addEventListener('click', () => trocarAbaAuth('login'));

  dom.modalAuth.addEventListener('click', (e) => {
    if (e.target === dom.modalAuth) fecharModalAuth();
  });

  // Submissão dos formulários de auth
  dom.formLogin.addEventListener('submit', processarLogin);
  dom.formCadastro.addEventListener('submit', processarCadastro);

  // Logout
  dom.btnLogout.addEventListener('click', () => fazerLogout(false));

  // Modal de Cadastro/Edição de Filme
  dom.btnNovoFilme.addEventListener('click', abrirModalNovoFilme);
  dom.btnEmptyCadastrar.addEventListener('click', abrirModalNovoFilme);
  dom.btnFecharModal.addEventListener('click', fecharModalFilme);
  dom.btnCancelarModal.addEventListener('click', fecharModalFilme);

  dom.modalFilme.addEventListener('click', (e) => {
    if (e.target === dom.modalFilme) fecharModalFilme();
  });

  // Modal de Exclusão
  dom.btnFecharExcluir.addEventListener('click', fecharModalExcluir);
  dom.btnCancelarExcluir.addEventListener('click', fecharModalExcluir);
  dom.modalExcluir.addEventListener('click', (e) => {
    if (e.target === dom.modalExcluir) fecharModalExcluir();
  });
  dom.btnConfirmarExcluir.addEventListener('click', () => {
    if (appState.filmeParaExcluir) {
      excluirFilme(appState.filmeParaExcluir._id);
    }
  });

  // Envio do formulário de filme
  dom.formFilme.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = validarFormularioFilme();
    if (dados) {
      salvarFilme(dados, appState.filmeEmEdicaoId);
    }
  });

  // Abas de tipo de foto
  dom.tabUrl.addEventListener('click', () => trocarAbaFoto('url'));
  dom.tabUpload.addEventListener('click', () => trocarAbaFoto('upload'));

  // Input de URL da foto (preview em tempo real)
  dom.campoFotoUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (/^https?:\/\/.+/i.test(url)) {
      atualizarPreviewFoto(url);
    } else {
      removerFotoPreview();
    }
  });

  // Input File e Drag & Drop
  dom.dropzone.addEventListener('click', () => dom.campoFotoFile.click());
  dom.campoFotoFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processarArquivoUpload(e.target.files[0]);
    }
  });

  dom.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropzone.classList.add('dragover');
  });

  dom.dropzone.addEventListener('dragleave', () => {
    dom.dropzone.classList.remove('dragover');
  });

  dom.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivoUpload(e.dataTransfer.files[0]);
    }
  });

  dom.btnRemoverFoto.addEventListener('click', removerFotoPreview);

  // Filtros e Busca de Filmes
  let debounceTimeout = null;
  dom.filtroBusca.addEventListener('input', (e) => {
    const valor = e.target.value;
    dom.btnLimparBusca.classList.toggle('hidden', !valor);

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      appState.filtroBusca = valor;
      carregarFilmes();
    }, 300);
  });

  dom.btnLimparBusca.addEventListener('click', () => {
    dom.filtroBusca.value = '';
    dom.btnLimparBusca.classList.add('hidden');
    appState.filtroBusca = '';
    carregarFilmes();
  });

  dom.filtroGenero.addEventListener('change', (e) => {
    appState.filtroGenero = e.target.value;
    carregarFilmes();
  });

  dom.filtroClassificacao.addEventListener('change', (e) => {
    appState.filtroClassificacao = e.target.value;
    carregarFilmes();
  });

  dom.btnResetarFiltros.addEventListener('click', () => {
    dom.filtroBusca.value = '';
    dom.btnLimparBusca.classList.add('hidden');
    dom.filtroGenero.value = '';
    dom.filtroClassificacao.value = '';
    appState.filtroBusca = '';
    appState.filtroGenero = '';
    appState.filtroClassificacao = '';
    carregarFilmes();
  });

  // Configuração do Servidor / Backend
  if (dom.btnConfigApi) dom.btnConfigApi.addEventListener('click', abrirModalConfigApi);
  if (dom.btnFecharConfigApi) dom.btnFecharConfigApi.addEventListener('click', fecharModalConfigApi);
  if (dom.btnTestarApi) dom.btnTestarApi.addEventListener('click', testarConexaoApi);
  if (dom.btnSalvarApi) dom.btnSalvarApi.addEventListener('click', salvarConfigApi);

  // Fechar modais com tecla ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.modalAuth && !dom.modalAuth.classList.contains('hidden')) fecharModalAuth();
      if (dom.modalFilme && !dom.modalFilme.classList.contains('hidden')) fecharModalFilme();
      if (dom.modalExcluir && !dom.modalExcluir.classList.contains('hidden')) fecharModalExcluir();
      if (dom.modalConfigApi && !dom.modalConfigApi.classList.contains('hidden')) fecharModalConfigApi();
    }
  });
}

// ==========================================================================
// Inicialização ao carregar a página
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  inicializarEventListeners();
  await carregarEnv();
  carregarSessaoSalva();
  atualizarInterfaceAutenticacao();
  verificarStatusServidor();
});
