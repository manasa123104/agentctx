import { SEVERITY } from '../../constants.js';

function servers(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed.mcpServers || parsed.servers || null;
}

export const mcpSchema = {
  name: 'mcp-schema',
  severity: SEVERITY.ERROR,
  description: 'mcpServers root key missing or malformed',
  run(parsedConfig) {
    if (parsedConfig.parseError || parsedConfig.json == null) {
      return [
        {
          rule: 'mcp-schema',
          severity: SEVERITY.ERROR,
          server: null,
          field: null,
          message: 'MCP config is not valid JSON',
          suggestion: 'Fix JSON syntax and ensure a top-level mcpServers object.',
        },
      ];
    }
    const s = servers(parsedConfig.json);
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      return [
        {
          rule: 'mcp-schema',
          severity: SEVERITY.ERROR,
          server: null,
          field: 'mcpServers',
          message: '`mcpServers` root key missing or malformed',
          suggestion: 'Use { "mcpServers": { "name": { "command": "..." } } }',
        },
      ];
    }
    return [];
  },
};

export const mcpMissingCommand = {
  name: 'mcp-missing-command',
  severity: SEVERITY.ERROR,
  description: 'Server has neither command nor url',
  run(parsedConfig) {
    const s = servers(parsedConfig.json);
    if (!s) return [];
    const out = [];
    for (const [name, def] of Object.entries(s)) {
      if (!def || typeof def !== 'object') continue;
      if (!def.command && !def.url) {
        out.push({
          rule: 'mcp-missing-command',
          severity: SEVERITY.ERROR,
          server: name,
          field: 'command',
          message: `Server "${name}" has neither command nor url`,
          suggestion: 'Add a command (stdio) or url (HTTP) so the client can start it.',
        });
      }
    }
    return out;
  },
};

const SECRET_KEY = /(api[_-]?key|token|secret|password|passwd|authorization)/i;
const SECRET_VAL = /^(sk-|ghp_|gho_|xox[baprs]-|AIza).+/;

export const mcpHardcodedSecret = {
  name: 'mcp-hardcoded-secret',
  severity: SEVERITY.ERROR,
  description: 'Hardcoded secrets in env blocks',
  run(parsedConfig) {
    const s = servers(parsedConfig.json);
    if (!s) return [];
    const out = [];
    for (const [name, def] of Object.entries(s)) {
      const env = def?.env;
      if (!env || typeof env !== 'object') continue;
      for (const [k, v] of Object.entries(env)) {
        if (typeof v !== 'string') continue;
        if (/\$\{/.test(v)) continue;
        if (SECRET_KEY.test(k) || SECRET_VAL.test(v)) {
          out.push({
            rule: 'mcp-hardcoded-secret',
            severity: SEVERITY.ERROR,
            server: name,
            field: `env.${k}`,
            message: `\`${name}.env.${k}\` appears to contain a hardcoded secret`,
            suggestion: `Use an env reference instead, e.g. "${k}": "\${${k}}"`,
          });
        }
      }
    }
    return out;
  },
};

export const mcpLocalhostUrl = {
  name: 'mcp-localhost-url',
  severity: SEVERITY.WARN,
  description: 'url points to localhost',
  run(parsedConfig) {
    const s = servers(parsedConfig.json);
    if (!s) return [];
    const out = [];
    for (const [name, def] of Object.entries(s)) {
      const url = def?.url;
      if (typeof url === 'string' && /localhost|127\.0\.0\.1/i.test(url)) {
        out.push({
          rule: 'mcp-localhost-url',
          severity: SEVERITY.WARN,
          server: name,
          field: 'url',
          message: `\`${name}.url\` points to localhost (${url})`,
          suggestion: 'Localhost URLs only work on one machine.',
        });
      }
    }
    return out;
  },
};

export const mcpDeprecatedTransport = {
  name: 'mcp-deprecated-transport',
  severity: SEVERITY.WARN,
  description: 'SSE transport deprecated',
  run(parsedConfig) {
    const s = servers(parsedConfig.json);
    if (!s) return [];
    const out = [];
    for (const [name, def] of Object.entries(s)) {
      if (String(def?.transport || '').toLowerCase() === 'sse') {
        out.push({
          rule: 'mcp-deprecated-transport',
          severity: SEVERITY.WARN,
          server: name,
          field: 'transport',
          message: `\`${name}.transport\` uses deprecated SSE transport`,
          suggestion: 'Remove transport — HTTP is the default in modern MCP clients.',
        });
      }
    }
    return out;
  },
};

export const mcpEnvSyntax = {
  name: 'mcp-env-syntax',
  severity: SEVERITY.WARN,
  description: 'Wrong env var syntax for the client',
  run(parsedConfig) {
    const s = servers(parsedConfig.json);
    if (!s) return [];
    const isVscode = /vscode/.test(parsedConfig.name);
    const out = [];
    for (const [name, def] of Object.entries(s)) {
      const env = def?.env;
      if (!env || typeof env !== 'object') continue;
      for (const [k, v] of Object.entries(env)) {
        if (typeof v !== 'string') continue;
        if (isVscode && /\$\{[A-Z0-9_]+\}/.test(v) && !/\$\{env:[A-Z0-9_]+\}/.test(v)) {
          out.push({
            rule: 'mcp-env-syntax',
            severity: SEVERITY.WARN,
            server: name,
            field: `env.${k}`,
            message: `VS Code expects \${env:VAR} syntax in \`${name}.env.${k}\``,
            suggestion: `Change to "\${env:${k}}"`,
          });
        }
      }
    }
    return out;
  },
};

export const mcpRules = [
  mcpSchema,
  mcpMissingCommand,
  mcpHardcodedSecret,
  mcpLocalhostUrl,
  mcpDeprecatedTransport,
  mcpEnvSyntax,
];
