export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { method } = request;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (method === "POST" && url.pathname === "/upload") {
        // Debug: verificar variables de entorno
        console.log("R2_BUCKET_NAME:", env.R2_BUCKET_NAME);
        console.log("R2_BUCKET disponible:", !!env.R2_BUCKET);
        
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Archivo inválido o no proporcionado" 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validar tamaño del archivo (50MB máximo)
        if (file.size > 50 * 1024 * 1024) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "El archivo es demasiado grande (máximo 50MB)" 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
        if (!allowedTypes.includes(file.type)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Tipo de archivo no permitido" 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generar nombre único del archivo
        const fileExtension = file.name.split('.').pop() || 'bin';
        const objectKey = `${crypto.randomUUID()}-${Date.now()}.${fileExtension}`;

        console.log("Subiendo archivo:", objectKey, "Tipo:", file.type, "Tamaño:", file.size);

        // Subir a R2
        await env.R2_BUCKET.put(objectKey, file.stream(), {
          httpMetadata: { 
            contentType: file.type,
            cacheControl: "public, max-age=31536000" // Cache por 1 año
          }
        });

        // Usar la URL del bucket público
        const publicUrl = `https://pub-b210ce72d66b4a9b960f1f14cb2c6959.r2.dev/${objectKey}`;

        console.log("URL generada:", publicUrl);

        return new Response(
          JSON.stringify({ 
            success: true,
            key: objectKey, 
            url: publicUrl,
            fileName: file.name,
            size: file.size,
            type: file.type
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      if (method === "DELETE" && url.pathname === "/delete") {
        const body = await request.json();
        const { key } = body;

        if (!key) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Key del archivo requerida" 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Eliminando archivo:", key);

        // Eliminar de R2
        await env.R2_BUCKET.delete(key);

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Archivo eliminado exitosamente" 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Ruta no encontrada
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Ruta no encontrada" 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );

    } catch (error) {
      console.error("Error en worker:", error);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Error interno del servidor",
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  },
};
