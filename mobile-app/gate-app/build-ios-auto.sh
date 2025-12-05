#!/bin/bash
# Automatyczny build iOS z odpowiedziami na pytania EAS

cd "$(dirname "$0")"

# Funkcja do automatycznego odpowiadania na pytania
auto_answer() {
    while IFS= read -r line; do
        echo "$line"
        if [[ "$line" == *"iOS app only uses standard/exempt encryption"* ]]; then
            echo "y"
        elif [[ "$line" == *"Configure this project"* ]]; then
            echo "y"
        fi
    done
}

# Uruchom build z automatycznymi odpowiedziami
eas build --platform ios --profile preview --auto-submit 2>&1 | auto_answer

