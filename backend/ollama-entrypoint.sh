#!/bin/bash

# Start Ollama in background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready (max 10 seconds)
echo "Waiting for Ollama to start..."
for i in {1..10}; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama ready"
    break
  fi
  sleep 1
done

# Download models asynchronously
echo "Starting model downloads..."
(
  sleep 2
  echo "Downloading nomic-embed-text..."
  ollama pull nomic-embed-text > /dev/null 2>&1
  echo "Downloading phi..."
  ollama pull phi > /dev/null 2>&1
  echo "Models ready"
) &

# Keep main process running
wait $OLLAMA_PID
