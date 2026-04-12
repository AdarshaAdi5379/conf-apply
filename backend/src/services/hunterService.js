import axios from 'axios';
import CircuitBreaker from '../utils/circuitBreaker.js';

class HunterService {
  constructor() {
    this.apiKey = process.env.HUNTER_API_KEY;
    this.baseUrl = 'https://api.hunter.io/v2';
    this.circuitBreaker = new CircuitBreaker({ name: 'hunter', failureThreshold: 3, resetTimeout: 60000 });
  }

  async verifyEmail(email) {
    const fallback = () => this.getMockEmailVerification(email);
    
    const action = async () => {
      if (!this.apiKey || this.apiKey === 'your_hunter_api_key_here') {
        console.warn('⚠️  Hunter API key not configured, using mock data');
        return fallback();
      }

      const response = await axios.get(`${this.baseUrl}/email-verifier`, {
        params: {
          email,
          api_key: this.apiKey
        }
      });

      const data = response.data.data;
      
      let score = 0;
      
      switch (data.status) {
        case 'valid':
          score = 90;
          break;
        case 'accept_all':
          score = 60;
          break;
        case 'webmail':
          score = 40;
          break;
        case 'disposable':
          score = 5;
          break;
        case 'invalid':
          score = 0;
          break;
        default:
          score = 50;
      }

      return {
        verified: data.status === 'valid',
        score,
        status: data.status,
        isDisposable: data.disposable || false,
        isWebmail: data.webmail || false,
        data: {
          email: data.email,
          score: data.score,
          regexp: data.regexp,
          gibberish: data.gibberish,
          smtp_server: data.smtp_server,
          smtp_check: data.smtp_check
        }
      };
    };

    try {
      return await this.circuitBreaker.execute(action, fallback);
    } catch (error) {
      console.error('Hunter API Error:', error.message);
      return fallback();
    }
  }

  getMockEmailVerification(email) {
    const domain = email.split('@')[1];
    const webmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    
    if (disposableDomains.some(d => domain.includes(d))) {
      return {
        verified: false,
        score: 5,
        status: 'disposable',
        isDisposable: true,
        isWebmail: false,
        data: { email }
      };
    }

    if (webmailDomains.includes(domain)) {
      return {
        verified: true,
        score: 45,
        status: 'webmail',
        isDisposable: false,
        isWebmail: true,
        data: { email }
      };
    }

    return {
      verified: true,
      score: 85,
      status: 'valid',
      isDisposable: false,
      isWebmail: false,
      data: { email }
    };
  }
}

export default new HunterService();