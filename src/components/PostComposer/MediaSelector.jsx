import { Camera, Video, X } from 'lucide-react'
import { validateFile } from '../../services/mediaService'

const MediaSelector = ({
  selectedFile,
  setSelectedFile,
  previewUrl,
  setPreviewUrl,
  isComposerFocused,
  showOnlyButtons = false
}) => {
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validation = validateFile(file, file.type.startsWith('video') ? 'video' : 'image')
      if (validation.valid) {
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        alert(validation.error)
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <>
      {/* Botones para seleccionar archivos - alineados */}
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Botón para imagen */}
        <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group">
          <Camera className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        
        {/* Botón para video */}
        <label className="btn btn-ghost btn-circle btn-sm hover:bg-primary/10 hover:text-primary transition-colors group">
          <Video className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview de archivo - solo mostrar si no es showOnlyButtons */}
      {!showOnlyButtons && previewUrl && (
        <div className="mt-3 md:mt-4 relative flex justify-center">
          {selectedFile?.type.startsWith('image') ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className={`max-w-full object-contain rounded-xl border border-base-300 transition-all duration-300 ${
                isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
              }`}
            />
          ) : (
            <div className={`bg-black rounded-xl transition-all duration-300 ${
              isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
            }`}>
              <video 
                src={previewUrl} 
                controls={false}
                muted
                playsInline
                className={`max-w-full object-contain rounded-xl transition-all duration-300 ${
                  isComposerFocused ? 'max-h-60 md:max-h-80' : 'max-h-40 md:max-h-48'
                }`}
              />
            </div>
          )}
          <button 
            onClick={removeFile}
            className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/60 hover:bg-black/80 border-none text-white backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}

export default MediaSelector