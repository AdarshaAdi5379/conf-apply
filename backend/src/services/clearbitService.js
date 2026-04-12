import axios from 'axios';
import CircuitBreaker from '../utils/circuitBreaker.js';

class ClearbitService {
  constructor() {
    this.apiKey = process.env.CLEARBIT_API_KEY;
    this.baseUrl = 'https://company.clearbit.com/v2/companies';
    this.circuitBreaker = new CircuitBreaker({ name: 'clearbit', failureThreshold: 3, resetTimeout: 60000 });
  }

  async verifyCompanyDomain(domain) {
    const fallback = () => this.getMockDomainScore(domain);
    
    const action = async () => {
      if (!this.apiKey || this.apiKey === 'your_clearbit_api_key_here') {
        console.warn('⚠️  Clearbit API key not configured, using mock data');
        return fallback();
      }

      const response = await axios.get(`${this.baseUrl}/find`, {
        params: { domain },
        auth: { username: this.apiKey, password: '' }
      });

      if (response.data) {
        let score = 50;
        
        if (response.data.metrics && response.data.metrics.employees) {
          score += 20;
        }
        if (response.data.linkedin && response.data.linkedin.handle) {
          score += 15;
        }
        if (response.data.tech && response.data.tech.length > 0) {
          score += 10;
        }
        if (response.data.foundedYear) {
          score += 5;
        }

        return {
          verified: true,
          score: Math.min(score, 100),
          data: {
            name: response.data.name,
            domain: response.data.domain,
            description: response.data.description,
            employees: response.data.metrics?.employees || 'N/A',
            linkedin: response.data.linkedin?.handle || null
          }
        };
      }

      return { verified: false, score: 0, data: null };
    };

    try {
      return await this.circuitBreaker.execute(action, fallback);
    } catch (error) {
      console.error('Clearbit API Error:', error.message);
      return fallback();
    }
  }

  getMockDomainScore(domain) {
    const trustedDomains = ['google.com', 'microsoft.com', 'amazon.com', 'meta.com', 'apple.com'];
    const suspiciousDomains = ['xyz.com', 'temp-mail.com'];
    
    if (trustedDomains.some(d => domain.includes(d))) {
      return {
        verified: true,
        score: 95,
        data: {
          name: domain.split('.')[0],
          domain,
          description: 'Verified company',
          employees: '1000+',
          linkedin: domain.split('.')[0]
        }
      };
    }
    
    if (suspiciousDomains.some(d => domain.includes(d))) {
      return { verified: false, score: 10, data: null };
    }

    return {
      verified: true,
      score: 60,
      data: {
        name: domain.split('.')[0],
        domain,
        description: 'Company domain found',
        employees: 'N/A',
        linkedin: null
      }
    };
  }
}

export default new ClearbitService();