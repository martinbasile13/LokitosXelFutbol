#!/bin/bash

# Verificar el estado del repositorio
echo "📊 Verificando estado del repositorio..."
git status

echo ""
echo "📝 Agregando todos los archivos modificados..."
git add .

echo ""
echo "📋 Verificando archivos que se van a commitear..."
git status --staged

echo ""
echo "💾 Creando commit con mensaje descriptivo..."
git commit -m "arreglando ui de comentarios y mas funcionalidades

- Implementada funcionalidad de búsqueda de usuarios en tiempo real
- Agregado componente SearchBox separado del RightPanel
- Corregido sistema de comentarios en PostDetail
- Mejorado layout consistente entre todas las páginas
- Agregadas funciones getCommentsByPost y createComment
- Optimizada navegación entre perfiles de usuarios
- Mejorada UI responsiva en todas las pantallas"

echo ""
echo "🚀 Subiendo cambios a GitHub..."
git push origin main

echo ""
echo "✅ ¡Cambios subidos exitosamente a GitHub!"