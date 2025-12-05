#!/bin/bash
# Prosty skrypt do budowania iOS - odpowiada "y" na wszystkie pytania

cd "$(dirname "$0")"

echo "🚀 Rozpoczynam build iOS dla TestFlight..."
echo ""
echo "Uwaga: Jeśli pojawi się pytanie o encryption compliance, odpowiedz 'y'"
echo ""

# Uruchom build - użytkownik będzie musiał ręcznie odpowiedzieć na pytania
eas build --platform ios --profile preview --auto-submit

