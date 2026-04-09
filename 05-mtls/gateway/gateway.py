"""IoT Gateway – Mutual TLS (mTLS) authentication demo (Python client)."""

import json
import random
import requests
import os

BASE_URL = "https://localhost:3005"
CERT_DIR = os.path.join(os.path.dirname(__file__), "..", "certs")

CA_CERT = os.path.join(CERT_DIR, "ca-cert.pem")
CLIENT_CERT = os.path.join(CERT_DIR, "client-cert.pem")
CLIENT_KEY = os.path.join(CERT_DIR, "client-key.pem")
UNAUTH_CERT = os.path.join(CERT_DIR, "unauthorized-cert.pem")
UNAUTH_KEY = os.path.join(CERT_DIR, "unauthorized-key.pem")

BLUE = "\033[34m"
GREEN = "\033[32m"
RED = "\033[31m"
CYAN = "\033[36m"
BOLD = "\033[1m"
RESET = "\033[0m"


def separator(title):
    line = "─" * 50
    print(f"\n{CYAN}{line}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{line}{RESET}\n")


def send_telemetry(cert_path, key_path, label):
    separator(label)
    body = {
        "temperature": round(20 + random.random() * 10, 1),
        "humidity": round(40 + random.random() * 40),
    }
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} POST /api/telemetry (with client certificate)")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} Body: {json.dumps(body)}")

    try:
        resp = requests.post(
            f"{BASE_URL}/api/telemetry",
            json=body,
            cert=(cert_path, key_path),
            verify=CA_CERT,
        )
        data = resp.json()

        if resp.ok:
            print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} Created – id: {data['id']}{RESET}")
        else:
            print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {RED}{resp.status_code} – {data['error']}{RESET}")
    except requests.exceptions.SSLError as e:
        print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {RED}SSL Error: {e}{RESET}")


def list_telemetry():
    separator("List stored telemetry (GET – mTLS not required for GET)")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} GET /api/telemetry")

    resp = requests.get(
        f"{BASE_URL}/api/telemetry",
        cert=(CLIENT_CERT, CLIENT_KEY),
        verify=CA_CERT,
    )
    data = resp.json()
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} OK – {len(data)} record(s){RESET}")
    for rec in data:
        print(f"  {rec['id'][:8]}  {rec['deviceId']}  temp={rec['temperature']}  hum={rec['humidity']}")


if __name__ == "__main__":
    send_telemetry(CLIENT_CERT, CLIENT_KEY, "Step 1: Send telemetry with VALID client certificate")
    list_telemetry()
    send_telemetry(UNAUTH_CERT, UNAUTH_KEY, "Step 3: Send telemetry with UNAUTHORIZED certificate")
