let notes = []
let currentNoteIndex = null
let typingTimerTitle
let typingTimerContent
let typingTimerTags
let typingTimerPinned
let filterValue = ''
const doneTypingInterval = 2000
let darkModeEnabled = false

document.addEventListener('DOMContentLoaded', function() {
  const addNoteBtn = document.getElementById('addNoteBtn')
  const searchInput = document.getElementById('searchInput')
  const filterPinned = document.getElementById('filterPinned')
  const filterDateStart = document.getElementById('filterDateStart')
  const filterDateEnd = document.getElementById('filterDateEnd')
  const filterTags = document.getElementById('filterTags')
  const notesList = document.getElementById('notesList')
  const pinnedNotesList = document.getElementById('pinnedNotesList')
  const titleInput = document.getElementById('titleInput')
  const noteEditor = document.getElementById('noteEditor')
  const tagsInput = document.getElementById('tagsInput')
  const pinnedInput = document.getElementById('pinnedInput')
  const historyList = document.getElementById('historyList')
  const modeIndicator = document.getElementById('modeIndicator')
  const openSettingsBtn = document.getElementById('openSettingsBtn')
  const closeSettingsBtn = document.getElementById('closeSettingsBtn')
  const noteOptionsSelect = document.getElementById('noteOptions')
  const saveFeedback = document.getElementById('saveFeedback')
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn')
  const settingsPanel = document.getElementById('settingsPanel')
  const darkModeToggle = document.getElementById('darkModeToggle')
  const formatButtons = document.querySelectorAll('.format-btn')
  const appContainer = document.getElementById('appContainer')
  const appHeader = document.getElementById('appHeader')
  const leftPanel = document.getElementById('leftPanel')
  const rightPanel = document.getElementById('rightPanel')
  const removeNoteBtn = document.getElementById('removeNoteBtn')
  const bgColorSelect = document.getElementById('bgColorSelect')
  const titleColorSelect = document.getElementById('titleColorSelect')
  const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'))
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')
  const historyModal = new bootstrap.Modal(document.getElementById('historyModal'))
  const historyModalBody = document.getElementById('historyModalBody')

  chrome.storage.sync.get(['notes','darkModeEnabled'], function(result) {
    if (result.notes) {
      notes = result.notes
    }
    if (result.darkModeEnabled === true) {
      darkModeEnabled = true
      enableDarkMode(true)
      darkModeToggle.checked = true
    }
    renderNotes()
  })

  addNoteBtn.addEventListener('click', function() {
    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ano = hoje.getFullYear()
    const now = Date.now()
    const novoTitulo = dia + '/' + mes + '/' + ano

    notes.push({
      title: novoTitulo,
      content: '',
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      history: [],
      noteOption: '',
      bgColor: '#ffffff',
      titleColor: '#000000'
    })
    currentNoteIndex = notes.length - 1
    saveNotes()
    renderNotes()
    loadCurrentNote()
    modeIndicator.textContent = 'Adicionando nova nota'
    titleInput.focus()
  })

  removeNoteBtn.addEventListener('click', function() {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      confirmDeleteModal.show()
    }
  })

  confirmDeleteBtn.addEventListener('click', function() {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      notes.splice(currentNoteIndex, 1)
      currentNoteIndex = null
      saveNotes()
      renderNotes()
      clearFields()
    }
    confirmDeleteModal.hide()
  })

  openSettingsBtn.addEventListener('click', function() {
    settingsPanel.style.display = 'block'
  })

  closeSettingsBtn.addEventListener('click', function() {
    settingsPanel.style.display = 'none'
  })

  darkModeToggle.addEventListener('change', function() {
    darkModeEnabled = darkModeToggle.checked
    enableDarkMode(darkModeEnabled)
    chrome.storage.sync.set({ darkModeEnabled: darkModeEnabled }, function() {})
  })

  formatButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const cmd = btn.getAttribute('data-cmd')
      document.execCommand(cmd, false, null)
      noteEditor.focus()
    })
  })

  toggleHistoryBtn.addEventListener('click', function() {
    if (historyList.style.display === 'none') {
      historyList.style.display = 'block'
      toggleHistoryBtn.textContent = 'Ocultar'
    } else {
      historyList.style.display = 'none'
      toggleHistoryBtn.textContent = 'Mostrar'
    }
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

  titleInput.addEventListener('input', function() {
    clearTimeout(typingTimerTitle)
    typingTimerTitle = setTimeout(function() {
      updateNoteField('title', titleInput.value)
    }, doneTypingInterval)
  })

  noteEditor.addEventListener('input', function() {
    clearTimeout(typingTimerContent)
    typingTimerContent = setTimeout(function() {
      updateNoteField('content', noteEditor.innerHTML)
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

  pinnedInput.addEventListener('change', function() {
    clearTimeout(typingTimerPinned)
    typingTimerPinned = setTimeout(function() {
      updateNoteField('pinned', pinnedInput.checked)
    }, doneTypingInterval)
  })

  noteOptionsSelect.addEventListener('change', function() {
    updateNoteField('noteOption', noteOptionsSelect.value)
  })

  bgColorSelect.addEventListener('change', function() {
    updateNoteField('bgColor', bgColorSelect.value)
  })

  titleColorSelect.addEventListener('change', function() {
    updateNoteField('titleColor', titleColorSelect.value)
  })

  function loadCurrentNote() {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      const n = notes[currentNoteIndex]
      titleInput.value = n.title
      noteEditor.innerHTML = n.content
      tagsInput.value = n.tags.join(', ')
      pinnedInput.checked = n.pinned
      noteOptionsSelect.value = n.noteOption || ''
      bgColorSelect.value = n.bgColor || '#ffffff'
      titleColorSelect.value = n.titleColor || '#000000'
      modeIndicator.textContent = 'Editando nota existente'
      renderHistory(n)
    }
  }

  function clearFields() {
    titleInput.value = ''
    noteEditor.innerHTML = ''
    tagsInput.value = ''
    pinnedInput.checked = false
    noteOptionsSelect.value = ''
    bgColorSelect.value = '#ffffff'
    titleColorSelect.value = '#000000'
    historyList.innerHTML = ''
    modeIndicator.textContent = 'Adicionando nova nota'
  }

  function enableDarkMode(enable) {
    if (enable) {
      appContainer.classList.add('dark-mode')
      appHeader.classList.add('dark-mode')
      leftPanel.classList.add('dark-mode')
      rightPanel.classList.add('dark-mode')
      settingsPanel.classList.add('dark-mode')
    } else {
      appContainer.classList.remove('dark-mode')
      appHeader.classList.remove('dark-mode')
      leftPanel.classList.remove('dark-mode')
      rightPanel.classList.remove('dark-mode')
      settingsPanel.classList.remove('dark-mode')
    }
  }

  function updateNoteField(field, value) {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      const oldContent = notes[currentNoteIndex].content
      notes[currentNoteIndex][field] = value
      notes[currentNoteIndex].updatedAt = Date.now()
      if (field === 'content') {
        addHistoryEntry(notes[currentNoteIndex], oldContent)
      }
      saveNotes()
      renderNotes()
      showSaveFeedback()
    }
  }

  function addHistoryEntry(note, oldContent) {
    note.history.push({
      timestamp: Date.now(),
      content: note.content
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
    div.style.backgroundColor = note.bgColor
    const titleDiv = document.createElement('div')
    titleDiv.className = 'note-item-title'
    titleDiv.style.color = note.titleColor
    titleDiv.textContent = note.title
    div.appendChild(titleDiv)
    div.addEventListener('click', function() {
      currentNoteIndex = index
      loadCurrentNote()
    })
    return div
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
      entryDiv.textContent = dia + '/' + mes + '/' + ano + ' ' + hora + ':' + min
      entryDiv.addEventListener('click', function(e) {
        e.stopPropagation()
        historyModalBody.textContent = stripHtml(entry.content)
        historyModal.show()
      })
      historyList.appendChild(entryDiv)
    })
  }

  function applyFilters(note) {
    const pinnedOnly = filterPinned.checked
    const dateStartValue = filterDateStart.value
    const dateEndValue = filterDateEnd.value
    const tagsValue = filterTags.value.toLowerCase()
    if (pinnedOnly && !note.pinned) {
      return false
    }
    if (filterValue) {
      const inTitle = note.title.toLowerCase().includes(filterValue.toLowerCase())
      const inContent = note.content.toLowerCase().includes(filterValue.toLowerCase())
      const inTags = note.tags.join(',').toLowerCase().includes(filterValue.toLowerCase())
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

  function stripHtml(html) {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  }

  function showSaveFeedback() {
    saveFeedback.classList.remove('d-none')
    setTimeout(() => {
      saveFeedback.classList.add('d-none')
    }, 1500)
  }

  function saveNotes() {
    chrome.storage.sync.set({ notes: notes, darkModeEnabled: darkModeEnabled }, function() {})
  }
})
