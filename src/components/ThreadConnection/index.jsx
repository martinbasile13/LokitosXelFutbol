import { CornerDownRight } from 'lucide-react'

const ThreadConnection = ({ 
  level = 0, 
  isLast = false, 
  hasChildren = false,
  showVerticalLine = true,
  parentUsername = null 
}) => {
  // No mostrar conexión para el primer nivel (replies directas al post principal)
  if (level === 0) {
    return null
  }

  return (
    <div className="flex items-start space-x-2 py-2 px-4 border-l-2 border-gray-200">
      {/* Línea de conexión visual */}
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <CornerDownRight className="w-4 h-4 text-gray-400" />
        {parentUsername && (
          <span className="text-xs">
            Respondiendo a <span className="text-blue-500 font-medium">@{parentUsername}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default ThreadConnection