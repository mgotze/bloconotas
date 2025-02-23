let notes = []
let currentNoteIndex = null
let typingTimerTitle
let typingTimerContent
let typingTimerTags
let typingTimerPinned
let filterValue = ''
const doneTypingInterval = 2000
const colorPaletteSize = 60
let darkModeEnabled = false

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
  const noteEditor = document.getElementById('noteEditor')
  const tagsInput = document.getElementById('tagsInput')
  const pinnedInput = document.getElementById('pinnedInput')
  const historyList = document.getElementById('historyList')
  const modeIndicator = document.getElementById('modeIndicator')
  const settingsPanel = document.getElementById('settingsPanel')
  const openSettingsBtn = document.getElementById('openSettingsBtn')
  const closeSettingsBtn = document.getElementById('closeSettingsBtn')
  const darkModeToggle = document.getElementById('darkModeToggle')
  const formatButtons = document.querySelectorAll('.format-btn')
  const colorPaletteDiv = document.getElementById('colorPalette')
  const saveFeedback = document.getElementById('saveFeedback')
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn')

  chrome.storage.sync.get(['notes','darkModeEnabled'], function(result) {
    if (result.notes) {
      notes = result.notes
    }
    if (result.darkModeEnabled === true) {
      darkModeEnabled = true
      document.body.classList.add('dark-mode')
      darkModeToggle.checked = true
    }
    createColorPalette()
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
    modeIndicator.textContent = 'Adicionando nova nota'
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

  openSettingsBtn.addEventListener('click', function() {
    settingsPanel.style.display = 'block'
  })

  closeSettingsBtn.addEventListener('click', function() {
    settingsPanel.style.display = 'none'
  })

  darkModeToggle.addEventListener('change', function() {
    darkModeEnabled = darkModeToggle.checked
    if (darkModeEnabled) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
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
      toggleHistoryBtn.textContent = 'Ocultar Histórico'
    } else {
      historyList.style.display = 'none'
      toggleHistoryBtn.textContent = 'Mostrar Histórico'
    }
  })

  function updateNoteField(field, value) {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      const oldNote = JSON.parse(JSON.stringify(notes[currentNoteIndex]))
      notes[currentNoteIndex][field] = value
      notes[currentNoteIndex].updatedAt = Date.now()
      addHistoryEntry(notes[currentNoteIndex], oldNote)
      saveNotes()
      renderNotes()
      showSaveFeedback()
    }
  }

  function addHistoryEntry(note, oldNote) {
    note.history.push({
      title: oldNote.title,
      content: oldNote.content,
      tags: oldNote.tags,
      color: oldNote.color,
      pinned: oldNote.pinned,
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
      modeIndicator.textContent = 'Editando nota existente'
    })
    return div
  }

  function loadCurrentNote() {
    if (currentNoteIndex !== null && notes[currentNoteIndex]) {
      const n = notes[currentNoteIndex]
      titleInput.value = n.title
      noteEditor.innerHTML = n.content
      tagsInput.value = n.tags.join(', ')
      pinnedInput.checked = n.pinned
      renderHistory(n)
      setActiveSwatch(n.color)
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
        ' | Fixada: ' + (entry.pinned ? 'Sim' : 'Não') +
        ' | Conteúdo: ' + stripHtml(entry.content)
      historyList.appendChild(entryDiv)
    })
  }

  function applyFilters(note) {
    const pinnedOnly = filterPinned.checked
    const dateStartValue = filterDateStart.value
    const dateEndValue = filterDateEnd.value
    const tagsValue = filterTags.value.toLowerCase()
    const colorValue = filterColor.value.toLowerCase()
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

  function createColorPalette() {
    const colors = generateColorArray(colorPaletteSize)
    colors.forEach(color => {
      const swatch = document.createElement('div')
      swatch.className = 'color-swatch'
      swatch.style.backgroundColor = color
      swatch.addEventListener('click', function() {
        updateNoteField('color', color)
        setActiveSwatch(color)
      })
      colorPaletteDiv.appendChild(swatch)
    })
  }

  function setActiveSwatch(color) {
    const swatches = document.querySelectorAll('.color-swatch')
    swatches.forEach(s => {
      const bg = rgbToHex(s.style.backgroundColor)
      if (bg === color.toLowerCase()) {
        s.style.outline = '2px solid #000'
      } else {
        s.style.outline = 'none'
      }
    })
  }

  function generateColorArray(num) {
    const result = []
    for (let i = 0; i < num; i++) {
      const hue = Math.floor((360 / num) * i)
      const saturation = 60 + Math.floor(Math.random() * 40)
      const lightness = 50
      result.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
    }
    return result
  }

  function rgbToHex(rgb) {
    const parts = rgb.replace(/[^\d,]/g, '').split(',')
    let r = parseInt(parts[0]).toString(16)
    let g = parseInt(parts[1]).toString(16)
    let b = parseInt(parts[2]).toString(16)
    if (r.length === 1) r = '0' + r
    if (g.length === 1) g = '0' + g
    if (b.length === 1) b = '0' + b
    return '#' + r + g + b
  }

  function stripHtml(html) {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  }

  function showSaveFeedback() {
    saveFeedback.style.display = 'block'
    setTimeout(() => {
      saveFeedback.style.display = 'none'
    }, 2000)
  }

  function saveNotes() {
    chrome.storage.sync.set({ notes: notes, darkModeEnabled: darkModeEnabled }, function() {})
  }
})
