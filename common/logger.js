const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}

const server = {
  info: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${BLUE}${BOLD}[SERVER]${RESET} ${msg}`),
  success: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${BLUE}${BOLD}[SERVER]${RESET} ${GREEN}${msg}${RESET}`),
  warn: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${BLUE}${BOLD}[SERVER]${RESET} ${YELLOW}${msg}${RESET}`),
  error: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${BLUE}${BOLD}[SERVER]${RESET} ${RED}${msg}${RESET}`),
};

const gateway = {
  info: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${GREEN}${BOLD}[GATEWAY]${RESET} ${msg}`),
  success: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${GREEN}${BOLD}[GATEWAY]${RESET} ${GREEN}${msg}${RESET}`),
  warn: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${GREEN}${BOLD}[GATEWAY]${RESET} ${YELLOW}${msg}${RESET}`),
  error: (msg) =>
    console.log(`${DIM}${timestamp()}${RESET} ${GREEN}${BOLD}[GATEWAY]${RESET} ${RED}${msg}${RESET}`),
};

const separator = (title) => {
  const line = "─".repeat(50);
  console.log(`\n${CYAN}${line}${RESET}`);
  console.log(`${CYAN}${BOLD}  ${title}${RESET}`);
  console.log(`${CYAN}${line}${RESET}\n`);
};

module.exports = { server, gateway, separator };
