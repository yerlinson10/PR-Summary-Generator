# 📊 PR Summary Generator

Generador automatizado de resúmenes de Pull Requests usando IA de Google Gemini.

## ✨ Características

- 🔐 **Autenticación con GitHub**: Acceso seguro mediante Personal Access Token
- 🤖 **IA Generativa**: Resúmenes inteligentes con Google Gemini 1.5 Flash
- ✏️ **Editor Avanzado**: Editor.js con plugins para formatear resúmenes
- 📄 **Exportación PDF**: Genera documentos profesionales para compartir
- 🔒 **Repositorios Privados**: Compatible con repos privados de GitHub
- 💾 **Almacenamiento Local**: Todos los datos se guardan en tu navegador
- 🎨 **UI Moderna**: Interfaz minimalista y responsive con Tailwind CSS
- ⚡ **Alto Rendimiento**: Construido con Vue 3 y Vite

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ y npm
- Cuenta de GitHub
- API Key de Google Gemini (gratuita)

### Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

3. **Abrir en el navegador**
```
http://localhost:5173
```

## 🔑 Configuración

### 1. Token de GitHub

Para acceder a tus repositorios (incluidos los privados):

1. Ve a [GitHub Settings > Tokens](https://github.com/settings/tokens/new?scopes=repo,read:user)
2. Selecciona los permisos: `repo` y `read:user`
3. Genera y copia el token
4. Pégalo en la pantalla de login de la aplicación

### 2. API Key de Google Gemini

Para generar resúmenes con IA (gratuito):

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API Key
4. Cópiala y pégala en **Configuración** dentro de la app

> 💡 **Plan Gratuito**: 15 solicitudes por minuto, suficiente para uso personal

## 📖 Uso

1. **Login**: Ingresa con tu token de GitHub
2. **Configurar**: Añade tu API Key de Gemini en Configuración
3. **Buscar**: 
   - Selecciona un repositorio
   - Define el rango de fechas
   - Haz clic en "Buscar y Generar Resumen"
4. **Editar**: Usa el editor para personalizar el resumen
5. **Exportar**: Descarga tu resumen en PDF

## 🛠️ Tecnologías

- **Vue 3** + **Vite**
- **Tailwind CSS**
- **Pinia** (State Management)
- **Vue Router**
- **Editor.js** (Con múltiples plugins)
- **GitHub REST API**
- **Google Generative AI** (Gemini 1.5 Flash)
- **jsPDF** + **html2canvas** (Generación de PDFs)

## 📁 Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
├── views/              # Páginas principales
├── stores/             # Pinia stores
├── services/           # Servicios API
├── router/             # Vue Router
└── style.css           # Estilos globales
```

## 📝 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

---

Hecho con ❤️ para desarrolladores que aman la automatización
