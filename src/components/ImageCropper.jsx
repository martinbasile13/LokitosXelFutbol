import React, { useState, useRef, useCallback } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, RotateCcw, Check } from 'lucide-react'

const ImageCropper = ({ 
  src, 
  onCropComplete, 
  onCancel, 
  type = 'avatar', // 'avatar' o 'cover'
  isOpen = false 
}) => {
  const imgRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()

  // Medidas específicas según el tipo
  const cropConfig = {
    avatar: {
      width: 400,
      height: 400,
      aspectRatio: 1,
      title: 'Editar foto de perfil',
      subtitle: 'Medidas recomendadas: 400x400px (cuadrada)',
      description: 'Tu foto de perfil se verá así en tu perfil y junto a tus posts.'
    },
    cover: {
      width: 1500,
      height: 500,
      aspectRatio: 3,
      title: 'Editar foto de portada',
      subtitle: 'Medidas recomendadas: 1500x500px (3:1)',
      description: 'Tu foto de portada se mostrará en la parte superior de tu perfil.'
    }
  }

  const config = cropConfig[type]

  // Configurar crop inicial cuando se carga la imagen
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    
    let cropWidth, cropHeight, x, y

    if (type === 'avatar') {
      // Para avatar: crop cuadrado centrado
      const size = Math.min(width, height)
      cropWidth = size
      cropHeight = size
      x = (width - size) / 2
      y = (height - size) / 2
    } else {
      // Para portada: crop 3:1 centrado
      const targetRatio = 3
      if (width / height > targetRatio) {
        // Imagen más ancha - ajustar por altura
        cropHeight = height
        cropWidth = height * targetRatio
        x = (width - cropWidth) / 2
        y = 0
      } else {
        // Imagen más alta - ajustar por ancho
        cropWidth = width
        cropHeight = width / targetRatio
        x = 0
        y = (height - cropHeight) / 2
      }
    }

    const newCrop = {
      unit: 'px',
      x,
      y,
      width: cropWidth,
      height: cropHeight,
    }

    setCrop(newCrop)
    setCompletedCrop(newCrop)
  }, [type])

  // Generar el canvas con la imagen recortada
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return
    }

    const image = imgRef.current
    const canvas = previewCanvasRef.current
    const crop = completedCrop

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext('2d')

    // Configurar el canvas con las medidas finales
    canvas.width = config.width
    canvas.height = config.height

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      config.width,
      config.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${type}-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(file)
        }
      }, 'image/jpeg', 0.9)
    })
  }, [completedCrop, config, type])

  const handleSave = async () => {
    const croppedFile = await generateCroppedImage()
    if (croppedFile) {
      onCropComplete(croppedFile)
    }
  }

  const resetCrop = () => {
    if (imgRef.current) {
      onImageLoad({ currentTarget: imgRef.current })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-base-100 rounded-2xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div>
            <h3 className="text-xl font-bold">{config.title}</h3>
            <p className="text-sm text-base-content/70 mt-1">{config.subtitle}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetCrop}
              className="btn btn-ghost btn-sm"
              title="Restablecer recorte"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="btn btn-ghost btn-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área de recorte */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-lg overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={config.aspectRatio}
                  minWidth={100}
                  minHeight={type === 'avatar' ? 100 : 33}
                  keepSelection
                  className="max-w-full max-h-[60vh]"
                >
                  <img
                    ref={imgRef}
                    alt="Imagen a recortar"
                    src={src}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[60vh] object-contain"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </ReactCrop>
              </div>
            </div>

            {/* Panel de vista previa */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Vista previa</h4>
                <p className="text-sm text-base-content/70 mb-4">
                  {config.description}
                </p>
              </div>

              {/* Vista previa del avatar */}
              {type === 'avatar' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-base-content/70 mb-2">En tu perfil:</p>
                    <div className="flex items-center space-x-3 p-3 bg-base-200 rounded-lg">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-base-300 border-2 border-base-100">
                        {completedCrop && (
                          <canvas
                            ref={previewCanvasRef}
                            className="w-full h-full object-cover"
                            style={{ width: '64px', height: '64px' }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">Tu nombre</div>
                        <div className="text-sm text-base-content/70">@tuusuario</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-base-content/70 mb-2">En tus posts:</p>
                    <div className="flex items-start space-x-3 p-3 bg-base-200 rounded-lg">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-base-300">
                        {completedCrop && (
                          <canvas
                            className="w-full h-full object-cover"
                            style={{ width: '40px', height: '40px' }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm">Tu nombre</span>
                          <span className="text-xs text-base-content/70">@tuusuario</span>
                        </div>
                        <p className="text-sm mt-1">Así se verá tu avatar en los posts...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista previa de la portada */}
              {type === 'cover' && (
                <div>
                  <p className="text-xs text-base-content/70 mb-2">En tu perfil:</p>
                  <div className="bg-base-200 rounded-lg overflow-hidden">
                    <div className="h-24 bg-base-300 relative overflow-hidden">
                      {completedCrop && (
                        <canvas
                          ref={previewCanvasRef}
                          className="w-full h-full object-cover"
                          style={{ width: '100%', height: '96px' }}
                        />
                      )}
                    </div>
                    <div className="p-3 relative">
                      <div className="w-12 h-12 rounded-full bg-primary -mt-8 border-2 border-base-200 mb-2"></div>
                      <div className="font-semibold">Tu nombre</div>
                      <div className="text-sm text-base-content/70">@tuusuario</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información técnica */}
              <div className="bg-base-200 rounded-lg p-3">
                <h5 className="font-medium text-sm mb-2">Información técnica</h5>
                <div className="text-xs text-base-content/70 space-y-1">
                  <div>• Medidas finales: {config.width}x{config.height}px</div>
                  <div>• Proporción: {config.aspectRatio}:1</div>
                  <div>• Formato: JPEG</div>
                  <div>• Calidad: Alta (90%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-4 border-t border-base-300">
          <div className="text-sm text-base-content/70">
            Arrastra los bordes para ajustar el recorte
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="btn btn-outline btn-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              disabled={!completedCrop}
            >
              <Check className="w-4 h-4 mr-1" />
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper