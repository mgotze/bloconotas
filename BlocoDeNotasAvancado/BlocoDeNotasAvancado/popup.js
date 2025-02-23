let db;
let editor = null;
let currentNoteId = null; // ID da nota atualmente em edição
let fixadaAtual = false;  // Armazena se a nota atual está fixada

// ----- ABERTURA E INICIALIZAÇÃO DO IndexedDB -----
function abrirBanco() {
  const request = indexedDB.open('blocoDeNotasAvancado', 1);
  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('notas')) {
      db.createObjectStore('notas', { keyPath: 'id', autoIncrement: true });
    }
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    carregarNotas();
  };
  request.onerror = (event) => {
    console.error('Erro ao abrir banco:', event.target.errorCode);
  };
}

// ----- SALVAR NOTA (NOVA OU EXISTENTE) -----
function salvarNota(id, texto, fixada) {
  const transaction = db.transaction(['notas'], 'readwrite');
  const store = transaction.objectStore('notas');

  // Se for nova, dataCriacao; se existente, reusamos a dataCriacao
  const agora = new Date().toLocaleString();
  if (id) {
    // Precisamos resgatar a nota atual para não perder a dataCriacao original
    const getReq = store.get(id);
    getReq.onsuccess = (evt) => {
      const antiga = evt.target.result;
      const nota = {
        id,
        texto,
        fixada,
        dataCriacao: antiga.dataCriacao,
        dataAtualizacao: agora
      };
      store.put(nota);
    };
  } else {
    // Criar nova nota
    const nota = {
      texto,
      fixada,
      dataCriacao: agora,
      dataAtualizacao: agora
    };
    store.add(nota);
  }

  transaction.oncomplete = () => {
    carregarNotas();
  };
}

// ----- EXCLUIR NOTA -----
function excluirNota(id) {
  if (!id) {
    editor.innerHTML = '';
    currentNoteId = null;
    return;
  }
  if (!confirm('Tem certeza que deseja excluir esta nota?')) {
    return;
  }
  const transaction = db.transaction(['notas'], 'readwrite');
  const store = transaction.objectStore('notas');
  store.delete(id);
  transaction.oncomplete = () => {
    editor.innerHTML = '';
    currentNoteId = null;
    fixadaAtual = false;
    carregarNotas();
  };
}

// ----- CARREGAR TODAS AS NOTAS E EXIBIR -----
function carregarNotas() {
  const transaction = db.transaction(['notas'], 'readonly');
  const store = transaction.objectStore('notas');
  const request = store.getAll();

  request.onsuccess = () => {
    let notas = request.result;

    // Filtro de busca
    const termoBusca = document.getElementById('busca').value.toLowerCase();
    if (termoBusca.trim() !== '') {
      notas = notas.filter((n) => n.texto.toLowerCase().includes(termoBusca));
    }

    // Ordenação
    const ordenacao = document.getElementById('ordenacao').value;
    notas = ordenarNotas(notas, ordenacao);

    // Renderizar
    renderizarListaNotas(notas);
  };
}

// ----- ORDENAR NOTAS SEGUNDO OPÇÃO SELECIONADA -----
function ordenarNotas(notas, criterio) {
  switch (criterio) {
    case 'dataAsc':
      return notas.sort((a, b) =>
        new Date(a.dataCriacao) - new Date(b.dataCriacao)
      );
    case 'dataDesc':
      return notas.sort((a, b) =>
        new Date(b.dataCriacao) - new Date(a.dataCriacao)
      );
    case 'tituloAsc':
      // Considerando que 'texto' pode não ter título, mas faremos substring
      return notas.sort((a, b) =>
        extrairTitulo(a.texto).localeCompare(extrairTitulo(b.texto))
      );
    case 'tituloDesc':
      return notas.sort((a, b) =>
        extrairTitulo(b.texto).localeCompare(extrairTitulo(a.texto))
      );
    default:
      return notas;
  }
}

// Função auxiliar para extrair um possível 'título' (primeiras palavras) do texto
function extrairTitulo(texto) {
  // Remover tags HTML e pegar a primeira linha
  const semHtml = texto.replace(/<[^>]+>/g, '').trim();
  const primeiraLinha = semHtml.split('\n')[0].substring(0, 30);
  return primeiraLinha;
}

// ----- RENDERIZAR LISTA DE NOTAS -----
function renderizarListaNotas(notas) {
  const lista = document.getElementById('listaNotas');
  lista.innerHTML = '';

  // Coloca notas fixadas no topo
  const fixadas = notas.filter((n) => n.fixada);
  const naoFixadas = notas.filter((n) => !n.fixada);
  const notasFinal = [...fixadas, ...naoFixadas];

  notasFinal.forEach((nota) => {
    const li = document.createElement('li');
    // Destacar se for fixada
    if (nota.fixada) {
      li.classList.add('nota-fixada');
    }

    // Criar preview do texto (primeiras palavras)
    const semHtml = nota.texto.replace(/<[^>]+>/g, '');
    const preview = semHtml.length > 40 ? semHtml.substring(0, 40) + '...' : semHtml;
    li.textContent = preview || '(Nota vazia)';

    // Ao clicar, carrega a nota no editor
    li.addEventListener('click', () => carregarNotaParaEdicao(nota));
    lista.appendChild(li);
  });
}

// ----- CARREGAR CONTEÚDO DE UMA NOTA PARA EDIÇÃO -----
function carregarNotaParaEdicao(nota) {
  currentNoteId = nota.id;
  fixadaAtual = nota.fixada;
  editor.innerHTML = nota.texto;
}

// ----- FUNÇÕES DE FORMATAÇÃO DE TEXTO (execCommand) -----
function formatar(comando) {
  document.execCommand(comando, false, null);
}

// ----- ALTERNAR TEMA CLARO/ESCURO -----
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  // Salva em chrome.storage.local ou localStorage, como preferir
  localStorage.setItem('theme', newTheme);
}

// ----- CARREGAR TEMA SALVO -----
function carregarTema() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// ----- INICIALIZAÇÃO DO POPUP -----
document.addEventListener('DOMContentLoaded', () => {
  editor = document.getElementById('editor');

  // Abrir IndexedDB e carregar notas
  abrirBanco();

  // Carregar tema
  carregarTema();

  // LISTENERS DE UI
  document.getElementById('themeSwitch').addEventListener('click', toggleTheme);
  document.getElementById('busca').addEventListener('input', carregarNotas);
  document.getElementById('ordenacao').addEventListener('change', carregarNotas);

  // Toolbar de formatação
  document.getElementById('btnNegrito').addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('btnNegrito').addEventListener('click', () => formatar('bold'));
  document.getElementById('btnItalico').addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('btnItalico').addEventListener('click', () => formatar('italic'));
  document.getElementById('btnSublinhado').addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('btnSublinhado').addEventListener('click', () => formatar('underline'));
  document.getElementById('btnLista').addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('btnLista').addEventListener('click', () => formatar('insertUnorderedList'));

  // Nova nota
  document.getElementById('novaNota').addEventListener('click', () => {
    currentNoteId = null;
    fixadaAtual = false;
    editor.innerHTML = '';
  });

  // Fixar/desfixar nota
  document.getElementById('fixarNota').addEventListener('click', () => {
    if (!editor.innerText.trim()) {
      alert('Não há conteúdo para fixar.');
      return;
    }
    fixadaAtual = !fixadaAtual; // alterna
    salvarNota(currentNoteId, editor.innerHTML, fixadaAtual);
  });

  // Excluir nota
  document.getElementById('excluirNota').addEventListener('click', () => {
    excluirNota(currentNoteId);
  });

  // Salvar automático (debounce de 1 segundo)
  let autoSaveTimer;
  editor.addEventListener('input', () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (editor.innerText.trim()) {
        salvarNota(currentNoteId, editor.innerHTML, fixadaAtual);
      }
    }, 1000);
  });
});
