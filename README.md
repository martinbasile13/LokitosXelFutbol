# LokitosXelFutbol ⚽

Una red social dedicada al fútbol argentino donde los fanáticos pueden compartir opiniones, seguir a otros usuarios y mantenerse al día con las últimas noticias del fútbol.

## 🚀 Características

- **Red Social Futbolera**: Publica posts, comenta y vota contenido
- **Sistema de Equipos**: Cada usuario puede seleccionar su equipo favorito
- **Avatares Personalizados**: Los escudos de los equipos aparecen como avatares
- **Likes y Votaciones**: Sistema completo de interacciones
- **Perfiles de Usuario**: Ve y sigue a otros usuarios
- **Responsive Design**: Funciona perfectamente en móvil y desktop
- **Tiempo Real**: Actualizaciones instantáneas

## 🛠️ Tecnologías

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + DaisyUI
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Cloudflare R2 (imágenes y videos)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📱 Funcionalidades

### Posts y Contenido
- ✅ Crear posts con texto, imágenes y videos
- ✅ Sistema de votación (upvote/downvote)
- ✅ Likes y comentarios
- ✅ Contador de vistas automático
- ✅ Modal de imágenes con zoom

### Usuarios y Perfiles
- ✅ Registro y autenticación
- ✅ Perfiles personalizados con equipos
- ✅ Sistema de seguir/dejar de seguir
- ✅ Estadísticas de usuarios
- ✅ Sugerencias de usuarios

### Navegación
- ✅ Feed principal "Para Ti"
- ✅ Detalle de posts con comentarios
- ✅ Perfiles de usuarios
- ✅ Navegación móvil responsive

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Avatar.jsx      # Avatares con escudos de equipos
│   ├── PostCard.jsx    # Tarjeta de post
│   ├── PostComposer.jsx # Formulario para crear posts
│   ├── Sidebar.jsx     # Navegación lateral
│   └── ...
├── pages/              # Páginas principales
│   ├── ParaTi.jsx      # Feed principal
│   ├── PostDetail.jsx  # Detalle de post
│   ├── Profile.jsx     # Perfil personal
│   ├── UserProfile.jsx # Perfil de otros usuarios
│   └── ...
├── services/           # Servicios de API
│   ├── postService.js  # Operaciones de posts
│   ├── userService.js  # Operaciones de usuarios
│   └── ...
├── context/            # Context API
└── data/               # Datos estáticos (equipos)
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de Cloudflare (para R2)

### Configuración

1. **Clonar el repositorio**
```bash
git clone [URL_DEL_REPO]
cd lokitosxelfutbol
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` con:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Base de Datos (Supabase)

### Tablas principales:
- `profiles` - Perfiles de usuarios
- `posts` - Posts del feed
- `comments` - Comentarios en posts
- `likes` - Sistema de likes
- `followers` - Relaciones de seguimiento
- `post_views` - Contador de vistas
- `comment_votes` - Votaciones en comentarios

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
```

### Worker de Cloudflare (para uploads)
```bash
npm run deploy-worker
```

## 🏆 Equipos Soportados

Primera División Argentina:
- Boca Juniors, River Plate, Racing Club
- Independiente, San Lorenzo, Estudiantes
- Y todos los equipos de la Liga Profesional

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autor

**Martin Basile** - [@basiledev](https://github.com/basiledev)

## 🙏 Agradecimientos

- Comunidad futbolera argentina
- Iconos de equipos de fútbol
- Supabase por la infraestructura
- Cloudflare por el storage

---

⚽ **¡Hecho con pasión por el fútbol argentino!** ⚽
