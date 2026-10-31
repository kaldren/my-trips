#!/usr/bin/env node
// Runs the app per git worktree so parallel agents don't collide.
//
// Each worktree gets one of SLOT_COUNT numbered slots. The main checkout is
// always slot 0; linked worktrees take the lowest free slot, recorded in the
// shared git dir so every worktree sees the same allocation. A slot decides the
// Next.js port and an isolated local Supabase stack (its own project_id, so its
// own containers and volumes, and its own ports).
//
// Port layout for slot N:
//   Supabase API   54321 + N         consecutive, so the Google OAuth callback
//                                    URLs can be registered once for all slots
//   Other Supabase 54400 + 10N + k   k keeps the CLI default's last digit
//   Next.js        3000 + N          Playwright 3100 + N
// Slot 0 must match the defaults in supabase/config.toml.
//
// Supabase settings are overridden with SUPABASE_* environment variables, which
// the CLI applies on top of supabase/config.toml, so the checked-in config stays
// the same in every worktree.
//
// Usage: node scripts/worktree.mjs <command> [args...]
//   info               Print this worktree's slot, ports, and URLs
//   oauth-urls         Print the Google OAuth redirect URIs for every slot
//   setup              Start this worktree's Supabase stack and write .env.local
//   env                Write .env.local from the running Supabase stack
//   dev [args]         next dev on this worktree's port
//   e2e [args]         playwright test against this worktree's e2e port
//   supabase [args]    supabase CLI scoped to this worktree's stack
//   release            Delete this worktree's stack and data, and free its slot
//   up                 Start the stack and dev server in the background
//                      (Claude Code SessionStart hook; reads the hook JSON on stdin)
//   down [--force]     Stop the dev server and the stack, keeping data, once no
//                      other Claude session uses this worktree (SessionEnd hook)

import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = "my-trips";
const SLOT_COUNT = 10;
const REGISTRY_FILE = `${PROJECT}-worktree-slots.json`;

const portsFor = (slot) => {
  const block = 54400 + slot * 10;
  return {
    api: 54321 + slot,
    shadow: block,
    db: block + 2,
    studio: block + 3,
    mail: block + 4,
    analytics: block + 7,
    pooler: block + 9,
    inspector: 8083 + slot,
    next: 3000 + slot,
    e2e: 3100 + slot,
  };
};
const oauthCallback = (slot) => `http://127.0.0.1:${portsFor(slot).api}/auth/v1/callback`;

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const root = git("rev-parse", "--show-toplevel");
const gitDir = git("rev-parse", "--path-format=absolute", "--git-dir");
const commonDir = git("rev-parse", "--path-format=absolute", "--git-common-dir");
const isMain = path.resolve(gitDir) === path.resolve(commonDir);
const mainRoot = path.dirname(commonDir);
const registryPath = path.join(commonDir, REGISTRY_FILE);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Serializes registry updates across worktrees that start at the same time.
function withRegistry(fn) {
  const lock = `${registryPath}.lock`;
  for (let attempt = 0; ; attempt++) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const age = Date.now() - fs.statSync(lock, { throwIfNoEntry: false })?.mtimeMs;
      if (age > 10_000) fs.rmSync(lock, { recursive: true, force: true });
      else if (attempt > 100) throw new Error(`Timed out waiting for ${lock}`);
      else sleep(100);
    }
  }
  try {
    let registry = {};
    try {
      registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } catch {}

    // Free slots of worktrees that git no longer knows about.
    const live = new Set(
      git("worktree", "list", "--porcelain")
        .split("\n")
        .filter((line) => line.startsWith("worktree "))
        .map((line) => path.resolve(line.slice("worktree ".length))),
    );
    for (const dir of Object.keys(registry)) {
      if (!live.has(path.resolve(dir))) delete registry[dir];
    }

    const result = fn(registry);
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    return result;
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

// Returns this worktree's registry entry ({ slot, ready }), allocating a slot
// if it has none. `ready` turns true after its first successful `setup`.
function claimSlot() {
  if (isMain) return { slot: 0, ready: true };
  return withRegistry((registry) => {
    if (!registry[root]) {
      const used = new Set(Object.values(registry).map((entry) => entry.slot));
      let slot = 1;
      while (used.has(slot)) slot++;
      if (slot >= SLOT_COUNT) {
        const holders = Object.entries(registry)
          .map(([dir, entry]) => `  slot ${entry.slot}: ${dir}`)
          .join("\n");
        throw new Error(
          `All ${SLOT_COUNT - 1} worktree slots are taken:\n${holders}\n` +
            "Free one by removing a worktree (git worktree remove <path>) " +
            "or by running `pnpm wt:release` inside it.",
        );
      }
      registry[root] = { slot, ready: false };
    }
    return { ...registry[root] };
  });
}

function markReady() {
  if (isMain) return;
  withRegistry((registry) => {
    if (registry[root]) registry[root].ready = true;
  });
}

function releaseSlot() {
  withRegistry((registry) => {
    delete registry[root];
  });
}

function supabaseEnvFor(slot) {
  const ports = portsFor(slot);
  return {
    ...process.env,
    SUPABASE_PROJECT_ID: slot === 0 ? PROJECT : `${PROJECT}-wt${slot}`,
    SUPABASE_API_PORT: String(ports.api),
    SUPABASE_DB_PORT: String(ports.db),
    SUPABASE_DB_SHADOW_PORT: String(ports.shadow),
    SUPABASE_DB_POOLER_PORT: String(ports.pooler),
    SUPABASE_STUDIO_PORT: String(ports.studio),
    SUPABASE_LOCAL_SMTP_PORT: String(ports.mail),
    SUPABASE_ANALYTICS_PORT: String(ports.analytics),
    SUPABASE_EDGE_RUNTIME_INSPECTOR_PORT: String(ports.inspector),
    SUPABASE_AUTH_SITE_URL: `http://localhost:${ports.next}`,
  };
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function capture(command, args, env) {
  return spawnSync(command, args, { cwd: root, env, encoding: "utf8" });
}

function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(500);
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });
}

function parseEnv(text) {
  const values = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) values[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
  }
  return values;
}

// Sets keys in a dotenv file, keeping every other line as it is.
function upsertEnvFile(file, updates) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n") : [];
  const pending = new Map(Object.entries(updates));
  const next = lines.map((line) => {
    const key = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1];
    if (!key || !pending.has(key)) return line;
    const value = pending.get(key);
    pending.delete(key);
    return `${key}=${value}`;
  });
  while (next.length && next.at(-1) === "") next.pop();
  for (const [key, value] of pending) next.push(`${key}=${value}`);
  fs.writeFileSync(file, `${next.join("\n")}\n`);
}

// Untracked secrets (.env.local, supabase/.env) don't exist in a new worktree;
// start from the main checkout's copy so keys like OAuth secrets carry over.
function seedFromMain(relative) {
  const target = path.join(root, relative);
  const source = path.join(mainRoot, relative);
  if (isMain || fs.existsSync(target) || !fs.existsSync(source)) return;
  fs.copyFileSync(source, target);
  console.log(`Copied ${relative} from ${mainRoot}`);
}

function writeEnvLocal(slot) {
  const env = supabaseEnvFor(slot);
  const result = capture("supabase", ["status", "-o", "env"], env);
  const status = parseEnv(result.stdout ?? "");
  if (result.status !== 0 || !status.API_URL || !status.PUBLISHABLE_KEY) {
    process.stderr.write(result.stderr ?? "");
    console.error(`Supabase stack "${env.SUPABASE_PROJECT_ID}" is not running. Run: pnpm db:start`);
    return 1;
  }
  seedFromMain(".env.local");
  upsertEnvFile(path.join(root, ".env.local"), {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
  });
  console.log(`Wrote .env.local for slot ${slot} (${status.API_URL})`);
  return 0;
}

async function setup(entry, args) {
  const { slot } = entry;
  const env = supabaseEnvFor(slot);
  seedFromMain("supabase/.env");

  // A slot reused from a removed worktree may still have that worktree's
  // containers and data under the same project_id. Start this one clean.
  if (!entry.ready) {
    console.log(`Clearing any leftover "${env.SUPABASE_PROJECT_ID}" stack from a previous worktree...`);
    capture("supabase", ["stop", "--no-backup"], env);
  }

  const running = capture("supabase", ["status"], env).status === 0;
  if (!running) {
    const ports = portsFor(slot);
    const wanted = [ports.api, ports.db, ports.shadow, ports.studio, ports.mail, ports.analytics];
    const busy = [];
    for (const port of wanted) if (await isListening(port)) busy.push(port);
    if (busy.length) {
      console.error(
        `Ports for slot ${slot} are already in use: ${busy.join(", ")}.\n` +
          "Another Supabase stack may still use an older port layout. Restart it " +
          "from its checkout with `pnpm db:stop && pnpm db:start`, or find the " +
          `process with: lsof -nP -iTCP:${busy[0]} -sTCP:LISTEN`,
      );
      return 1;
    }
  }

  const status = run("supabase", ["start", ...args], env);
  if (status !== 0) return status;
  markReady();
  return writeEnvLocal(slot);
}

function printInfo({ slot }) {
  const ports = portsFor(slot);
  console.log(
    [
      `Worktree:  ${root}${isMain ? " (main)" : ""}`,
      `Slot:      ${slot} of 0-${SLOT_COUNT - 1}`,
      `App:       http://localhost:${ports.next}`,
      `E2E:       http://localhost:${ports.e2e}`,
      `Supabase:  project "${supabaseEnvFor(slot).SUPABASE_PROJECT_ID}"`,
      `  API      http://127.0.0.1:${ports.api}`,
      `  DB       postgresql://postgres:postgres@127.0.0.1:${ports.db}/postgres`,
      `  Studio   http://127.0.0.1:${ports.studio}`,
      `  Mailpit  http://127.0.0.1:${ports.mail}`,
      `  OAuth    ${oauthCallback(slot)}`,
    ].join("\n"),
  );
  return 0;
}

function release() {
  if (isMain) {
    console.error("The main checkout always keeps slot 0.");
    return 1;
  }
  const entry = withRegistry((registry) => registry[root]);
  if (!entry) {
    console.log("This worktree has no slot.");
    return 0;
  }
  const status = run("supabase", ["stop", "--no-backup"], supabaseEnvFor(entry.slot));
  if (status !== 0) return status;
  releaseSlot();
  console.log(`Released slot ${entry.slot}.`);
  return 0;
}

// --- Claude Code session hooks -------------------------------------------
//
// `up` and `down` run as SessionStart / SessionEnd hooks, so they must return
// quickly: each records the session, then hands the slow work (supabase
// start/stop, next dev) to a detached copy of this script (`up-bg`, `down-bg`).
// Their state lives in this worktree's own git dir, outside the working tree.

const SCRIPT = fileURLToPath(import.meta.url);
const statePath = (name) => path.join(gitDir, `${PROJECT}-${name}`);
const LEASES = statePath("sessions.json");
const DEV_PID = statePath("dev.pid");
const UP_LOCK = statePath("up.lock");
const LEASE_TTL_MS = 24 * 60 * 60 * 1000;

// Hook input arrives as JSON on stdin; manual runs have none.
function readHookInput() {
  if (process.stdin.isTTY) return {};
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

// Session ids of Claude sessions using this worktree, mapped to when they
// were last seen. Sessions that crash never fire SessionEnd, so old entries
// expire after LEASE_TTL_MS.
function updateLeases(fn) {
  let leases = {};
  try {
    leases = JSON.parse(fs.readFileSync(LEASES, "utf8"));
  } catch {}
  const now = Date.now();
  for (const [id, seen] of Object.entries(leases)) if (now - seen > LEASE_TTL_MS) delete leases[id];
  fn(leases, now);
  const tmp = `${LEASES}.${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(leases, null, 2)}\n`);
  fs.renameSync(tmp, LEASES);
  return leases;
}

function spawnDetached(command, logName) {
  const log = fs.openSync(statePath(logName), "a");
  const child = spawn(process.execPath, [SCRIPT, command], {
    cwd: root,
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();
}

function up() {
  const input = readHookInput();
  if (process.env.MY_TRIPS_NO_AUTOSTART === "1") {
    console.log("MY_TRIPS_NO_AUTOSTART=1: not starting this worktree's app.");
    return 0;
  }
  let slot;
  try {
    slot = claimSlot().slot;
  } catch (error) {
    // Report rather than fail, so the session still starts.
    console.log(`Could not start this worktree's app: ${error.message}`);
    return 0;
  }
  updateLeases((leases, now) => {
    leases[input.session_id ?? "manual"] = now;
  });
  spawnDetached("up-bg", "up.log");
  const ports = portsFor(slot);
  console.log(
    [
      `This worktree's app (slot ${slot}) is starting in the background.`,
      `  App      http://localhost:${ports.next}`,
      `  Studio   http://127.0.0.1:${ports.studio}`,
      `  Mailpit  http://127.0.0.1:${ports.mail}`,
      `  Log      ${statePath("up.log")} (dev server: ${statePath("dev.log")})`,
      "Wait for the app URL to respond instead of starting a second server.",
    ].join("\n"),
  );
  return 0;
}

async function upBackground() {
  // Only one start at a time per worktree, e.g. two sessions opening together.
  try {
    fs.mkdirSync(UP_LOCK);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const age = Date.now() - (fs.statSync(UP_LOCK, { throwIfNoEntry: false })?.mtimeMs ?? 0);
    if (age < 10 * 60 * 1000) {
      console.log("Another start is already in progress.");
      return 0;
    }
  }
  try {
    console.log(`[${new Date().toISOString()}] Starting ${root}`);
    if (!fs.existsSync(path.join(root, "node_modules"))) {
      const status = run("pnpm", ["install"]);
      if (status !== 0) return status;
    }
    if (capture("docker", ["info"]).status !== 0) {
      console.error("Docker is not running. Start Docker, then run: pnpm wt:up");
      return 1;
    }
    const entry = claimSlot();
    const status = await setup(entry, []);
    if (status !== 0) return status;

    const port = portsFor(entry.slot).next;
    if (await isListening(port)) {
      console.log(`App already running on http://localhost:${port}`);
      return 0;
    }
    // Own process group, so `down` can stop next dev and all its workers.
    const log = fs.openSync(statePath("dev.log"), "w");
    const dev = spawn(process.execPath, [SCRIPT, "dev"], {
      cwd: root,
      detached: true,
      stdio: ["ignore", log, log],
      env: { ...process.env, PATH: `${path.join(root, "node_modules", ".bin")}${path.delimiter}${process.env.PATH}` },
    });
    fs.writeFileSync(DEV_PID, String(dev.pid));
    dev.unref();
    for (let i = 0; i < 120 && !(await isListening(port)); i++) sleep(1000);
    console.log(
      (await isListening(port))
        ? `App running on http://localhost:${port}`
        : `App did not start listening on ${port}; see ${statePath("dev.log")}`,
    );
    return 0;
  } finally {
    fs.rmSync(UP_LOCK, { recursive: true, force: true });
  }
}

function down() {
  const input = readHookInput();
  const force = args.includes("--force");
  const leases = updateLeases((leases) => {
    if (force) for (const id of Object.keys(leases)) delete leases[id];
    else delete leases[input.session_id ?? "manual"];
  });
  // /clear ends this session and starts a new one in the same worktree.
  if (input.reason === "clear") return 0;
  const others = Object.keys(leases).length;
  if (others) {
    console.log(`Leaving the app running: ${others} other session(s) use this worktree. Use --force to stop anyway.`);
    return 0;
  }
  spawnDetached("down-bg", "down.log");
  console.log(`Stopping this worktree's app in the background (log: ${statePath("down.log")}).`);
  return 0;
}

async function downBackground() {
  console.log(`[${new Date().toISOString()}] Stopping ${root}`);
  const { slot } = claimSlot();
  const port = portsFor(slot).next;
  const pids = new Set();
  try {
    pids.add(-Number(fs.readFileSync(DEV_PID, "utf8")));
  } catch {}
  // Also stop a dev server started some other way (e.g. `pnpm dev` by hand).
  const listeners = capture("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]).stdout ?? "";
  for (const pid of listeners.split(/\s+/).filter(Boolean)) pids.add(Number(pid));
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
      console.log(`Sent SIGTERM to ${pid < 0 ? `process group ${-pid}` : `pid ${pid}`}`);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
  fs.rmSync(DEV_PID, { force: true });
  return run("supabase", ["stop"], supabaseEnvFor(slot));
}

const [command, ...args] = process.argv.slice(2);
const commands = {
  info: () => printInfo(claimSlot()),
  "oauth-urls": () => {
    for (let slot = 0; slot < SLOT_COUNT; slot++) console.log(oauthCallback(slot));
    return 0;
  },
  env: () => writeEnvLocal(claimSlot().slot),
  setup: () => setup(claimSlot(), args),
  supabase: () => run("supabase", args, supabaseEnvFor(claimSlot().slot)),
  dev: () => run("next", ["dev", "--port", String(portsFor(claimSlot().slot).next), ...args]),
  e2e: () =>
    run("playwright", ["test", ...args], {
      ...process.env,
      PLAYWRIGHT_PORT: String(portsFor(claimSlot().slot).e2e),
    }),
  release,
  up,
  "up-bg": upBackground,
  down,
  "down-bg": downBackground,
};

if (!commands[command]) {
  console.error(`Usage: node scripts/worktree.mjs <${Object.keys(commands).join("|")}> [args...]`);
  process.exit(1);
}
try {
  process.exit(await commands[command]());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
