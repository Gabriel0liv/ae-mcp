#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  assertProjectReady,
  buildToolResponse,
  readJsonIfAvailable,
  runCliCommand
} from './mcp/ae-command-runner.mjs';

const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_WAIT_MS = 90_000;

const server = new McpServer({
  name: 'ae-mcp',
  version: '1.1.0'
});

function normalizeTimeout(value, fallback = DEFAULT_TIMEOUT_MS) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(5_000, Math.min(value, 600_000));
}

function normalizeWait(value, fallback = DEFAULT_WAIT_MS) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(value, 600_000));
}

function commandOptions(input, expectedFiles = []) {
  return {
    timeoutMs: normalizeTimeout(input?.timeoutMs),
    waitMs: normalizeWait(input?.waitMs),
    expectedFiles
  };
}

async function runTool(commandArgs, input, expectedFiles = [], extra = {}) {
  const result = await runCliCommand(commandArgs, commandOptions(input, expectedFiles));
  return buildToolResponse(result, extra);
}

server.registerTool(
  'ae_project_ready',
  {
    title: 'AE-mcp Project Readiness',
    description: 'Checks whether the MCP server can see the AE-mcp project, CLI entrypoint, and local config.json.',
    inputSchema: {}
  },
  async () => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify(await assertProjectReady(), null, 2)
      }
    ]
  })
);

server.registerTool(
  'ae_check_config',
  {
    title: 'Check AE-mcp Config',
    description: 'Runs node node/cli.js check-config to validate local After Effects paths and configured data/log directories.',
    inputSchema: {
      timeoutMs: z.number().optional()
    }
  },
  async input => runTool(['check-config'], input)
);

server.registerTool(
  'ae_scan_inventory',
  {
    title: 'Scan AE Tool Inventory',
    description: 'Scans local After Effects plugins, scripts, presets, panels, extensions, and tool groups.',
    inputSchema: {
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['scan-inventory'],
    input,
    ['data/local_inventory.json', 'data/tool_groups.json']
  )
);

server.registerTool(
  'ae_context_advisor',
  {
    title: 'Context Advisor',
    description: 'Classifies an editing/troubleshooting question and recommends the next AE-mcp command, files, and knowledge docs.',
    inputSchema: {
      query: z.string().min(1),
      json: z.boolean().default(true),
      timeoutMs: z.number().optional()
    }
  },
  async input => {
    const args = ['context-advisor', input.query];
    if (input.json !== false) args.push('--json');
    return runTool(args, input);
  }
);

server.registerTool(
  'ae_export_effects_catalog',
  {
    title: 'Export AE Effects Catalog',
    description: 'Asks After Effects to export app.effects into data/effects_catalog.json.',
    inputSchema: {
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['export-effects'],
    input,
    ['data/effects_catalog.json']
  )
);

server.registerTool(
  'ae_export_active_comp',
  {
    title: 'Export Active Composition',
    description: 'Exports the active composition. Use deep=true for full property/effect/keyframe tree.',
    inputSchema: {
      deep: z.boolean().default(false),
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => {
    const deep = Boolean(input.deep);
    return runTool(
      [deep ? 'export-active-comp-deep' : 'export-active-comp'],
      input,
      [deep ? 'data/active_comp_deep.json' : 'data/active_comp.json'],
      { mode: deep ? 'deep' : 'light' }
    );
  }
);

server.registerTool(
  'ae_export_selected_layers',
  {
    title: 'Export Selected Layers',
    description: 'Exports selected layers with deep property/effect data. This requires an active comp and selected layers in AE.',
    inputSchema: {
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['export-selected-layers'],
    input,
    ['data/selected_layers.json']
  )
);

server.registerTool(
  'ae_export_diagnostics',
  {
    title: 'Export Diagnostics',
    description: 'Exports diagnostic findings for the active composition, including common issues and selected layer observations.',
    inputSchema: {
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['export-diagnostics'],
    input,
    ['data/diagnostics.json']
  )
);

server.registerTool(
  'ae_export_project_summary',
  {
    title: 'Export Project Summary',
    description: 'Exports a light project-wide summary of comps, project settings, and likely main comps.',
    inputSchema: {
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['export-project-summary'],
    input,
    ['data/project_summary.json']
  )
);

server.registerTool(
  'ae_export_project_map',
  {
    title: 'Export Project Map',
    description: 'Exports a light project-wide structural map of comps, layers, expressions, effects, and dependencies.',
    inputSchema: {
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['export-project-map'],
    input,
    ['data/project_map.json']
  )
);

server.registerTool(
  'ae_export_comp_by_name',
  {
    title: 'Export Composition By Name Or ID',
    description: 'Exports a specific composition by name or item ID. mode can be summary, map, or deep.',
    inputSchema: {
      comp: z.string().min(1),
      mode: z.enum(['summary', 'map', 'deep']).default('map'),
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => runTool(
    ['export-comp-by-name', input.comp, input.mode],
    input,
    []
  )
);

server.registerTool(
  'ae_export_review_package',
  {
    title: 'Export Technical Review Package',
    description: 'Builds a technical review package. Use runChecks=true and deep=true for fresh active-comp deep context.',
    inputSchema: {
      runChecks: z.boolean().default(true),
      deep: z.boolean().default(true),
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => {
    const args = ['export-review-package'];
    if (input.runChecks !== false) args.push('--run-checks');
    if (input.deep !== false) args.push('--deep');
    return runTool(args, input, []);
  }
);

server.registerTool(
  'ae_export_visual_review_package',
  {
    title: 'Export Visual Review Package',
    description: 'Builds a visual review package with technical JSON plus timeline frames. Use deep=true for active_comp_deep.json.',
    inputSchema: {
      runChecks: z.boolean().default(true),
      deep: z.boolean().default(true),
      timeoutMs: z.number().optional(),
      waitMs: z.number().optional()
    }
  },
  async input => {
    const args = ['export-visual-review-package'];
    if (input.runChecks !== false) args.push('--run-checks');
    if (input.deep !== false) args.push('--deep');
    return runTool(
      args,
      input,
      ['data/visual_review_packages/latest.json']
    );
  }
);

server.registerTool(
  'ae_read_latest_context',
  {
    title: 'Read Latest Exported Context',
    description: 'Reads one or more known AE-mcp JSON files from data/. This tool never reads arbitrary paths outside the project.',
    inputSchema: {
      files: z.array(z.enum([
        'data/active_comp.json',
        'data/active_comp_deep.json',
        'data/selected_layers.json',
        'data/diagnostics.json',
        'data/project_summary.json',
        'data/project_map.json',
        'data/effects_catalog.json',
        'data/local_inventory.json',
        'data/tool_groups.json',
        'data/visual_review_packages/latest.json'
      ])).min(1)
    }
  },
  async input => {
    const entries = {};
    for (const file of input.files) {
      entries[file] = await readJsonIfAvailable(file);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(entries, null, 2)
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
