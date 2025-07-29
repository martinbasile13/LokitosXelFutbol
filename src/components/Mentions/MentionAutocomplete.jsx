import { useState, useEffect, useRef } from 'react'
import { searchUsersForMention } from '../../services/mentionsService'
import Avatar from '../UI/Avatar'

const MentionAutocomplete = ({ 
  textareaRef, 
  text, 
  onMentionSelect, 
  isVisible, 
  onClose 
}) => {
  const [users, setUsers] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const autocompleteRef = useRef(null)

  // Detectar cuando se está escribiendo una mención
  useEffect(() => {
    if (!isVisible || !textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = text.substring(0, cursorPosition)
    
    // Buscar la última @ antes del cursor
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/)
    
    if (mentionMatch) {
      const mentionQuery = mentionMatch[1]
      setQuery(mentionQuery)
      
      // Calcular posición del autocomplete
      calculatePosition(textarea, cursorPosition)
      
      // Buscar usuarios si hay query
      if (mentionQuery.length >= 0) {
        searchUsers(mentionQuery)
      }
    } else {
      onClose()
    }
  }, [text, isVisible, textareaRef, onClose])

  // Buscar usuarios
  const searchUsers = async (searchQuery) => {
    try {
      const results = await searchUsersForMention(searchQuery, 5)
      setUsers(results)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error buscando usuarios:', error)
      setUsers([])
    }
  }

  // Calcular posición del autocomplete
  const calculatePosition = (textarea, cursorPosition) => {
    const textBeforeCursor = textarea.value.substring(0, cursorPosition)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length - 1
    const currentColumn = lines[currentLine].length

    // Obtener posición relativa del textarea
    const rect = textarea.getBoundingClientRect()
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
    
    setPosition({
      top: rect.top + (currentLine * lineHeight) + lineHeight + 5,
      left: rect.left + (currentColumn * 8) // Aproximación del ancho de caracter
    })
  }

  // Manejar selección con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible || users.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % users.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          selectUser(users[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, users, selectedIndex, onClose])

  // Seleccionar usuario
  const selectUser = (user) => {
    if (!user || !textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = text.substring(0, cursorPosition)
    const textAfterCursor = text.substring(cursorPosition)
    
    // Encontrar el inicio de la mención
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/)
    if (!mentionMatch) return

    const mentionStart = textBeforeCursor.lastIndexOf('@')
    const beforeMention = textBeforeCursor.substring(0, mentionStart)
    
    // Usar handle primero, si no existe usar username
    const userHandle = user.handle || user.username
    const mention = `@${userHandle}`
    
    // Construir nuevo texto
    const newText = beforeMention + mention + ' ' + textAfterCursor
    const newCursorPosition = beforeMention.length + mention.length + 1

    // Llamar callback con el nuevo texto
    onMentionSelect(newText, newCursorPosition)
    onClose()
  }

  if (!isVisible || users.length === 0) return null

  return (
    <div
      ref={autocompleteRef}
      className="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg max-w-xs w-64"
      style={{
        top: `${position.top}px`,
        left: `${Math.min(position.left, window.innerWidth - 280)}px`
      }}
    >
      <div className="p-2">
        <div className="text-xs text-base-content/60 mb-2 px-2">
          Mencionar usuario
        </div>
        
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
              index === selectedIndex 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-base-200'
            }`}
            onClick={() => selectUser(user)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Avatar
              src={user.avatar_url}
              alt={user.username}
              name={user.username}
              team={user.team}
              size="xs"
            />
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {user.username}
              </div>
              {user.handle && user.handle !== user.username && (
                <div className="text-xs text-base-content/60 truncate">
                  @{user.handle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-base-300 p-2">
        <div className="text-xs text-base-content/60 text-center">
          ↑↓ navegar • Enter seleccionar • Esc cerrar
        </div>
      </div>
    </div>
  )
}

export default MentionAutocomplete