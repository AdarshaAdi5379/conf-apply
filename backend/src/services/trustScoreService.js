const natural = require('natural');
const Feedback = require('../models/Feedback');

class TrustScoreService {
  constructor() {
    this.analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
  }

  calculateTrustScore(domainScore, verifiedLinkedIn, averageRating, sentimentScore) {
    const domain = domainScore * 0.4;
    const linkedin = verifiedLinkedIn ? 20 : 0;
    const feedback = (averageRating / 5) * 30;
    const sentiment = (sentimentScore / 100) * 30;

    const totalScore = domain + linkedin + feedback + sentiment;
    return Math.min(Math.round(totalScore), 100);
  }

  analyzeSentiment(comment) {
    try {
      const tokens = this.tokenizer.tokenize(comment.toLowerCase());
      const sentimentScore = this.analyzer.getSentiment(tokens);
      
      const normalizedScore = Math.max(-100, Math.min(100, sentimentScore * 20));
      
      return Math.round(normalizedScore);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 0;
    }
  }

  async calculateAverageSentiment(recruiterId) {
    try {
      const feedbacks = await Feedback.find({ recruiterId });
      
      if (feedbacks.length === 0) {
        return 0;
      }

      const totalSentiment = feedbacks.reduce((sum, feedback) => sum + feedback.sentimentScore, 0);
      const averageSentiment = totalSentiment / feedbacks.length;
      
      return Math.round((averageSentiment + 100) / 2);
    } catch (error) {
      console.error('Calculate average sentiment error:', error);
      return 0;
    }
  }

  getTrustLevel(score) {
    if (score >= 70) return { level: 'high', color: 'green', label: 'Highly Trusted' };
    if (score >= 40) return { level: 'medium', color: 'yellow', label: 'Moderately Trusted' };
    return { level: 'low', color: 'red', label: 'Low Trust' };
  }

  shouldFlag(trustScore, feedbackCount, averageRating, sentimentScore) {
    const flags = [];

    if (trustScore < 30 && feedbackCount >= 3) {
      flags.push('Very low trust score with multiple feedbacks');
    }

    if (averageRating < 2 && feedbackCount >= 3) {
      flags.push('Consistently poor ratings');
    }

    if (sentimentScore < 20 && feedbackCount >= 3) {
      flags.push('Highly negative sentiment in feedback');
    }

    return {
      shouldFlag: flags.length > 0,
      reasons: flags
    };
  }

  generateInsights(recruiter) {
    const insights = [];
    const trustLevel = this.getTrustLevel(recruiter.trustScore);

    insights.push(`Trust Level: ${trustLevel.label}`);

    if (recruiter.verificationData.clearbitVerified) {
      insights.push('✓ Company domain verified');
    }

    if (recruiter.verifiedLinkedIn) {
      insights.push('✓ LinkedIn profile verified');
    }

    if (recruiter.feedbackCount >= 5) {
      insights.push(`${recruiter.feedbackCount} candidate reviews`);
    } else if (recruiter.feedbackCount === 0) {
      insights.push('No reviews yet');
    }

    if (recruiter.averageRating >= 4) {
      insights.push('⭐ Highly rated by candidates');
    }

    if (recruiter.isFlagged) {
      insights.push('⚠️ Flagged for review');
    }

    return insights;
  }
}

module.exports = new TrustScoreService();