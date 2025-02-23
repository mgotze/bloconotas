console.log('Background script inicializado.');

/*
  Caso queira funcionalidades extras (alarms, context menu, etc.),
  você pode implementar aqui. Por exemplo:
  
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Bloco de Notas instalado!');
    // Exemplo: criar menu de contexto
    chrome.contextMenus.create({
      id: 'salvarTexto',
      title: 'Salvar texto no bloco de notas',
      contexts: ['selection']
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'salvarTexto') {
      console.log('Texto selecionado:', info.selectionText);
      // Você poderia enviar o texto para o popup ou salvá-lo direto no IndexedDB
      // Por ex., enviar mensagem ao popup ou content script
    }
  });
*/
