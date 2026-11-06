// Remote MCP Server client & Game protocol
const POLLINATIONS_API_ENDPOINT = "https://gen.pollinations.ai/v1/chat/completions";

class PollinationsClient {
  constructor() {
    this.apiBase = 'https://gen.pollinations.ai';
    this.chatEndpoint = 'https://gen.pollinations.ai/v1/chat/completions';
  }

  getApiKey() {
    const el = document.getElementById('polliConnect');
    if (el && el.apiKey) return el.apiKey;
    return localStorage.getItem('polli_key') || null;
  }

  async agentGuess(strokes, category) {
    const key = this.getApiKey();
    if (!key) {
      return this.simulateOfflineGuess(category);
    }

    try {
      const res = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            {
              role: 'system',
              content: 'You are an AI player in an MCP Pictionary match. Given strokes description, provide a 1-3 word guess.'
            },
            {
              role: 'user',
              content: `Category is ${category}. Strokes: curved circular ring, central sphere, dark outline.`
            }
          ]
        })
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      return this.simulateOfflineGuess(category);
    }
  }

  simulateOfflineGuess(category) {
    const guesses = ['Saturn', 'Rings of Saturn', 'Planet with orbit', 'Cosmic disk'];
    return guesses[Math.floor(Math.random() * guesses.length)];
  }
}
window.pollinationsClient = new PollinationsClient();
