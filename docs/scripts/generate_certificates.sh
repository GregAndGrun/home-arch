#!/bin/bash

# SSL Certificate Generation Script for Smart Gate Control
# This script generates self-signed certificates for HTTPS support

echo "======================================"
echo "Smart Gate Control - Certificate Generator"
echo "======================================"
echo ""

# Configuration
CERT_DIR="../../firmware/gate-controller/certs"
DAYS_VALID=3650  # 10 years
KEY_SIZE=2048
COUNTRY="PL"
STATE="Poland"
CITY="Your-City"
ORG="Smart Home"
CN="gate-controller.local"

# Create certificate directory if it doesn't exist
mkdir -p "$CERT_DIR"

echo "Generating private key..."
openssl genrsa -out "$CERT_DIR/server.key" $KEY_SIZE

echo "Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$CN"

echo "Generating self-signed certificate..."
openssl x509 -req -days $DAYS_VALID \
    -in "$CERT_DIR/server.csr" \
    -signkey "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt"

echo ""
echo "Certificates generated successfully!"
echo "Location: $CERT_DIR"
echo ""
echo "Files created:"
echo "  - server.key (Private Key - KEEP SECRET!)"
echo "  - server.crt (Certificate)"
echo "  - server.csr (Certificate Signing Request)"
echo ""
echo "Next steps:"
echo "1. Copy the contents of server.crt to CertificateData.h (server_cert)"
echo "2. Copy the contents of server.key to CertificateData.h (server_key)"
echo "3. NEVER commit server.key to version control!"
echo "4. Update mobile app to use https:// instead of http://"
echo ""
echo "To view certificate details:"
echo "  openssl x509 -in $CERT_DIR/server.crt -text -noout"
echo ""

