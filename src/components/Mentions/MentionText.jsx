import React from 'react'
import { Link } from 'react-router-dom'

const MentionText = ({ text, className = '', disableLinks = false }) => {
  if (!text) return null

  // Regex para encontrar menciones @username
  const mentionRegex = /(@[a-zA-Z0-9_-]+)/g
  const parts = text.split(mentionRegex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(mentionRegex)) {
          const username = part.substring(1) // Remover el @
          
          // Si los enlaces están deshabilitados, solo mostrar como texto azul
          if (disableLinks) {
            return (
              <span
                key={index}
                className="text-[#1DA1F2] font-medium cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Navegar manualmente sin crear un enlace HTML
                  window.location.href = `/user/${username.toLowerCase()}`
                }}
              >
                {part}
              </span>
            )
          }
          
          // Si los enlaces están habilitados, crear enlace clickeable normal
          return (
            <Link
              key={index}
              to={`/user/${username.toLowerCase()}`}
              className="text-[#1DA1F2] hover:text-blue-600 hover:underline font-medium transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Evitar que se propague al PostCard
              }}
            >
              {part}
            </Link>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}

export default MentionText