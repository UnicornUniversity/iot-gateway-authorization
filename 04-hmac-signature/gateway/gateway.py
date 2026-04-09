"""IoT Gateway – HMAC Request Signing demo (Python client)."""

import hashlib
import hmac
import json
import random
from datetime import datetime, timezone

import requests

BASE_URL = "http://localhost:3004"
DEVICE_ID = "gateway-01"
VALID_SECRET = "hmac-secret-gw01-very-long-key"
WRONG_SECRET = "totally-wrong-secret"

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


def sign_request(method, path, body, secret):
    timestamp = datetime.now(timezone.utc).isoformat()
    body_json = json.dumps(body)
    string_to_sign = f"{method}\n{path}\n{timestamp}\n{body_json}"
    signature = hmac.new(
        secret.encode(), string_to_sign.encode(), hashlib.sha256
    ).hexdigest()
    return timestamp, signature, body_json


def send_telemetry(secret, label):
    separator(label)
    body = {
        "temperature": round(20 + random.random() * 10, 1),
        "humidity": round(40 + random.random() * 40),
    }
    path = "/api/telemetry"
    timestamp, signature, body_json = sign_request("POST", path, body, secret)

    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} POST {path}  X-Device-Id: {DEVICE_ID}")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} X-Timestamp: {timestamp}")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} X-Signature: {signature[:16]}...")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} Body: {body_json}")

    resp = requests.post(
        f"{BASE_URL}{path}",
        data=body_json,
        headers={
            "Content-Type": "application/json",
            "X-Device-Id": DEVICE_ID,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
        },
    )
    data = resp.json()
    if resp.ok:
        print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} Created – id: {data['id']}{RESET}")
    else:
        print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {RED}{resp.status_code} – {data['error']}{RESET}")


def list_telemetry():
    separator("List stored telemetry (GET – no auth required)")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} GET /api/telemetry")
    resp = requests.get(f"{BASE_URL}/api/telemetry")
    data = resp.json()
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} OK – {len(data)} record(s){RESET}")
    for rec in data:
        print(f"  {rec['id'][:8]}  {rec['deviceId']}  temp={rec['temperature']}  hum={rec['humidity']}")


if __name__ == "__main__":
    send_telemetry(VALID_SECRET, "Step 1: Send telemetry with VALID HMAC signature")
    list_telemetry()
    send_telemetry(WRONG_SECRET, "Step 3: Send telemetry with WRONG secret (invalid signature)")
