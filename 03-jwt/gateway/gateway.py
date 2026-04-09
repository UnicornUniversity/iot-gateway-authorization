"""IoT Gateway – JWT authentication demo (Python client)."""

import json
import random
import requests

BASE_URL = "http://localhost:3003"

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


def login():
    separator("Step 1: Login (get JWT token)")
    body = {"deviceId": "gateway-01", "secret": "s3cret-gw01"}
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} POST /api/auth/login")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} Body: {json.dumps(body)}")

    resp = requests.post(f"{BASE_URL}/api/auth/login", json=body)
    data = resp.json()

    if resp.ok:
        print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} OK – token received (expires: {data['expiresIn']}){RESET}")
        return data["token"]

    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {RED}{resp.status_code} – {data['error']}{RESET}")
    raise SystemExit("Login failed")


def send_telemetry(token, label):
    separator(label)
    body = {
        "temperature": round(20 + random.random() * 10, 1),
        "humidity": round(40 + random.random() * 40),
    }
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} POST /api/telemetry  Authorization: Bearer {token[:20]}…")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} Body: {json.dumps(body)}")

    resp = requests.post(
        f"{BASE_URL}/api/telemetry",
        json=body,
        headers={"Authorization": f"Bearer {token}"},
    )
    data = resp.json()

    if resp.ok:
        print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} Created – id: {data['id']}{RESET}")
    else:
        print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {RED}{resp.status_code} – {data['error']}{RESET}")


def list_telemetry():
    separator("Step 3: List stored telemetry (GET – no auth required)")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} GET /api/telemetry")

    resp = requests.get(f"{BASE_URL}/api/telemetry")
    data = resp.json()
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} {GREEN}{resp.status_code} OK – {len(data)} record(s){RESET}")
    for rec in data:
        print(f"  {rec['id'][:8]}  {rec['deviceId']}  temp={rec['temperature']}  hum={rec['humidity']}")


if __name__ == "__main__":
    token = login()
    send_telemetry(token, "Step 2: Send telemetry with VALID token")
    list_telemetry()
    send_telemetry("invalid-token-xxx", "Step 4: Send telemetry with INVALID token")
