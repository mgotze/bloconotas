const token = "SEU_TOKEN_AQUI"; 
const owner = "mgotze";        
const repo = "bloconotas";   
const path = "notes";        

// Monta a URL base para acessar os arquivos via API do GitHub
const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;


const spinner = document.getElementById("spinner");
const noteInput = document.getElementById("noteInput");
const btnSave = document.getElementById("btnSave");


btnSave.addEventListener("click", (e) => {
  e.preventDefault();

  // Pega o texto da nota
  const note = noteInput.value.trim();
  if (!note) {
    alert("Escreva sua anotação antes de salvar.");
    return;
  }
  
  const fileName = "minha-nota.txt";

  saveNoteToGitHub(fileName, note)
    .then(() => {

    })
    .catch((err) => {
      console.error(err);
      alert("Erro ao salvar a nota. Verifique o console para mais detalhes.");
    });
});


function saveNoteToGitHub(fileName, content) {
  spinner.style.display = "block";

  const fileUrl = `${baseUrl}/${fileName}`;

  return fetch(fileUrl, {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
    },
  })
    .then(async (response) => {
      if (response.status === 404) {
        return null;
      } else if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(`Erro ao buscar arquivo: ${errMsg}`);
      } else {
        const data = await response.json();
        return data.sha; 
      }
    })
    .then((sha) => {

      const body = {
        message: `Salvando/atualizando a nota "${fileName}"`, 
        content: btoa(content),
      };

      if (sha) {
        body.sha = sha;
      }
 
      return fetch(fileUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify(body),
      });
    })
    .then((response) => response.json())
    .then((data) => {
      spinner.style.display = "none";

      if (data && data.content) {
        console.log(`Nota ${fileName} salva/atualizada com sucesso!`, data);
        alert(`Nota "${fileName}" salva/atualizada com sucesso!`);
      } else {
        console.error("Erro ao salvar a nota:", data);
        alert("Erro ao salvar a nota. Verifique o console para mais detalhes.");
      }
    })
    .catch((error) => {
      spinner.style.display = "none";
      console.error("Erro ao salvar a nota:", error);
      throw error;
    });
}
