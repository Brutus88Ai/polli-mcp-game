#!/usr/bin/env node

/**
 * Sketch Stadium - Model Context Protocol (MCP) Game Server
 * Enables AI agents (Claude Code, Codex, Cursor, Antigravity) to play Pictionary
 * against each other over standard MCP JSON-RPC 2.0 (STDIO).
 */

import readline from 'readline';

const GAME_WORDS = [
  { word: "Saturn", category: "Astronomy", hint: "A giant with prominent icy rings" },
  { word: "Telescope", category: "Astronomy", hint: "Optical instrument aimed at stars" },
  { word: "Bicycle", category: "Vehicles", hint: "Two-wheeled pedal-powered transport" },
  { word: "Microscope", category: "Science", hint: "Used to view cellular structures" },
  { word: "Volcano", category: "Nature", hint: "Mountain erupting molten magma" }
];

let gameState = {
  matchId: 4102,
  round: 1,
  currentWord: GAME_WORDS[0],
  drawer: null,
  players: [],
  strokes: [],
  guesses: [],
  startedAt: Date.now(),
  roundDurationSec: 60
};

const TOOLS = [
  {
    name: "join_game",
    description: "Join the active Sketch Stadium match as an AI player (drawer or guesser).",
    inputSchema: {
      type: "object",
      properties: {
        agent_name: { type: "string", description: "Display name of your AI agent" },
        role: {
          type: "string",
          enum: ["drawer", "guesser"],
          description: "Preferred role in this round"
        }
      },
      required: ["agent_name"]
    }
  },
  {
    name: "get_game_state",
    description: "Inspect the current match status, round, category, canvas strokes, and guess feed.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "submit_drawing",
    description: "Draw a vector stroke or path on the canvas (Only the designated drawer can draw).",
    inputSchema: {
      type: "object",
      properties: {
        agent_name: { type: "string", description: "Name of the drawing agent" },
        path: {
          type: "string",
          description: "SVG path string or vector coordinates e.g. 'M 100 200 C 150 100 250 100 300 200'"
        },
        color: { type: "string", description: "Stroke hex color e.g. '#38bdf8'" },
        width: { type: "number", description: "Stroke width in pixels" }
      },
      required: ["agent_name", "path"]
    }
  },
  {
    name: "submit_guess",
    description: "Submit a guess for what the drawing depicts to earn match points.",
    inputSchema: {
      type: "object",
      properties: {
        agent_name: { type: "string", description: "Name of the guessing agent" },
        guess: { type: "string", description: "Your guess for the drawn concept" }
      },
      required: ["agent_name", "guess"]
    }
  }
];

function handleJoin(args) {
  const name = args.agent_name || "Agent-" + Math.floor(Math.random() * 1000);
  let assignedRole = args.role || (gameState.drawer ? "guesser" : "drawer");
  if (assignedRole === "drawer" && gameState.drawer && gameState.drawer !== name) {
    assignedRole = "guesser";
  }
  if (assignedRole === "drawer") {
    gameState.drawer = name;
  }
  if (!gameState.players.find(p => p.name === name)) {
    gameState.players.push({ name, role: assignedRole, score: 0 });
  }

  const responseText = assignedRole === "drawer"
    ? `Welcome, ${name}! You are the DRAWER for Round ${gameState.round}. Secret word: "${gameState.currentWord.word}" (Category: ${gameState.currentWord.category}). Use submit_drawing to draw vector paths for guessers!`
    : `Welcome, ${name}! You are a GUESSER for Round ${gameState.round}. Category: "${gameState.currentWord.category}". Inspect canvas with get_game_state and submit guesses with submit_guess!`;

  return {
    content: [{ type: "text", text: responseText }]
  };
}

function handleGetState() {
  const summary = {
    matchId: gameState.matchId,
    round: gameState.round,
    category: gameState.currentWord.category,
    drawer: gameState.drawer || "None assigned yet",
    totalStrokes: gameState.strokes.length,
    recentStrokes: gameState.strokes.slice(-5),
    players: gameState.players,
    recentGuesses: gameState.guesses.slice(-5)
  };
  return {
    content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
  };
}

function handleDrawing(args) {
  if (gameState.drawer && args.agent_name !== gameState.drawer) {
    return {
      content: [{ type: "text", text: `Permission denied: ${args.agent_name} is not the current drawer (${gameState.drawer}).` }],
      isError: true
    };
  }

  const stroke = {
    agent: args.agent_name,
    path: args.path,
    color: args.color || "#38bdf8",
    width: args.width || 3,
    timestamp: Date.now()
  };
  gameState.strokes.push(stroke);

  return {
    content: [{ type: "text", text: `Stroke #${gameState.strokes.length} successfully rendered on canvas. Guessers can now observe this stroke.` }]
  };
}

function handleGuess(args) {
  const rawGuess = (args.guess || "").trim().toLowerCase();
  const secret = gameState.currentWord.word.toLowerCase();
  const isCorrect = rawGuess === secret || rawGuess.includes(secret);

  gameState.guesses.push({
    agent: args.agent_name,
    guess: args.guess,
    correct: isCorrect,
    timestamp: Date.now()
  });

  if (isCorrect) {
    const player = gameState.players.find(p => p.name === args.agent_name);
    if (player) player.score += 100;
    return {
      content: [{
        type: "text",
        text: `CORRECT! "${args.guess}" matches the secret word "${gameState.currentWord.word}". +100 points to ${args.agent_name}!`
      }]
    };
  } else {
    return {
      content: [{
        type: "text",
        text: `Incorrect guess: "${args.guess}". Category is "${gameState.currentWord.category}". Try again!`
      }]
    };
  }
}

function processRpc(msg) {
  const id = msg.id;
  const method = msg.method;
  const params = msg.params || {};

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "sketch-stadium-mcp",
          version: "1.0.0"
        }
      }
    };
  }

  if (method === "notifications/initialized") {
    return null;
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS }
    };
  }

  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || {};
    let result = null;

    if (name === "join_game") result = handleJoin(args);
    else if (name === "get_game_state") result = handleGetState();
    else if (name === "submit_drawing") result = handleDrawing(args);
    else if (name === "submit_guess") result = handleGuess(args);
    else {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Unknown tool: ${name}` }
      };
    }

    return { jsonrpc: "2.0", id, result };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const parsed = JSON.parse(trimmed);
    const response = processRpc(parsed);
    if (response) {
      process.stdout.write(JSON.stringify(response) + "\n");
    }
  } catch (err) {
    const errResp = {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` }
    };
    process.stdout.write(JSON.stringify(errResp) + "\n");
  }
});
