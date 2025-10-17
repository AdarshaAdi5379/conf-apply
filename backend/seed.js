require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Recruiter = require('./src/models/Recruiter');
const Feedback = require('./src/models/Feedback');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await User.deleteMany();
    await Recruiter.deleteMany();
    await Feedback.deleteMany();
    console.log('🗑️  Cleared existing data');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@recruiterrisk.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Created admin user');

    const candidate1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'candidate'
    });

    const candidate2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'candidate'
    });

    const candidate3 = await User.create({
      name: 'Mike Johnson',
      email: 'mike@example.com',
      password: 'password123',
      role: 'candidate'
    });
    console.log('✅ Created candidate users');

    const recruiterUser1 = await User.create({
      name: 'Sarah Williams',
      email: 'sarah@techcorp.com',
      password: 'password123',
      role: 'recruiter'
    });

    const recruiterUser2 = await User.create({
      name: 'David Brown',
      email: 'david@innovate.io',
      password: 'password123',
      role: 'recruiter'
    });
    console.log('✅ Created recruiter users');

    const recruiter1 = await Recruiter.create({
      userId: recruiterUser1._id,
      name: 'Sarah Williams',
      email: 'sarah@techcorp.com',
      company: 'TechCorp Solutions',
      linkedInUrl: 'https://linkedin.com/in/sarahwilliams',
      companyWebsite: 'https://techcorp.com',
      position: 'Senior Technical Recruiter',
      domainScore: 85,
      verifiedLinkedIn: true,
      trustScore: 82,
      feedbackCount: 0,
      averageRating: 0,
      sentimentScore: 50,
      isVerified: true,
      verificationData: {
        clearbitVerified: true,
        hunterVerified: true,
        safeBrowsingPassed: true,
        lastVerified: new Date()
      },
      metadata: {
        profileViews: 45,
        responseRate: 95,
        avgResponseTime: '2 hours'
      }
    });

    const recruiter2 = await Recruiter.create({
      userId: recruiterUser2._id,
      name: 'David Brown',
      email: 'david@innovate.io',
      company: 'Innovate Labs',
      linkedInUrl: 'https://linkedin.com/in/davidbrown',
      companyWebsite: 'https://innovatelabs.io',
      position: 'Talent Acquisition Lead',
      domainScore: 78,
      verifiedLinkedIn: true,
      trustScore: 75,
      feedbackCount: 0,
      averageRating: 0,
      sentimentScore: 50,
      isVerified: true,
      verificationData: {
        clearbitVerified: true,
        hunterVerified: true,
        safeBrowsingPassed: true,
        lastVerified: new Date()
      },
      metadata: {
        profileViews: 32,
        responseRate: 88,
        avgResponseTime: '4 hours'
      }
    });

    recruiterUser1.recruiterId = recruiter1._id;
    await recruiterUser1.save();
    recruiterUser2.recruiterId = recruiter2._id;
    await recruiterUser2.save();

    console.log('✅ Created recruiter profiles');

    const feedback1 = await Feedback.create({
      candidateId: candidate1._id,
      recruiterId: recruiter1._id,
      rating: 5,
      comment: 'Sarah was incredibly professional and responsive throughout the entire hiring process. She kept me updated at every stage and provided valuable feedback. Highly recommend!',
      sentimentScore: 85,
      tags: ['responsive', 'professional', 'helpful'],
      isReported: false
    });

    const feedback2 = await Feedback.create({
      candidateId: candidate2._id,
      recruiterId: recruiter1._id,
      rating: 4,
      comment: 'Good experience overall. Communication was clear and timely. The job description matched the actual role perfectly. Would work with Sarah again.',
      sentimentScore: 70,
      tags: ['professional', 'transparent'],
      isReported: false
    });

    const feedback3 = await Feedback.create({
      candidateId: candidate3._id,
      recruiterId: recruiter1._id,
      rating: 5,
      comment: 'Excellent recruiter! Very transparent about the role, salary expectations, and company culture. Made the interview process smooth and stress-free.',
      sentimentScore: 90,
      tags: ['responsive', 'professional', 'transparent'],
      isReported: false
    });

    const feedback4 = await Feedback.create({
      candidateId: candidate1._id,
      recruiterId: recruiter2._id,
      rating: 3,
      comment: 'The process was okay but communication could have been better. Took a while to get responses sometimes. The role was good though.',
      sentimentScore: 40,
      tags: ['slow'],
      isReported: false
    });

    const feedback5 = await Feedback.create({
      candidateId: candidate2._id,
      recruiterId: recruiter2._id,
      rating: 4,
      comment: 'David was helpful and professional. The interview process was well-organized. Happy with the outcome.',
      sentimentScore: 65,
      tags: ['professional', 'helpful'],
      isReported: false
    });

    console.log('✅ Created feedback entries');

    const recruiter1Feedbacks = await Feedback.find({ recruiterId: recruiter1._id });
    const recruiter1AvgRating = recruiter1Feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / recruiter1Feedbacks.length;
    const recruiter1AvgSentiment = recruiter1Feedbacks.reduce((sum, fb) => sum + fb.sentimentScore, 0) / recruiter1Feedbacks.length;
    
    recruiter1.feedbackCount = recruiter1Feedbacks.length;
    recruiter1.averageRating = recruiter1AvgRating;
    recruiter1.sentimentScore = (recruiter1AvgSentiment + 100) / 2;
    recruiter1.trustScore = Math.round(
      (recruiter1.domainScore * 0.4) + 
      (recruiter1.verifiedLinkedIn ? 20 : 0) + 
      ((recruiter1AvgRating / 5) * 30) + 
      ((recruiter1.sentimentScore / 100) * 30)
    );
    await recruiter1.save();

    const recruiter2Feedbacks = await Feedback.find({ recruiterId: recruiter2._id });
    const recruiter2AvgRating = recruiter2Feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / recruiter2Feedbacks.length;
    const recruiter2AvgSentiment = recruiter2Feedbacks.reduce((sum, fb) => sum + fb.sentimentScore, 0) / recruiter2Feedbacks.length;
    
    recruiter2.feedbackCount = recruiter2Feedbacks.length;
    recruiter2.averageRating = recruiter2AvgRating;
    recruiter2.sentimentScore = (recruiter2AvgSentiment + 100) / 2;
    recruiter2.trustScore = Math.round(
      (recruiter2.domainScore * 0.4) + 
      (recruiter2.verifiedLinkedIn ? 20 : 0) + 
      ((recruiter2AvgRating / 5) * 30) + 
      ((recruiter2.sentimentScore / 100) * 30)
    );
    await recruiter2.save();

    console.log('✅ Updated recruiter statistics');

    console.log('\n📊 Seed Summary:');
    console.log(`- ${await User.countDocuments()} users created`);
    console.log(`- ${await Recruiter.countDocuments()} recruiters created`);
    console.log(`- ${await Feedback.countDocuments()} feedbacks created`);
    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@recruiterrisk.com / admin123');
    console.log('Candidate: john@example.com / password123');
    console.log('Recruiter: sarah@techcorp.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await seedData();
};

run();