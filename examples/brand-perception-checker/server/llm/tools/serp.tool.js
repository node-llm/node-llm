import { Tool, z } from '@node-llm/core';
import axios from 'axios';

export class SerpTool extends Tool {
  name = 'search_market_data';
  description = 'Searches the web for brand mentions, snippets, and "People Also Ask" questions.';
  schema = z.object({
    brandName: z.string().describe('The brand name to search for')
  });

  async execute({ brandName }) {
    console.log(`[Tool] Fetching live market telemetry for: ${brandName}`);
    const apiKey = process.env.SERPER_API_KEY;
    
    if (!apiKey) {
      console.warn('[Tool] SYSTEM_WARNING: SERPER_API_KEY omitted, failing over to mock data');
      return this.getMockData(brandName);
    }

    try {
      const response = await axios.post('https://google.serper.dev/search', {
        q: brandName,
        gl: 'in',
        hl: 'en',
      }, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      const snippets = (data.organic || []).slice(0, 5).map(item => item.snippet);
      const paa = (data.peopleAlsoAsk || []).map(item => item.question);
      
      return {
        visibility: data.searchParameters?.totalResults > 100000 ? 'high' : 'medium',
        totalResults: data.searchParameters?.totalResults,
        snippets,
        paa,
        organic: data.organic?.map(o => ({ title: o.title, link: o.link, snippet: o.snippet }))
      };
    } catch (error) {
      console.error(`[Tool] SYSTEM_ERROR: ${error.message}`);
      return this.getMockData(brandName);
    }
  }

  getMockData(brandName) {
    return {
      visibility: 'medium',
      totalResults: 12500,
      snippets: [
        `${brandName} is a high-performance framework for building AI applications...`,
        `How to use ${brandName} with React and Node.js`,
        `${brandName} vs alternatives: A detailed comparison`,
        `Security first approach in ${brandName}`
      ],
      paa: [
        `Is ${brandName} free?`,
        `How does ${brandName} handle security?`,
        `Who developed ${brandName}?`
      ],
      organic: [
        { title: `${brandName} Documentation`, link: "https://docs.example.com/nodellm", snippet: "Official guide to getting started with the library." },
        { title: "Top 10 AI Frameworks in 2026", link: "https://techblog.example.com/trends", snippet: `Why ${brandName} is climbing the ranks.` },
        { title: "Securing Node.js LLM Applications", link: "https://security.example.com/ai-safety", snippet: `Best practices for ${brandName} developers.` }
      ]
    };
  }
}
