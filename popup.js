let notes = []
let currentNoteIndex = null
let typingTimer
const doneTypingInterval = 2000

document.addEventListener('DOMContentLoaded', function() {
  const addNoteBtn = document.getElementById('addNoteBtn')
  const noteInput = document.getElementById('noteInput')
  const notesList = document.getElementById('notesList')

  chrome.storage.sync.get(['notes'], function(result) {
    if (result.notes) {
      notes = result.notes
    }
    renderNotes()
  })

  addNoteBtn.addEventListener('click', function() {
    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ano = hoje.getFullYear()
    const novoTitulo = `${dia}/${mes}/${ano}`
    notes.push({ title: novoTitulo, content: '' })
    currentNoteIndex = notes.length - 1
    saveNotes()
    renderNotes()
    noteInput.value = notes[currentNoteIndex].content
    noteInput.focus()
  })

  noteInput.addEventListener('input', function() {
    clearTimeout(typingTimer)
    typingTimer = setTimeout(function() {
      if (currentNoteIndex !== null && notes[currentNoteIndex]) {
        notes[currentNoteIndex].content = noteInput.value
        saveNotes()
      }
    }, doneTypingInterval)
  })

  function renderNotes() {
    notesList.innerHTML = ''
    notes.forEach((note, index) => {
      const div = document.createElement('div')
      div.textContent = note.title
      div.className = 'note-title'
      div.addEventListener('click', function() {
        currentNoteIndex = index
        noteInput.value = notes[index].content
      })
      notesList.appendChild(div)
    })
  }

  function saveNotes() {
    chrome.storage.sync.set({ notes: notes }, function() {})
  }
})
