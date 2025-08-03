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
git commit -m "commit: Actualización de archivos recientes"
echo "🚀 Subiendo cambios a GitHub..."
git push origin main

echo ""
echo "✅ ¡Cambios subidos exitosamente a GitHub!"