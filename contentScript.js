// Esse script é injetado em todas as páginas (ver manifest.json).
// Se não quiser a funcionalidade de capturar texto selecionado, pode deixá-lo vazio
// ou remover do manifest. Exemplo simples:

document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    console.log('[Content Script] Texto selecionado:', selection);
    // Opcional: enviar esse texto ao background.js ou ao popup.
    // chrome.runtime.sendMessage({ tipo: 'textoSelecionado', texto: selection });
  }
});
