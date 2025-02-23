document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  const addNoteButton = document.getElementById("add-note");
  addNoteButton.addEventListener("click", addNewNote);
});

function loadNotes(){
  const notes = JSON.parse(localStorage.getItem("bloconotas")) || [];
  notes.forEach(note => {
    const noteElement = createNote(note);
    document.getElementById("notes-container").appendChild(noteElement);
  });
}

function createNote(text = ""){
  const note = document.createElement("textarea");
  note.classList.add("note");
  note.value = text;
  note.placeholder = "Digite sua nota...";
  note.addEventListener("input", saveNotes);
  return note;
}

function addNewNote(){
  const noteElement = createNote();
  document.getElementById("notes-container").appendChild(noteElement);
  noteElement.focus();
  saveNotes();
}

function saveNotes(){
  const notes = document.querySelectorAll(".note");
  const data = [];
  notes.forEach(note => {
    data.push(note.value);
  });
  localStorage.setItem("bloconotas", JSON.stringify(data));
}
