import { execFile } from 'node:child_process';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, '..', '..');
export const cliPath = path.join(repoRoot, 'node', 'cli.js');

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_AE_WAIT_MS = 90_000;
const POLL_INTERVAL_MS = 500;
const MAX_OUTPUT_CHARS = 16_000;

function truncateText(value, max = MAX_OUTPUT_CHARS) {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n\n[...truncated ${value.length - max} chars...]`;
}

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/[\\/]+/g, path.sep);
}

export function dataPath(relativePath) {
  return path.join(repoRoot, normalizeRelativePath(relativePath));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

async function getFileInfo(filePath, startedAtMs) {
  try {
    const info = await stat(filePath);
    return {
      path: path.relative(repoRoot, filePath),
      exists: true,
      size: info.size,
      modifiedAt: info.mtime.toISOString(),
      modifiedAfterCommandStart: info.mtimeMs >= startedAtMs - 1000
    };
  } catch (_error) {
    return {
      path: path.relative(repoRoot, filePath),
      exists: false,
      size: null,
      modifiedAt: null,
      modifiedAfterCommandStart: false
    };
  }
}

export async function waitForExpectedFiles(expectedFiles = [], startedAtMs, waitMs = DEFAULT_AE_WAIT_MS) {
  const normalized = expectedFiles.filter(Boolean).map(dataPath);
  if (normalized.length === 0 || waitMs <= 0) {
    return {
      waited: false,
      satisfied: normalized.length === 0,
      files: []
    };
  }

  const deadline = Date.now() + waitMs;
  while (Date.now() <= deadline) {
    const states = await Promise.all(normalized.map(filePath => getFileInfo(filePath, startedAtMs)));
    const allReady = states.every(state => state.exists && state.modifiedAfterCommandStart);
    if (allReady) {
      return {
        waited: true,
        satisfied: true,
        files: states
      };
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    waited: true,
    satisfied: false,
    files: await Promise.all(normalized.map(filePath => getFileInfo(filePath, startedAtMs)))
  };
}

export function readJsonIfAvailable(relativePath) {
  const absolute = dataPath(relativePath);
  return import('node:fs').then(fs => {
    if (!fs.existsSync(absolute)) return null;
    try {
      return JSON.parse(fs.readFileSync(absolute, 'utf8'));
    } catch (error) {
      return {
        ok: false,
        code: 'JSON_PARSE_FAILED',
        path: relativePath,
        message: error.message
      };
    }
  });
}

export async function runCliCommand(commandArgs, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const waitMs = Number(options.waitMs ?? DEFAULT_AE_WAIT_MS);
  const expectedFiles = options.expectedFiles ?? [];
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();

  const result = await new Promise(resolve => {
    const child = execFile(
      process.execPath,
      [cliPath, ...commandArgs],
      {
        cwd: repoRoot,
        windowsHide: true,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
          NO_COLOR: '1'
        }
      },
      (error, stdout, stderr) => {
        const finishedAtMs = Date.now();
        resolve({
          ok: !error,
          command: `node node/cli.js ${commandArgs.join(' ')}`,
          args: commandArgs,
          cwd: repoRoot,
          startedAt,
          finishedAt: new Date(finishedAtMs).toISOString(),
          durationMs: finishedAtMs - startedAtMs,
          exitCode: typeof error?.code === 'number' ? error.code : 0,
          signal: error?.signal ?? null,
          timedOut: Boolean(error?.killed && error?.signal === 'SIGTERM'),
          stdout: truncateText(stdout),
          stderr: truncateText(stderr),
          error: error ? {
            name: error.name,
            message: error.message,
            code: error.code ?? null
          } : null
        });
      }
    );

    child.on('error', error => {
      const finishedAtMs = Date.now();
      resolve({
        ok: false,
        command: `node node/cli.js ${commandArgs.join(' ')}`,
        args: commandArgs,
        cwd: repoRoot,
        startedAt,
        finishedAt: new Date(finishedAtMs).toISOString(),
        durationMs: finishedAtMs - startedAtMs,
        exitCode: null,
        signal: null,
        timedOut: false,
        stdout: '',
        stderr: '',
        error: {
          name: error.name,
          message: error.message,
          code: error.code ?? null
        }
      });
    });
  });

  const expected = await waitForExpectedFiles(expectedFiles, startedAtMs, waitMs);
  return {
    ...result,
    expectedFiles: expected,
    ok: result.ok && (expectedFiles.length === 0 || expected.satisfied)
  };
}

export async function buildToolResponse(commandResult, extra = {}) {
  const payload = {
    ...extra,
    result: commandResult
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ],
    isError: !commandResult.ok
  };
}

export async function assertProjectReady() {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const configPath = path.join(repoRoot, 'config.json');
  return {
    repoRoot,
    cliPath,
    packageJsonExists: await fileExists(packageJsonPath),
    configJsonExists: await fileExists(configPath)
  };
}
