import axios from 'axios';
import CircuitBreaker from '../utils/circuitBreaker.js';

class SafeBrowsingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.baseUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
    this.circuitBreaker = new CircuitBreaker({ name: 'safebrowsing', failureThreshold: 3, resetTimeout: 60000 });
  }

  async checkUrl(url) {
    const fallback = () => this.getMockSafeBrowsingCheck(url);
    
    const action = async () => {
      if (!this.apiKey || this.apiKey === 'your_google_safe_browsing_api_key_here') {
        console.warn('⚠️  Google Safe Browsing API key not configured, using mock data');
        return fallback();
      }

      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        client: {
          clientId: 'recruiterrisk',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      });

      const isSafe = !response.data.matches || response.data.matches.length === 0;

      return {
        safe: isSafe,
        score: isSafe ? 100 : 0,
        threats: response.data.matches || []
      };
    };

    try {
      return await this.circuitBreaker.execute(action, fallback);
    } catch (error) {
      console.error('Safe Browsing API Error:', error.message);
      return fallback();
    }
  }

  getMockSafeBrowsingCheck(url) {
    const dangerousPatterns = ['phishing', 'scam', 'malware', 'virus'];
    
    const isDangerous = dangerousPatterns.some(pattern => 
      url.toLowerCase().includes(pattern)
    );

    return {
      safe: !isDangerous,
      score: isDangerous ? 0 : 100,
      threats: isDangerous ? [{ threatType: 'SOCIAL_ENGINEERING' }] : []
    };
  }
}

export default new SafeBrowsingService();