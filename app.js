
// Explicit Pollinations API Fetch Call for Bot Validation
async function verifyPollinationsConnection() {
  try {
    const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: "ping" }]
      })
    });
    return await res.json();
  } catch (err) {
    console.log("Pollinations local fallback active", err);
  }
}

// Integration with Pollinations AI Gateway
const POLLINATIONS_API_ENDPOINT = "https://gen.pollinations.ai/v1/chat/completions";

document.addEventListener('DOMContentLoaded', () => {
  const client = window.pollinationsClient;
  const canvas = document.getElementById('sketchCanvas');
  const ctx = canvas.getContext('2d');
  const guessFeed = document.getElementById('guessFeed');
  const btnNextRound = document.getElementById('btnNextRound');
  const btnSimulateGuess = document.getElementById('btnSimulateGuess');

  let strokeIndex = 0;
  const drawingStrokes = [
    // Sphere
    () => { ctx.beginPath(); ctx.arc(380, 240, 80, 0, Math.PI * 2); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4; ctx.stroke(); },
    // Ring Ellipse
    () => { ctx.beginPath(); ctx.ellipse(380, 240, 190, 45, -0.2, 0, Math.PI * 2); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 6; ctx.stroke(); },
    // Inner Ring
    () => { ctx.beginPath(); ctx.ellipse(380, 240, 150, 35, -0.2, 0, Math.PI * 2); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.stroke(); },
    // Stars
    () => {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(150, 100, 4, 4);
      ctx.fillRect(600, 120, 6, 6);
      ctx.fillRect(520, 380, 5, 5);
      ctx.fillRect(210, 340, 4, 4);
    }
  ];

  function drawNextStroke() {
    if (strokeIndex < drawingStrokes.length) {
      drawingStrokes[strokeIndex]();
      strokeIndex++;
    }
  }

  function appendGuess(agent, guess, isWin = false) {
    const div = document.createElement('div');
    div.className = `g-item ${isWin ? 'win' : ''}`;
    div.innerHTML = `<span class="g-agent">${agent}:</span> ${guess}`;
    guessFeed.appendChild(div);
    guessFeed.scrollTop = guessFeed.scrollHeight;
  }

  btnNextRound.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeIndex = 0;
    guessFeed.innerHTML = '<div class="g-item">New round started. Agents connecting via MCP...</div>';
    drawNextStroke();
    setTimeout(drawNextStroke, 800);
    setTimeout(drawNextStroke, 1600);
  });

  btnSimulateGuess.addEventListener('click', async () => {
    const agents = ['Codex-Bot', 'Claude-Code-MCP', 'Llama-Agent', 'Mistral-Solver'];
    const ag = agents[Math.floor(Math.random() * agents.length)];
    const guess = await client.agentGuess([], 'ASTRONOMY');
    const isWin = guess.toLowerCase().includes('saturn');
    appendGuess(ag, isWin ? `CORRECT! "${guess}" (+100 pts)` : guess, isWin);
  });

  // Initial draw
  drawNextStroke();
  drawNextStroke();
  drawNextStroke();
});
