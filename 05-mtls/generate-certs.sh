#!/bin/bash
set -e

CERT_DIR="$(dirname "$0")/certs"
rm -rf "$CERT_DIR"
mkdir -p "$CERT_DIR"

echo "=== Generating CA ==="
openssl genrsa -out "$CERT_DIR/ca-key.pem" 2048
openssl req -new -x509 -key "$CERT_DIR/ca-key.pem" -out "$CERT_DIR/ca-cert.pem" -days 365 \
  -subj "/CN=IoT Demo CA/O=University/C=CZ"

echo "=== Generating Server Certificate ==="
openssl genrsa -out "$CERT_DIR/server-key.pem" 2048
openssl req -new -key "$CERT_DIR/server-key.pem" -out "$CERT_DIR/server.csr" \
  -subj "/CN=localhost/O=IoT Backend/C=CZ"
openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/ca-cert.pem" -CAkey "$CERT_DIR/ca-key.pem" \
  -CAcreateserial -out "$CERT_DIR/server-cert.pem" -days 365 \
  -extfile <(echo "subjectAltName=DNS:localhost,IP:127.0.0.1")

echo "=== Generating Client Certificate (gateway-01) ==="
openssl genrsa -out "$CERT_DIR/client-key.pem" 2048
openssl req -new -key "$CERT_DIR/client-key.pem" -out "$CERT_DIR/client.csr" \
  -subj "/CN=gateway-01/O=IoT Gateway/C=CZ"
openssl x509 -req -in "$CERT_DIR/client.csr" -CA "$CERT_DIR/ca-cert.pem" -CAkey "$CERT_DIR/ca-key.pem" \
  -CAcreateserial -out "$CERT_DIR/client-cert.pem" -days 365

echo "=== Generating Unauthorized Client Certificate (self-signed, NOT signed by CA) ==="
openssl genrsa -out "$CERT_DIR/unauthorized-key.pem" 2048
openssl req -new -x509 -key "$CERT_DIR/unauthorized-key.pem" -out "$CERT_DIR/unauthorized-cert.pem" -days 365 \
  -subj "/CN=rogue-device/O=Unknown/C=XX"

rm -f "$CERT_DIR"/*.csr "$CERT_DIR"/*.srl
echo ""
echo "=== Done! Certificates generated in $CERT_DIR ==="
echo "  CA:           ca-cert.pem / ca-key.pem"
echo "  Server:       server-cert.pem / server-key.pem"
echo "  Client (OK):  client-cert.pem / client-key.pem"
echo "  Client (bad): unauthorized-cert.pem / unauthorized-key.pem"
