import { useState } from 'react';

// Usar la URL correcta del worker
const UPLOAD_ENDPOINT = 'https://falling-boat-f7d7.basiledev-oficial.workers.dev/upload';

const MediaUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Subiendo archivo a:', UPLOAD_ENDPOINT);
      console.log('Archivo:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
      
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Respuesta del servidor:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Datos recibidos:', data);
      
      if (data.url) {
        onUpload(data.url);
      } else {
        setError('No se recibió URL del archivo');
      }
    } catch (err) {
      console.error('Error en upload:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-base-100 rounded-lg shadow flex flex-col items-center">
      <label className="w-full flex flex-col items-center cursor-pointer">
        <span className="mb-2 text-base font-semibold">Selecciona una imagen o video</span>
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-full h-48 flex items-center justify-center bg-base-200 rounded mb-4 overflow-hidden">
          {previewUrl ? (
            file.type.startsWith('image') ? (
              <img src={previewUrl} alt="preview" className="object-contain h-full w-full" />
            ) : (
              <video src={previewUrl} controls className="object-contain h-full w-full" />
            )
          ) : (
            <span className="text-base-content/50">No hay archivo seleccionado</span>
          )}
        </div>
      </label>
      <button
        className="btn btn-primary w-full"
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? 'Subiendo...' : 'Subir archivo'}
      </button>
      {error && <div className="text-error mt-2 text-sm">{error}</div>}
    </div>
  );
};

export default MediaUploader;
