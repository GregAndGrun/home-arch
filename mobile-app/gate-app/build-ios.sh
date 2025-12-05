#!/bin/bash
cd "$(dirname "$0")"

# Automatycznie odpowiadaj "y" na pytania EAS
echo "y" | eas build --platform ios --profile preview --auto-submit

