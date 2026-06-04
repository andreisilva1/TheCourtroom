#!/bin/bash

# Test ArgumentAI complete flow

API="http://localhost:8001"

echo "🧪 Testing ArgumentAI flow..."

# 1. Test health check
echo -e "\n1️⃣  Health check:"
curl -s $API/health | python -m json.tool

# 2. Create persona
echo -e "\n2️⃣  Creating persona (Steve Jobs)..."
PERSONA_RESPONSE=$(curl -s -X POST "$API/create_persona?persona_name=Steve%20Jobs")
echo "$PERSONA_RESPONSE" | python -m json.tool
PERSONA_ID=$(echo "$PERSONA_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('persona_id', ''))")
TASK_ID=$(echo "$PERSONA_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('task_id', ''))")

# 3. Wait for persona to build
echo -e "\n3️⃣  Waiting for persona to build (task: $TASK_ID)..."
for i in {1..60}; do
  STATUS=$(curl -s "$API/task/$TASK_ID" | python -c "import sys, json; print(json.load(sys.stdin).get('state', ''))")
  if [ "$STATUS" = "SUCCESS" ]; then
    echo "✅ Persona built!"
    break
  fi
  echo "⏳ Status: $STATUS (attempt $i/60)"
  sleep 2
done

# 4. Load personas
echo -e "\n4️⃣  Loading personas..."
PERSONAS=$(curl -s "$API/load_personas")
echo "$PERSONAS" | python -m json.tool
PERSONA_ID=$(echo "$PERSONAS" | python -c "import sys, json; personas = json.load(sys.stdin); print(personas[0]['id'] if personas else '')")

# 5. Start debate
echo -e "\n5️⃣  Starting debate with persona ($PERSONA_ID)..."
DEBATE_START=$(curl -s -X POST "$API/ace-attorney/start" -H "Content-Type: application/json" -d "{\"persona_id\": \"$PERSONA_ID\"}")
echo "$DEBATE_START" | python -m json.tool
DEBATE_ID=$(echo "$DEBATE_START" | python -c "import sys, json; print(json.load(sys.stdin).get('debate_id', ''))")

# 6. User argues
echo -e "\n6️⃣  User argues in debate ($DEBATE_ID)..."
ARGUE=$(curl -s -X POST "$API/ace-attorney/argue" -H "Content-Type: application/json" -d "{\"debate_id\": \"$DEBATE_ID\", \"user_argument\": \"That's not true because innovation requires failure and learning.\"}")
echo "$ARGUE" | python -m json.tool

echo -e "\n✅ Flow test complete!"
