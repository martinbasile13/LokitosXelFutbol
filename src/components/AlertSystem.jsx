import { useState, useEffect } from 'react'

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)

  // Función para agregar una nueva alerta
  const addAlert = (type, message, duration = 5000) => {
    const id = Date.now()
    const newAlert = { id, type, message, duration }
    
    setAlerts(prev => [...prev, newAlert])
    
    // Auto-remover después del tiempo especificado
    setTimeout(() => {
      removeAlert(id)
    }, duration)
  }

  // Función para remover una alerta
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  // Función para mostrar modal de confirmación
  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setConfirmModal({
        ...options,
        onConfirm: () => {
          setConfirmModal(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmModal(null)
          resolve(false)
        }
      })
    })
  }

  // Función global para mostrar alertas de éxito
  window.showSuccessAlert = (message, duration) => addAlert('success', message, duration)
  
  // Función global para mostrar alertas de error
  window.showErrorAlert = (message, duration) => addAlert('error', message, duration)

  // Función global para mostrar confirmación moderna
  window.showConfirm = showConfirm

  return (
    <>
      {/* Sistema de alertas */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            role="alert"
            className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'} 
              animate-slide-in-right shadow-lg max-w-sm cursor-pointer`}
            onClick={() => removeAlert(alert.id)}
          >
            {alert.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{alert.message}</span>
            <div className="ml-auto">
              <button 
                className="btn btn-ghost btn-xs btn-circle"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAlert(alert.id)
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación moderno */}
      {confirmModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 rounded-2xl shadow-2xl">
            {/* Icono */}
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                confirmModal.type === 'danger' ? 'bg-error/10' : 'bg-warning/10'
              }`}>
                {confirmModal.type === 'danger' ? (
                  <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-center mb-2">
              {confirmModal.title || '¿Estás seguro?'}
            </h3>

            {/* Mensaje */}
            <p className="text-base-content/70 text-center mb-6">
              {confirmModal.message || 'Esta acción no se puede deshacer.'}
            </p>

            {/* Botones */}
            <div className="flex gap-3 justify-center">
              <button 
                className="btn btn-ghost rounded-full px-6"
                onClick={confirmModal.onCancel}
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>
              <button 
                className={`btn rounded-full px-6 ${
                  confirmModal.type === 'danger' ? 'btn-error' : 'btn-warning'
                }`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
          
          {/* Backdrop */}
          <div 
            className="modal-backdrop bg-black/50" 
            onClick={confirmModal.onCancel}
          ></div>
        </dialog>
      )}
    </>
  )
}

export default AlertSystem
