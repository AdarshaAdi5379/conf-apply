<h1 align="center">🚀 Recruiter Risk</h1>
<p align="center">
  <b>AI-Powered Recruiter Trust & Fraud Detection Platform</b><br>
  Building transparency and safety in online hiring through intelligent verification.
</p>

<hr>

<h2>📖 Overview</h2>
<p>
  <b>Recruiter Risk</b> is a full-stack web platform that helps job seekers verify recruiters, detect fake job listings, and assess recruiter trustworthiness. 
  It integrates AI-driven verification APIs to ensure candidates engage only with credible recruiters.
</p>

<hr>

<h2> Key Features</h2>

<h3> Candidate Side</h3>
<ul>
  <li>Recruiter verification using <b>Clearbit</b> and <b>Hunter.io</b>.</li>
  <li>Safe job link validation via <b>Google Safe Browsing API</b>.</li>
  <li>Feedback submission & trust score visualization.</li>
  <li>Personalized dashboard to track recruiter interactions.</li>
</ul>

<h3> Recruiter Side</h3>
<ul>
  <li>Profile verification and trust score view.</li>
  <li>Ability to post jobs (upcoming feature).</li>
  <li>View aggregated candidate feedback insights.</li>
</ul>

<h3> Admin Side</h3>
<ul>
  <li>Approve recruiters and moderate feedback.</li>
  <li>Monitor fraudulent activity reports.</li>
  <li>Access admin dashboard with trust analytics.</li>
</ul>

<h3> Platform Intelligence</h3>
<ul>
  <li>AI-driven <b>Trust Score Engine</b> integrating recruiter metadata, domain analysis, and user feedback.</li>
  <li>Fraud detection heuristics based on real-world hiring data.</li>
</ul>

<hr>

<h2> Tech Stack</h2>

<h3>Frontend</h3>
<ul>
  <li>React (Vite)</li>
  <li>Tailwind CSS</li>
  <li>Context API for Authentication</li>
  <li>Axios for API Calls</li>
</ul>

<h3>Backend</h3>
<ul>
  <li>Node.js + Express.js</li>
  <li>Postgres (Supabase) via <code>postgres</code> client</li>
  <li>JWT Authentication</li>
  <li>RESTful API Architecture</li>
</ul>

<h3>Database</h3>
<ul>
  <li>Supabase Postgres</li>
</ul>

<hr>

<h2> Architecture</h2>

<pre>
recruiter-risk/
├── backend/
│   ├── src/
│   │   ├── db.js            # Postgres client
│   │   ├── routes/          # Express Routes
│   │   ├── middleware/      # Auth & Error Handling
│   │   ├── services/        # External API Integrations
│   │   ├── utils/           # Validators
│   │   └── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── pages/           # React Pages
│   │   ├── context/         # Auth Context
│   │   └── services/        # API Helpers
│   └── .env
│
└── README.md
</pre>

<hr>

<h2>🔗 APIs & Integrations</h2>

<table>
  <tr>
    <th>Service</th>
    <th>Purpose</th>
    <th>API Type</th>
  </tr>
  <tr>
    <td>Clearbit</td>
    <td>Verify recruiter domain and company identity</td>
    <td>REST</td>
  </tr>
  <tr>
    <td>Hunter.io</td>
    <td>Validate recruiter email authenticity</td>
    <td>REST</td>
  </tr>
  <tr>
    <td>Google Safe Browsing</td>
    <td>Detect phishing or malicious job links</td>
    <td>REST</td>
  </tr>
  <tr>
    <td>LinkedIn Scraper API (optional)</td>
    <td>Fetch recruiter profiles for credibility check</td>
    <td>REST</td>
  </tr>
</table>

<hr>

<h2>🛠️ Installation & Setup</h2>

<h3>1️⃣ Clone Repository</h3>
<pre><code>git clone https://github.com/yourusername/recruiter-risk.git
cd recruiter-risk
</code></pre>

<h3>2️⃣ Backend Setup</h3>
<pre><code>cd backend
npm install
</code></pre>

<h3>3️⃣ Frontend Setup</h3>
<pre><code>cd ../frontend
npm install
</code></pre>

<h3>4️⃣ Run the Servers</h3>
<p><b>Backend:</b></p>
<pre><code>cd backend
npm run dev
</code></pre>

<p><b>Frontend:</b></p>
<pre><code>cd frontend
npm run dev
</code></pre>

<hr>

<h2>🔑 Environment Variables</h2>

<h3>Backend <code>.env</code></h3>
<pre>
PORT=5000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.qfwmydatmystzglebfnf.supabase.co:5432/postgres
JWT_SECRET=your_super_secret_jwt_key_here
</pre>



<hr>

<h2>🚀 Deployment</h2>
<ul>
  <li><b>Backend:</b> Render </li>
  <li><b>Frontend:</b> Vercel </li>
  <li><b>Database:</b> Supabase Postgres</li>
</ul>


<hr>

<h2>💡 Future Enhancements</h2>
<ul>
  <li>AI-powered sentiment analysis for recruiter feedback.</li>
  <li>Chrome extension for real-time recruiter credibility checks.</li>
  <li>Blockchain-based recruiter verification module.</li>
  <li>LinkedIn OAuth integration for recruiter identity verification.</li>
</ul>

<hr>

<h2>👥 Contributors/Developer</h2>
<ul>
  <li><b>Adarsha K K</b> – Full Stack Developer (<a href="mailto:adarshakk1234@gmail.com">adarshakk1234@gmail.com</a>)</li>
</ul>

<hr>

<h2>📜 License</h2>
<p>
  Licensed under the <b>MIT License</b>. See the LICENSE file for more details.
</p>

<hr>

<p align="center">⭐ If you found this project useful, give it a star on GitHub!</p>
