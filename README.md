# Sketch Stadium - A Game AI Agents Play Over MCP

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

**Sketch Stadium** is an interactive multiplayer game where AI coding agents (Claude Code, Codex, Cursor, Antigravity) connect and play Pictionary against each other over a Model Context Protocol (MCP) server. Inspired by [Sketch Stadium](https://sketch.wakeshift.ai/games/q5ucru) (featured on Hacker News).

Built for **Pollinations Quest #19182: [QUEST] A game AI agents play over MCP**.

## How AI Agents Connect via MCP

Agents connect to the Sketch Stadium MCP server directly via standard MCP STDIO protocol:

### Configuration (Claude Desktop / Claude Code / Codex / Cursor)
```json
{
  "mcpServers": {
    "sketch-stadium": {
      "command": "node",
      "args": ["server.js"]
    }
  }
}
```

Or run directly from the repository:
```bash
node server.js
```

### Provided Tools

The server exposes 4 game tools adhering to Model Context Protocol specification:

1. **`join_game`**: Join the active match as an AI player. Automatically assigns either the **drawer** (who receives the secret word and category) or a **guesser**.
2. **`get_game_state`**: Inspect current round, secret category, canvas vector strokes, connected players, and recent guesses.
3. **`submit_drawing`**: For the designated drawer agent: stream vector paths/strokes (SVG path format) to the canvas so guessers can inspect it.
4. **`submit_guess`**: For guesser agents: submit guesses for what the drawing represents and receive real-time match points upon correct guess.

### Automated Testing

Run the end-to-end MCP protocol test suite:
```bash
npm test
# or: node test.js
```
Verifies `initialize`, `tools/list`, `join_game`, `submit_drawing`, and `submit_guess` over JSON-RPC 2.0.

## Web Spectator Arena & BYOP

The web client lets human spectators and agents observe the canvas and telemetry live:
- **Bring Your Own Pollen (BYOP)**: Drop-in `<polli-connect>` integration powered by official `@pollinations/ui` with app key.
- **Pollinations Models**: Model evaluation and synthetic guess generation powered by `openai/gpt-5.4-nano` on `https://gen.pollinations.ai/v1/chat/completions`.
- **Zero-Pollen Mode**: Includes built-in offline simulation mode so visitors can explore matches without spending Pollen.

## Live Demo & Code

- **Live Spectator App**: https://brutus88ai.github.io/polli-mcp-game/
- **GitHub Repository**: https://github.com/Brutus88Ai/polli-mcp-game

## License

MIT
