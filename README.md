# ⚽ LokitosXelFutbol

Una red social dedicada al fútbol donde los fanáticos pueden conectarse, compartir opiniones y seguir las últimas novedades del mundo futbolero.

## 🚀 Características

### ✅ **Funcionalidades Implementadas**

- 🔐 **Sistema de Autenticación Completo**
  - Registro e inicio de sesión con email/contraseña
  - Protección de rutas privadas
  - Gestión de sesiones con Supabase Auth

- 👤 **Gestión de Perfiles**
  - Perfiles de usuario personalizables
  - Subida de avatares a Supabase Storage
  - Avatares con iniciales automáticas (cuando no hay foto)
  - Información de equipo favorito

- 📝 **Sistema de Posts**
  - Creación de posts estilo Twitter
  - Visualización de feed en tiempo real
  - Eliminación de posts (solo el autor)
  - Contador de caracteres (280 max)

- 👥 **Sistema Social**
  - "A quién seguir" con usuarios reales
  - Estadísticas de seguimiento (posts, seguidores, siguiendo)
  - Exclusión inteligente de usuarios ya seguidos

- 🎨 **Diseño Responsivo**
  - Interfaz moderna inspirada en Twitter
  - Dark theme con DaisyUI
  - Responsive design (desktop, tablet, móvil)
  - Componentes reutilizables

### 🔮 **Funcionalidades Futuras**
- 📊 **Sección Partidos** - Estadísticas y fixtures
- 💬 **Sistema de Comentarios** - En posts
- ❤️ **Likes y Retweets** - Funcionales con base de datos
- 📷 **Subida de Imágenes** - En posts
- 🎥 **Subida de Videos** - En posts

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19.1.0 + Vite
- **Styling**: Tailwind CSS 4.1.11 + DaisyUI 5.0.46
- **Backend**: Supabase (Base de datos + Auth + Storage)
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/martinbasile13/LokitosXelFutbol.git
cd LokitosXelFutbol
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Configuración de Base de Datos

### Esquema de Supabase

**Tablas principales:**
- `profiles` - Información de usuarios
- `posts` - Posts de los usuarios  
- `followers` - Relaciones de seguimiento

### Storage

**Bucket requerido:**
- `avatars` (público) - Para fotos de perfil

### Políticas RLS

Las políticas de Row Level Security están configuradas para:
- Usuarios autenticados pueden gestionar sus propios datos
- Avatares son públicos para visualización
- Sistema de seguimiento con verificación de ownership

## 🎨 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Avatar.jsx      # Avatar con iniciales automáticas
│   ├── PostCard.jsx    # Tarjeta de post individual
│   ├── RightPanel.jsx  # Panel lateral derecho
│   └── Sidebar.jsx     # Menú lateral izquierdo
├── pages/              # Páginas principales
│   ├── Auth.jsx        # Login/Registro
│   └── ParaTi.jsx      # Feed principal
├── context/            # Gestión de estado global
│   └── AuthContext.jsx # Contexto de autenticación
├── services/           # Servicios de datos
│   ├── supabaseClient.js   # Cliente de Supabase
│   ├── userService.js      # Operaciones de usuarios
│   ├── postService.js      # Operaciones de posts
│   └── mediaService.js     # Subida de archivos
└── styles/
    └── index.css       # Estilos globales
```

## 🌟 Características Destacadas

### **Avatar Inteligente**
- Muestra foto personalizada o inicial del nombre
- Fondo color primary con texto negro
- Fallback automático si falla la carga
- Tamaños responsivos según contexto

### **Sistema de Posts**
- Creación en tiempo real
- Eliminación solo para el autor
- Validación de contenido
- Estados de carga elegantes

### **Experiencia Social**
- Usuarios sugeridos inteligentes
- Exclusión de ya seguidos
- Estadísticas en tiempo real
- Actualización automática del feed

## 🎯 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construcción para producción
npm run preview      # Vista previa de producción
npm run lint         # Linting con ESLint
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Martín Basile** - [@martinbasile13](https://github.com/martinbasile13)

---

⚽ **¡Dale que vamos Lokitos!** 🔴⚪
