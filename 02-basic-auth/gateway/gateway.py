"""IoT Gateway – HTTP Basic Auth demo (Python client)."""

import json
import random
import requests

BASE_URL = "http://localhost:3002"
VALID_AUTH = ("gateway-01", "s3cret-gw01")
INVALID_AUTH = ("gateway-01", "wrong-password")

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


def send_telemetry(auth, label):
    separator(label)
    body = {
        "temperature": round(20 + random.random() * 10, 1),
        "humidity": round(40 + random.random() * 40),
    }
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} POST /api/telemetry  auth={auth[0]}:***")
    print(f"{GREEN}{BOLD}[GATEWAY]{RESET} Body: {json.dumps(body)}")

    resp = requests.post(
        f"{BASE_URL}/api/telemetry",
        json=body,
        auth=auth,
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
    send_telemetry(VALID_AUTH, "Step 1: Send telemetry with VALID credentials")
    list_telemetry()
    send_telemetry(INVALID_AUTH, "Step 3: Send telemetry with INVALID credentials")
