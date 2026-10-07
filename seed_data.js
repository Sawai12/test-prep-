const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');

// Firebase token se credential banana
const config = JSON.parse(fs.readFileSync('C:/Users/PC/.config/configstore/firebase-tools.json','utf8'));
const refreshToken = config.tokens.refresh_token;

const credential = {
  getAccessToken: async () => {
    const https = require('https');
    return new Promise((resolve, reject) => {
      const postData = `client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com&client_secret=j9iVZfS8ggxEFETDg&grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;
      const req = https.request({
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          const d = JSON.parse(data);
          if(d.access_token) resolve({ access_token: d.access_token, expires_in: d.expires_in });
          else reject(new Error('No token: ' + data));
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
};

initializeApp({ credential, projectId: 'testprep-app-2024' });
const db = getFirestore();

const questions = [
  { question: "India ka rashtriya pakshi kya hai?", options: ["Mor", "Kabutar", "Baz", "Tota"], correctIndex: 0, explanation: "Mor (Peacock) India ka rashtriya pakshi hai.", subject: "GK", difficulty: "easy" },
  { question: "Bharat ki rajdhani kya hai?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctIndex: 1, explanation: "New Delhi Bharat ki rajdhani hai.", subject: "GK", difficulty: "easy" },
  { question: "2 + 2 x 4 = ?", options: ["16", "10", "8", "12"], correctIndex: 1, explanation: "BODMAS: 2x4=8, 2+8=10", subject: "Maths", difficulty: "easy" },
  { question: "Discovery of India kisne likhi?", options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "B.R. Ambedkar"], correctIndex: 1, explanation: "Jawaharlal Nehru ne 1946 mein likhi.", subject: "History", difficulty: "medium" },
  { question: "Sabse bada grah kaunsa hai?", options: ["Saturn", "Jupiter", "Uranus", "Neptune"], correctIndex: 1, explanation: "Jupiter sabse bada grah hai.", subject: "Science", difficulty: "easy" },
  { question: "15% of 400 = ?", options: ["45", "60", "75", "90"], correctIndex: 1, explanation: "15/100 x 400 = 60", subject: "Maths", difficulty: "easy" },
  { question: "Pani ka chemical formula kya hai?", options: ["CO2", "H2O2", "H2O", "O2"], correctIndex: 2, explanation: "H2O", subject: "Science", difficulty: "easy" },
  { question: "GDP ka full form kya hai?", options: ["General Domestic Product", "Gross Domestic Product", "Global Domestic Product", "Grand Domestic Product"], correctIndex: 1, explanation: "Gross Domestic Product", subject: "Economics", difficulty: "easy" },
  { question: "Tipu Sultan ki rajdhani kaunsi thi?", options: ["Mysore", "Srirangapatna", "Bangalore", "Mangalore"], correctIndex: 1, explanation: "Srirangapatna.", subject: "History", difficulty: "medium" },
  { question: "Right to Work kya hai?", options: ["Maulik Adhikar", "Directive Principle", "Mulbhoot Kartavya", "Koi nahi"], correctIndex: 1, explanation: "Directive Principle hai.", subject: "Polity", difficulty: "medium" },
];

const tests = [
  { title: "SSC CGL Mock Test 1", examId: "ssc", examName: "SSC CGL", subject: "General", totalQuestions: 10, durationMinutes: 15, marksPerQuestion: 2, negativeMarks: 0, difficulty: "medium", isPremium: false, isFree: true, attemptCount: 1250 },
  { title: "UPSC GK Practice Set", examId: "upsc", examName: "UPSC", subject: "GK", totalQuestions: 10, durationMinutes: 15, marksPerQuestion: 2, negativeMarks: 0, difficulty: "medium", isPremium: false, isFree: true, attemptCount: 980 },
  { title: "Banking Aptitude Test", examId: "banking", examName: "IBPS PO", subject: "Aptitude", totalQuestions: 10, durationMinutes: 15, marksPerQuestion: 2, negativeMarks: 0, difficulty: "medium", isPremium: false, isFree: true, attemptCount: 2100 },
  { title: "Railways GK Mock", examId: "railways", examName: "RRB NTPC", subject: "GK", totalQuestions: 10, durationMinutes: 15, marksPerQuestion: 2, negativeMarks: 0, difficulty: "easy", isPremium: false, isFree: true, attemptCount: 1800 },
  { title: "Defence GK Test", examId: "defence", examName: "CDS", subject: "GK", totalQuestions: 10, durationMinutes: 15, marksPerQuestion: 2, negativeMarks: 0, difficulty: "medium", isPremium: false, isFree: true, attemptCount: 750 },
  { title: "State PSC Practice", examId: "state", examName: "State PSC", subject: "GS", totalQuestions: 10, durationMinutes: 15, marksPerQuestion: 2, negativeMarks: 0, difficulty: "medium", isPremium: false, isFree: true, attemptCount: 920 },
];

async function seed() {
  console.log('Firestore mein data daal raha hu...');
  for (const test of tests) {
    const ref = await db.collection('tests').add(test);
    console.log('Test bana:', test.title);
    for (const q of questions) await ref.collection('questions').add(q);
    console.log('  10 questions add ho gaye');
  }
  console.log('\nSab data add ho gaya! App refresh karo.');
  process.exit(0);
}
seed().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
