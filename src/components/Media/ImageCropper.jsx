import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react'

const ImageCropper = ({ 
  src, 
  onCropComplete, 
  onCancel, 
  type = 'avatar',
  isOpen = false 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const cropperRef = useRef(null)
  const aspectRatio = type === 'avatar' ? 1 : 16 / 9

  const onCropChange = useCallback((crop) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', error => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getRadianAngle = (degreeValue) => {
    return (degreeValue * Math.PI) / 180
  }

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation)
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
  }

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    const rotRad = getRadianAngle(rotation)
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation)

    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.translate(-image.width / 2, -image.height / 2)
    ctx.drawImage(image, 0, 0)

    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')

    if (!croppedCtx) return null

    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height

    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise((resolve) => {
      croppedCanvas.toBlob((file) => {
        resolve(file)
      }, 'image/jpeg', 0.9)
    })
  }

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return

    try {
      setIsProcessing(true)
      const croppedImage = await getCroppedImg(src, croppedAreaPixels, rotation)
      
      if (croppedImage) {
        const fileName = type === 'avatar' ? 'avatar.jpg' : 'cover.jpg'
        const file = new File([croppedImage], fileName, { type: 'image/jpeg' })
        onCropComplete(file)
      }
    } catch (error) {
      console.error('Error recortando imagen:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 1))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm">
      {/* Layout móvil usando 100dvh */}
      <div 
        className="flex flex-col w-full h-full"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        {/* Header fijo */}
        <div className="flex-shrink-0 bg-base-100 border-b border-base-300 px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <button 
                onClick={onCancel}
                className="btn btn-ghost btn-circle btn-sm"
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base md:text-lg font-bold">
                {type === 'avatar' ? 'Recortar Avatar' : 'Recortar Portada'}
              </h3>
            </div>
            
            <button 
              onClick={handleApplyCrop}
              className="btn btn-primary btn-sm rounded-full px-3 md:px-4"
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="hidden sm:inline ml-1">Procesando</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Aplicar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Área del cropper - flexible */}
        <div className="flex-1 bg-black relative min-h-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Cropper
              ref={cropperRef}
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteHandler}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000'
                }
              }}
            />
          </div>
        </div>

        {/* Controles fijos abajo */}
        <div className="flex-shrink-0 bg-base-100 border-t border-base-300 p-2 md:p-3">
          {/* Controles en una sola fila en móvil */}
          <div className="flex items-center justify-between gap-2">
            {/* Zoom controls */}
            <div className="flex items-center space-x-1 md:space-x-2 flex-1 max-w-xs">
              <button 
                onClick={handleZoomOut}
                className="btn btn-circle btn-xs md:btn-sm btn-outline"
                disabled={isProcessing || zoom <= 1}
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="range range-primary range-xs md:range-sm flex-1"
                disabled={isProcessing}
              />
              
              <button 
                onClick={handleZoomIn}
                className="btn btn-circle btn-xs md:btn-sm btn-outline"
                disabled={isProcessing || zoom >= 3}
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Botón rotar */}
            <button 
              onClick={handleRotate}
              className="btn btn-outline btn-xs md:btn-sm"
              disabled={isProcessing}
            >
              <RotateCw className="w-3 h-3 mr-1" />
              <span className="text-xs">Rotar</span>
            </button>

            {/* Indicadores compactos */}
            <div className="hidden md:flex items-center space-x-2 text-xs text-base-content/60">
              <span>Zoom: {zoom.toFixed(1)}x</span>
              <span>•</span>
              <span>{rotation}°</span>
            </div>
          </div>
          
          {/* Indicadores en móvil */}
          <div className="flex md:hidden justify-center mt-1 text-xs text-base-content/60 space-x-2">
            <span>Zoom: {zoom.toFixed(1)}x</span>
            <span>•</span>
            <span>Rotación: {rotation}°</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper