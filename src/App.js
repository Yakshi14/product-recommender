import React, { useState } from 'react';
import { products } from './products';
import Groq from 'groq-sdk';
import './App.css';

// Initialize Groq with your API key
const groq = new Groq({
  apiKey: 'YOUR_API_KEY', 
  dangerouslyAllowBrowser: true 
});

function App() {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState(products);
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    if (!query.trim()) {
      setRecommendations(products);
      return;
    }
    setLoading(true);

    try {
      // PROMPT IMPROVEMENT: Force the AI to be extremely concise
      const prompt = `
        User Request: "${query}"
        Available Products JSON: ${JSON.stringify(products)}
        
        INSTRUCTION: 
        1. Identify products that match the User Request.
        2. Output ONLY the IDs as a comma-separated list (e.g., 1, 2, 5).
        3. If no match, output "none".
        4. DO NOT provide explanations or prose.
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, // Lower temperature makes the AI more consistent/strict
      });

      const resultText = chatCompletion.choices[0]?.message?.content || "";

      if (resultText.toLowerCase().includes("none")) {
        setRecommendations([]);
      } else {
        // ROBUST EXTRACTION: This finds all numbers in the string regardless of extra text
        const matchedIds = resultText.match(/\d+/g); 
        
        if (matchedIds) {
          const idArray = matchedIds.map(Number);
          const filtered = products.filter(p => idArray.includes(p.id));
          setRecommendations(filtered);
        } else {
          setRecommendations([]);
        }
      }
    } catch (error) {
      console.error("Groq Error:", error);
      alert("API Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>AI Product Scout</h1>
      </header>
      <div className="search-container">
        <input 
          type="text" 
          placeholder="e.g. Phone under $500..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={getRecommendations} disabled={loading}>
          {loading ? 'Thinking...' : 'Get Recommendations'}
        </button>
      </div>

      <div className="product-grid">
        {recommendations.length > 0 ? (
          recommendations.map(p => (
            <div key={p.id} className="product-card">
              <h3>{p.name}</h3>
              <p><strong>Price:</strong> ${p.price}</p>
              <p>{p.features}</p>
            </div>
          ))
        ) : (
          <p>No products found matching your criteria.</p>
        )}
      </div>
    </div>
  );
}

export default App;