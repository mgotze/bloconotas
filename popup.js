let notes = []
let currentNoteIndex = null
let typingTimerTitle
let typingTimerContent
let typingTimerTags
let typingTimerColor
let typingTimerPinned
let filterValue = ''
const doneTypingInterval = 2000

document.addEventListener('DOMContentLoaded', function() {
  const addNoteBtn = document.getElementById('addNoteBtn')
  const searchInput = document.getElementById('searchInput')
  const filterPinned = document.getElementById('filterPinned')
  const filterDateStart = document.getElementById('filterDateStart')
  const filterDateEnd = document.getElementById('filterDateEnd')
  const filterTags = document.getElementById('filterTags')
  const filterColor = document.getElementById('filterColor')
  const notesList = document.getElementById('notesList')
  const pinnedNotesList = document.getElementById('pinnedNotesList')
  const titleInput = document.getElementById('titleInput')
  const noteInput = document.getElementById('noteInput')
  const tagsInput = document.getElementById('tagsInput')
  const colorInput = document.getElementById('colorInput')
  const pinnedInput = document.getElementById('pinnedInput')
  const historyList = document.getElementById('historyList')

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
    const novoTitulo = dia + '/' + mes + '/' + ano
    const now = Date.now()
    notes.push({
      title: novoTitulo,
      content: '',
      tags: [],
      color: '#ffffff',
      pinned: false,
      createdAt: now,
      updatedAt: now,
      history: []
    })
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

  filterPinned.addEventListener('change', function() {
    renderNotes()
  })

  filterDateStart.addEventListener('change', function() {
    renderNotes()
  })

  filterDateEnd.addEventListener('change', function() {
    renderNotes()
  })

  filterTags.addEventListener('input', function() {
    renderNotes()
  })

  filterColor.addEventListener('input', function() {
    renderNotes()
  })

  titleInput.addEventListener('input', function() {
    clearTimeout(typingTimerTitle)
    typingTimerTitle = setTimeout(function() {
      updateNoteField('title', titleInput.value)
    }, doneTypingInterval)
  })

  noteInput.addEventListener('input', function() {
    clearTimeout(typingTimerContent)
    typingTimerContent = setTimeout(function() {
      updateNoteField('content', noteInput.value)
    }, doneTypingInterval)
  })

  tagsInput.addEventListener('input', function() {
    clearTimeout(typingTimerTags)
    typingTimerTags = setTimeout(function() {
      const tagsArray = tagsInput.value
        .split(',')
        .map(t => t.trim())
        .filter(t => t)
      updateNoteField('tags', tagsArray)
    }, doneTypingInterval)
  })

  colorInput.addEventListener('input', function() {
    clearTimeout(typingTimerColor)
    typingTimerColor = setTimeout(function() {
      updateNoteField('color', colorInput.value)
    }, doneTypingInterval)
  })

  pinnedInput.addEventListener('change', function() {
    clearTimeout(typingTimerPinned)
    typingTimerPinned = setTimeout(function() {
      updateNoteField('pinned', pinnedInput.checked)
    }, doneTypingInterval)
  })

  function updateNoteField(field, value) {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      notes[currentNoteIndex][field] = value
      notes[currentNoteIndex].updatedAt = Date.now()
      addHistoryEntry(notes[currentNoteIndex])
      saveNotes()
      renderNotes()
    }
  }

  function addHistoryEntry(note) {
    note.history.push({
      title: note.title,
      content: note.content,
      tags: note.tags,
      color: note.color,
      pinned: note.pinned,
      timestamp: Date.now()
    })
    if (note.history.length > 50) {
      note.history.shift()
    }
  }

  function renderNotes() {
    pinnedNotesList.innerHTML = ''
    notesList.innerHTML = ''
    const filtered = notes.filter(applyFilters)
    const pinned = filtered.filter(n => n.pinned)
    const unpinned = filtered.filter(n => !n.pinned)
    pinned.forEach(n => pinnedNotesList.appendChild(createNoteDiv(n)))
    unpinned.forEach(n => notesList.appendChild(createNoteDiv(n)))
  }

  function createNoteDiv(note) {
    const index = notes.indexOf(note)
    const div = document.createElement('div')
    div.className = 'note-item'
    if (note.pinned) {
      div.classList.add('note-pinned')
    }
    div.style.backgroundColor = note.color
    const titleDiv = document.createElement('div')
    titleDiv.className = 'note-item-title'
    titleDiv.textContent = note.title
    div.appendChild(titleDiv)
    div.addEventListener('click', function() {
      currentNoteIndex = index
      loadCurrentNote()
    })
    return div
  }

  function loadCurrentNote() {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      const n = notes[currentNoteIndex]
      titleInput.value = n.title
      noteInput.value = n.content
      tagsInput.value = n.tags.join(', ')
      colorInput.value = n.color
      pinnedInput.checked = n.pinned
      renderHistory(n)
    }
  }

  function renderHistory(note) {
    historyList.innerHTML = ''
    note.history.forEach(entry => {
      const d = new Date(entry.timestamp)
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      const hora = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const entryDiv = document.createElement('div')
      entryDiv.className = 'history-entry'
      entryDiv.textContent =
        dia + '/' + mes + '/' + ano + ' ' + hora + ':' + min +
        ' | Título: ' + entry.title +
        ' | Tags: ' + entry.tags.join(', ') +
        ' | Cor: ' + entry.color +
        ' | Fixada: ' + (entry.pinned ? 'Sim' : 'Não')
      historyList.appendChild(entryDiv)
    })
  }

  function applyFilters(note) {
    const text = searchInput.value.toLowerCase()
    const pinnedOnly = filterPinned.checked
    const dateStartValue = filterDateStart.value
    const dateEndValue = filterDateEnd.value
    const tagsValue = filterTags.value.toLowerCase()
    const colorValue = filterColor.value.toLowerCase()
    if (pinnedOnly && !note.pinned) {
      return false
    }
    if (text) {
      const inTitle = note.title.toLowerCase().includes(text)
      const inContent = note.content.toLowerCase().includes(text)
      const inTags = note.tags.join(',').toLowerCase().includes(text)
      if (!inTitle && !inContent && !inTags) {
        return false
      }
    }
    if (tagsValue) {
      const tagsArray = tagsValue.split(',').map(t => t.trim())
      const hasAllTags = tagsArray.every(t => note.tags.map(x => x.toLowerCase()).includes(t))
      if (!hasAllTags) {
        return false
      }
    }
    if (colorValue) {
      if (!note.color.toLowerCase().includes(colorValue)) {
        return false
      }
    }
    if (dateStartValue) {
      const startTime = new Date(dateStartValue).getTime()
      if (note.createdAt < startTime) {
        return false
      }
    }
    if (dateEndValue) {
      const endTime = new Date(dateEndValue).getTime() + 86399999
      if (note.createdAt > endTime) {
        return false
      }
    }
    return true
  }

  function saveNotes() {
    chrome.storage.sync.set({ notes: notes }, function() {})
  }
})
