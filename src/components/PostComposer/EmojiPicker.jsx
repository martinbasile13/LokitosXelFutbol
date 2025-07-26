import { useState, useEffect, useRef } from 'react'
import { Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

const EmojiPickerComponent = ({
  onEmojiSelect,
  textareaRef,
  size = 'md'
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef(null)

  const onEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji
    onEmojiSelect(emoji)
    setShowEmojiPicker(false)
  }

  // Cerrar emoji picker cuando se hace click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative">
      {/* Botón para emojis */}
      <button 
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className={`btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group ${
          size === 'sm' ? 'btn-xs' : ''
        }`}
      >
        <Smile className={`group-hover:scale-110 transition-transform ${
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'
        }`} />
      </button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className="absolute top-full left-0 z-50 mt-2"
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            width={size === 'sm' ? 280 : 300}
            height={size === 'sm' ? 350 : 400}
            theme={document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'}
            previewConfig={{
              showPreview: false
            }}
            skinTonesDisabled
          />
        </div>
      )}
    </div>
  )
}

export default EmojiPickerComponent