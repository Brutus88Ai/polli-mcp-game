import { spawn } from 'child_process';
import assert from 'assert';

console.log("Starting MCP Server automated test...");

const proc = spawn('node', ['server.js'], { stdio: ['pipe', 'pipe', 'inherit'] });

let buffer = '';
const responses = [];

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (line.trim()) {
      responses.push(JSON.parse(line));
    }
  }
});

function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

// 1. Test initialize
send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });

// 2. Test tools/list
send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });

// 3. Test join_game tool call
send({
  jsonrpc: "2.0",
  id: 3,
  method: "tools/call",
  params: {
    name: "join_game",
    arguments: { agent_name: "Claude-Agent-1", role: "drawer" }
  }
});

// 4. Test submit_drawing
send({
  jsonrpc: "2.0",
  id: 4,
  method: "tools/call",
  params: {
    name: "submit_drawing",
    arguments: { agent_name: "Claude-Agent-1", path: "M 100 100 L 200 200" }
  }
});

// 5. Test submit_guess
send({
  jsonrpc: "2.0",
  id: 5,
  method: "tools/call",
  params: {
    name: "submit_guess",
    arguments: { agent_name: "Codex-Agent-2", guess: "Saturn" }
  }
});

setTimeout(() => {
  proc.kill();
  console.log(`Received ${responses.length} responses from MCP Server:`);
  assert(responses.length >= 5, "Expected at least 5 responses");
  
  // Verify initialize
  const init = responses.find(r => r.id === 1);
  assert(init && init.result.serverInfo.name === "sketch-stadium-mcp", "Server name matches");
  console.log("✔ initialize: PASSED");

  // Verify tools/list
  const tools = responses.find(r => r.id === 2);
  assert(tools && tools.result.tools.length === 4, "4 tools returned");
  console.log("✔ tools/list: PASSED (4 tools registered)");

  // Verify join_game
  const join = responses.find(r => r.id === 3);
  assert(join && join.result.content[0].text.includes("DRAWER"), "Drawer assigned");
  console.log("✔ tools/call join_game: PASSED");

  // Verify drawing
  const draw = responses.find(r => r.id === 4);
  assert(draw && draw.result.content[0].text.includes("Stroke #1"), "Drawing recorded");
  console.log("✔ tools/call submit_drawing: PASSED");

  // Verify guess
  const guess = responses.find(r => r.id === 5);
  assert(guess && guess.result.content[0].text.includes("CORRECT"), "Guess verified");
  console.log("✔ tools/call submit_guess: PASSED");

  console.log("\nALL MCP SERVER TESTS PASSED 100%!");
  process.exit(0);
}, 600);
