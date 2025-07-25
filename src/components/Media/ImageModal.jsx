import { X, Download, ExternalLink } from 'lucide-react'

const ImageModal = ({ isOpen, onClose, imageUrl, alt = "Imagen" }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = 'imagen.jpg'
    link.click()
  }

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank')
  }

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-md bg-black/60 p-4"
      onClick={handleOverlayClick}
    >
      {/* Header con controles */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={handleDownload}
          className="btn btn-circle btn-sm bg-black/50 hover:bg-black/70 border-none text-white backdrop-blur-sm"
          title="Descargar imagen"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleOpenInNewTab}
          className="btn btn-circle btn-sm bg-black/50 hover:bg-black/70 border-none text-white backdrop-blur-sm"
          title="Abrir en nueva pestaña"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="btn btn-circle btn-sm bg-black/50 hover:bg-black/70 border-none text-white backdrop-blur-sm"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Imagen principal - Con mejor presentación */}
      <div className="relative flex items-center justify-center max-w-full max-h-full">
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>

      {/* Indicador para cerrar - Más elegante */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
        Presiona ESC o haz click fuera para cerrar
      </div>
    </div>
  )
}

export default ImageModal