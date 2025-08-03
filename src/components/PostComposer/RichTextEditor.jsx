import { forwardRef, useEffect, useRef } from 'react'

const RichTextEditor = forwardRef(({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  isComposerFocused,
  isModal,
  compact = false
}, ref) => {
  const overlayRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value, ref])

  // Auto-focus si es modal
  useEffect(() => {
    if (isModal && ref.current) {
      ref.current.focus()
    }
  }, [isModal, ref])

  // Sincronizar scroll entre textarea y overlay
  const handleScroll = () => {
    if (ref.current && overlayRef.current) {
      overlayRef.current.scrollTop = ref.current.scrollTop
      overlayRef.current.scrollLeft = ref.current.scrollLeft
    }
  }

  // Calcular alturas dinámicamente según el modo
  const getMinHeight = () => {
    if (compact) {
      return isComposerFocused ? '80px' : '60px'
    }
    return isComposerFocused 
      ? (window.innerWidth >= 768 ? '128px' : '96px') 
      : (window.innerWidth >= 768 ? '80px' : '64px')
  }

  const getMaxHeight = () => {
    if (compact) {
      return '200px'
    }
    return isComposerFocused ? '400px' : '200px'
  }

  // Función para renderizar el texto con menciones resaltadas
  const renderTextWithMentions = (text) => {
    if (!text) return ''
    
    // Escapar HTML
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Solo resaltar menciones, el resto del texto mantiene color normal
    return escaped.replace(
      /(@[a-zA-Z0-9_-]+)/g,
      '<span style="color: #1DA1F2; font-weight: 500;">$1</span>'
    )
  }

  const sharedStyle = {
    minHeight: getMinHeight(),
    maxHeight: getMaxHeight(),
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    padding: '12px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  }

  const sharedClasses = `w-full resize-none focus:outline-none overflow-hidden transition-all duration-200 border-none bg-transparent ${
    compact 
      ? 'min-h-16 text-sm md:text-base placeholder:text-base-content/40'
      : isComposerFocused 
        ? 'min-h-24 md:min-h-32 text-lg md:text-xl placeholder:text-base-content/40' 
        : 'min-h-16 md:min-h-20 text-base md:text-lg'
  }`

  return (
    <div className="relative">
      {/* Capa de fondo con texto resaltado - solo visible cuando hay texto */}
      {value && (
        <div 
          ref={overlayRef}
          className={`absolute inset-0 pointer-events-none z-10 ${sharedClasses} text-base-content`}
          style={sharedStyle}
          dangerouslySetInnerHTML={{ 
            __html: renderTextWithMentions(value) 
          }}
        />
      )}
      
      {/* Textarea normal - ahora siempre visible cuando no hay overlay */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onScroll={handleScroll}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        className={`relative ${value ? 'text-transparent' : 'text-current'} ${value ? 'z-20' : 'z-30'} ${sharedClasses}`}
        style={{ 
          ...sharedStyle,
          caretColor: 'currentColor' // Mantener el cursor visible
        }}
      />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor