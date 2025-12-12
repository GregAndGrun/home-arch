#!/bin/bash
echo "🔍 Czekam na zakończenie builda iOS..."
BUILD_ID="6cced1d2-63b3-4709-a6f5-d5823f03589e"

while true; do
  STATUS=$(eas build:list --platform ios --limit 1 --non-interactive 2>&1 | grep -E "Status" | head -1 | awk '{print $2}')
  
  if [ "$STATUS" = "finished" ]; then
    echo "✅ Build zakończony! Przesyłam do App Store Connect..."
    eas submit --platform ios --latest --non-interactive
    echo "✅ Submission zakończony!"
    break
  elif [ "$STATUS" = "error" ]; then
    echo "❌ Build zakończony błędem. Sprawdź logi:"
    echo "https://expo.dev/accounts/greggrun/projects/smart-home/builds/$BUILD_ID"
    break
  else
    echo "⏳ Status: $STATUS - czekam 30 sekund..."
    sleep 30
  fi
done
