#ifndef CERTIFICATE_DATA_H
#define CERTIFICATE_DATA_H

// SSL/TLS Certificate and Private Key
// These should be generated using the script in docs/scripts/generate_certificates.sh
// For development/testing purposes, self-signed certificates can be used

// INSTRUCTIONS:
// 1. Copy this file to CertificateData.h: cp CertificateData.example.h CertificateData.h
// 2. Generate your certificates: cd ../../docs/scripts && ./generate_certificates.sh
// 3. Replace the placeholders below with your actual certificates
// 4. CertificateData.h is in .gitignore and will NOT be committed

// Server Certificate (PEM format)
// Replace this with your actual certificate
const char* server_cert = R"EOF(
-----BEGIN CERTIFICATE-----
PLACEHOLDER_CERTIFICATE_DATA_HERE
Replace this with your actual certificate from generate_certificates.sh
-----END CERTIFICATE-----
)EOF";

// Server Private Key (PEM format)
// IMPORTANT: Keep this secret! Never commit the real key to version control!
const char* server_key = R"EOF(
-----BEGIN PRIVATE KEY-----
PLACEHOLDER_PRIVATE_KEY_DATA_HERE
Replace this with your actual private key from generate_certificates.sh
-----END PRIVATE KEY-----
)EOF";

#endif // CERTIFICATE_DATA_H

/*
 * IMPORTANT SECURITY NOTICE:
 * 
 * This is an EXAMPLE file with placeholders. Do NOT use in production!
 * 
 * Before deploying to production:
 * 1. Copy this file: cp CertificateData.example.h CertificateData.h
 * 2. Generate your own certificates using the script: docs/scripts/generate_certificates.sh
 * 3. Replace the placeholders above with your actual certificates
 * 4. NEVER commit CertificateData.h to version control (it's in .gitignore)
 * 
 * To generate certificates:
 *   cd docs/scripts
 *   ./generate_certificates.sh
 * 
 * Then copy the content from the generated files into CertificateData.h
 */

