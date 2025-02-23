let notes = []
let currentNoteIndex = null
let typingTimerTitle
let typingTimerContent
let filterValue = ''
const doneTypingInterval = 2000

document.addEventListener('DOMContentLoaded', function() {
  const addNoteBtn = document.getElementById('addNoteBtn')
  const searchInput = document.getElementById('searchInput')
  const titleInput = document.getElementById('titleInput')
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
    loadCurrentNote()
    titleInput.focus()
  })

  searchInput.addEventListener('input', function() {
    filterValue = searchInput.value
    renderNotes()
  })

  titleInput.addEventListener('input', function() {
    clearTimeout(typingTimerTitle)
    typingTimerTitle = setTimeout(function() {
      if (currentNoteIndex !== null && notes[currentNoteIndex]) {
        notes[currentNoteIndex].title = titleInput.value
        saveNotes()
        renderNotes()
      }
    }, doneTypingInterval)
  })

  noteInput.addEventListener('input', function() {
    clearTimeout(typingTimerContent)
    typingTimerContent = setTimeout(function() {
      if (currentNoteIndex !== null && notes[currentNoteIndex]) {
        notes[currentNoteIndex].content = noteInput.value
        saveNotes()
      }
    }, doneTypingInterval)
  })

  function renderNotes() {
    notesList.innerHTML = ''
    const filteredNotes = notes.filter((note) =>
      note.title.toLowerCase().includes(filterValue.toLowerCase()) ||
      note.content.toLowerCase().includes(filterValue.toLowerCase())
    )
    filteredNotes.forEach((note, index) => {
      const div = document.createElement('div')
      div.className = 'note-title'
      div.textContent = note.title
      div.addEventListener('click', function() {
        const realIndex = notes.indexOf(note)
        currentNoteIndex = realIndex
        loadCurrentNote()
      })
      notesList.appendChild(div)
    })
  }

  function loadCurrentNote() {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      titleInput.value = notes[currentNoteIndex].title
      noteInput.value = notes[currentNoteIndex].content
    }
  }

  function saveNotes() {
    chrome.storage.sync.set({ notes: notes }, function() {})
  }
})
