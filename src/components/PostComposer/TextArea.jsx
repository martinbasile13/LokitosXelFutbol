import { forwardRef, useEffect } from 'react'

const TextArea = forwardRef(({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  isComposerFocused,
  isModal
}, ref) => {
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

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`textarea textarea-ghost w-full resize-none focus:outline-none overflow-hidden transition-all duration-200 ${
        isComposerFocused 
          ? 'min-h-24 md:min-h-32 text-lg md:text-xl placeholder:text-base-content/40' 
          : 'min-h-16 md:min-h-20 text-base md:text-lg'
      }`}
      style={{ 
        minHeight: isComposerFocused ? (window.innerWidth >= 768 ? '128px' : '96px') : (window.innerWidth >= 768 ? '80px' : '64px'),
        maxHeight: isComposerFocused ? '400px' : '200px'
      }}
    />
  )
})

TextArea.displayName = 'TextArea'

export default TextArea