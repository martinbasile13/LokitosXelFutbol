export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const { method } = request;
  
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };
  
      if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
  
      if (method === "POST" && url.pathname === "/upload") {
        try {
          // Debug: verificar variables de entorno
          console.log("R2_BUCKET_NAME:", env.R2_BUCKET_NAME);
          console.log("R2_BUCKET disponible:", !!env.R2_BUCKET);
          
          const formData = await request.formData();
          const file = formData.get("file");
  
          if (!file || typeof file === "string") {
            return new Response(
              JSON.stringify({ error: "Archivo inválido" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
  
          const objectKey = `${crypto.randomUUID()}-${file.name}`;
  
          await env.R2_BUCKET.put(objectKey, file.stream(), {
            httpMetadata: { contentType: file.type }
          });

          // Usar la URL del bucket hardcodeada temporalmente hasta que se configure la variable
          const bucketName = env.R2_BUCKET_NAME || "lokitos-videos";
          const publicUrl = `https://pub-b210ce72d66b4a9b960f1f14cb2c6959.r2.dev/${objectKey}`;
  
          console.log("URL generada:", publicUrl);

          return new Response(
            JSON.stringify({ key: objectKey, url: publicUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Error subiendo archivo a R2:", error);
          return new Response(
            JSON.stringify({ error: "Error interno del servidor" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
  
      return new Response("Not found", { status: 404, headers: corsHeaders });
    },
  };
