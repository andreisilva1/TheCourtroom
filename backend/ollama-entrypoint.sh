#!/bin/bash
set -e

# Inicia Ollama em background
ollama serve &
OLLAMA_PID=$!

# Aguarda Ollama ficar pronto
echo "Aguardando Ollama iniciar..."
for i in {1..30}; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✓ Ollama pronto"
    break
  fi
  echo "  Tentativa $i/30..."
  sleep 2
done

# Pull the required models
echo "Downloading nomic-embed-text for embeddings..."
ollama pull nomic-embed-text

echo "Downloading phi for debates..."
ollama pull phi

echo "✓ All models ready!"

# Mantém o processo rodando
wait $OLLAMA_PID
