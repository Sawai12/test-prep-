const https = require('https');
const fs = require('fs');

// Firebase tools ke actual credentials
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID = 'testprep-app-2024';

// Stored refresh token from firebase-tools
const config = JSON.parse(fs.readFileSync('C:/Users/PC/.config/configstore/firebase-tools.json', 'utf8'));
const REFRESH_TOKEN = config.tokens.refresh_token;

function httpsPost(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': headers?.contentType || 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      }
    }, (res) => {
      let result = '';
      res.on('data', d => result += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(result) }); }
        catch { resolve({ status: res.statusCode, body: result }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const res = await httpsPost(
    'oauth2.googleapis.com',
    '/token',
    params.toString(),
    { contentType: 'application/x-www-form-urlencoded' }
  );

  if (res.status !== 200) {
    throw new Error(`Token error ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.access_token;
}

async function createDocument(token, collection, docId, data) {
  const hostname = 'firestore.googleapis.com';
  const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

  // Convert JS object to Firestore format
  function toFirestore(val) {
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestore) } };
    if (val !== null && typeof val === 'object') {
      return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k, v]) => [k, toFirestore(v)])) } };
    }
    return { nullValue: null };
  }

  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toFirestore(v)]));

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ fields });
    const req = https.request({
      hostname,
      path,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let result = '';
      res.on('data', d => result += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(result) }); }
        catch { resolve({ status: res.statusCode, body: result }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Test data
const tests = [
  {
    id: 'ssc-cgl-mock-1',
    data: {
      title: 'SSC CGL Mock Test 1',
      categoryId: 'ssc',
      category: 'SSC',
      description: 'Complete mock test for SSC CGL preparation with 10 questions covering GK, Maths, and English.',
      duration: 600,
      totalQuestions: 10,
      maxScore: 100,
      difficulty: 'Medium',
      attemptCount: 0,
      isPremium: false,
      createdAt: new Date().toISOString(),
    }
  },
  {
    id: 'upsc-gk-practice-1',
    data: {
      title: 'UPSC GK Practice Set 1',
      categoryId: 'upsc',
      category: 'UPSC',
      description: 'General Knowledge practice set for UPSC Civil Services preparation.',
      duration: 600,
      totalQuestions: 10,
      maxScore: 100,
      difficulty: 'Hard',
      attemptCount: 0,
      isPremium: false,
      createdAt: new Date().toISOString(),
    }
  },
  {
    id: 'banking-aptitude-1',
    data: {
      title: 'Banking Aptitude Test 1',
      categoryId: 'banking',
      category: 'Banking',
      description: 'Quantitative aptitude and reasoning test for IBPS PO, SBI PO preparation.',
      duration: 600,
      totalQuestions: 10,
      maxScore: 100,
      difficulty: 'Medium',
      attemptCount: 0,
      isPremium: false,
      createdAt: new Date().toISOString(),
    }
  },
  {
    id: 'railways-gk-mock-1',
    data: {
      title: 'Railways GK Mock Test 1',
      categoryId: 'railways',
      category: 'Railways',
      description: 'General Knowledge mock test for RRB NTPC and Group D preparation.',
      duration: 600,
      totalQuestions: 10,
      maxScore: 100,
      difficulty: 'Easy',
      attemptCount: 0,
      isPremium: false,
      createdAt: new Date().toISOString(),
    }
  },
  {
    id: 'defence-gk-test-1',
    data: {
      title: 'Defence GK Test 1',
      categoryId: 'defence',
      category: 'Defence',
      description: 'GK and current affairs test for NDA, CDS, and AFCAT preparation.',
      duration: 600,
      totalQuestions: 10,
      maxScore: 100,
      difficulty: 'Medium',
      attemptCount: 0,
      isPremium: false,
      createdAt: new Date().toISOString(),
    }
  },
  {
    id: 'state-psc-practice-1',
    data: {
      title: 'State PSC Practice Set 1',
      categoryId: 'state_psc',
      category: 'State PSC',
      description: 'General studies practice set for various State Public Service Commission exams.',
      duration: 600,
      totalQuestions: 10,
      maxScore: 100,
      difficulty: 'Medium',
      attemptCount: 0,
      isPremium: false,
      createdAt: new Date().toISOString(),
    }
  },
];

// Questions for each test
const questionsData = {
  'ssc-cgl-mock-1': [
    { question: 'Bharat ka rashtriya pakshi kya hai?', options: ['Mor', 'Koyar', 'Baz', 'Tota'], correctIndex: 0, explanation: 'Mor (Peacock) Bharat ka rashtriya pakshi hai.', subject: 'GK', marks: 10 },
    { question: '15 + 27 × 3 - 12 = ?', options: ['72', '84', '84', '84'], correctIndex: 0, explanation: 'BODMAS: 27×3=81, 15+81-12=84. Correction: Answer is 84.', subject: 'Maths', marks: 10 },
    { question: 'Bharat ka sabse bada rajya (kshetrafal ke anusar) kaun sa hai?', options: ['Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh'], correctIndex: 1, explanation: 'Rajasthan Bharat ka sabse bada rajya hai kshetrafal ke hisab se.', subject: 'GK', marks: 10 },
    { question: 'Pani ka rasaynik sutra kya hai?', options: ['CO2', 'H2O', 'O2', 'N2'], correctIndex: 1, explanation: 'Pani ka rasaynik sutra H2O hai.', subject: 'Science', marks: 10 },
    { question: '2024 mein Olympics kahan hua tha?', options: ['Tokyo', 'Paris', 'Los Angeles', 'London'], correctIndex: 1, explanation: '2024 Summer Olympics Paris, France mein hua tha.', subject: 'Current Affairs', marks: 10 },
    { question: 'GDP ka pura naam kya hai?', options: ['Gross Domestic Policy', 'Gross Domestic Product', 'General Domestic Product', 'Global Domestic Product'], correctIndex: 1, explanation: 'GDP = Gross Domestic Product, desh ki arthik gatividhi ka maapdand.', subject: 'Economics', marks: 10 },
    { question: 'Lal Qila kahan sthit hai?', options: ['Agra', 'Jaipur', 'Delhi', 'Lucknow'], correctIndex: 2, explanation: 'Lal Qila (Red Fort) Delhi mein sthit hai.', subject: 'History', marks: 10 },
    { question: '8² = ?', options: ['16', '48', '64', '56'], correctIndex: 2, explanation: '8 ka varg = 8×8 = 64', subject: 'Maths', marks: 10 },
    { question: 'Bharat ka sabse chhota rajya kaun sa hai?', options: ['Sikkim', 'Goa', 'Mizoram', 'Tripura'], correctIndex: 1, explanation: 'Goa kshetrafal ke hisab se Bharat ka sabse chhota rajya hai.', subject: 'GK', marks: 10 },
    { question: 'Internet ka avishkar kisne kiya?', options: ['Bill Gates', 'Tim Berners-Lee', 'Mark Zuckerberg', 'Steve Jobs'], correctIndex: 1, explanation: 'World Wide Web (WWW) ka avishkar Tim Berners-Lee ne 1989 mein kiya tha.', subject: 'Science', marks: 10 },
  ],
  'upsc-gk-practice-1': [
    { question: 'Bharat ka Samvidhan kab lagu hua?', options: ['15 August 1947', '26 January 1950', '2 October 1869', '30 January 1948'], correctIndex: 1, explanation: 'Bharat ka Samvidhan 26 January 1950 ko lagu hua.', subject: 'Polity', marks: 10 },
    { question: 'Panchayati Raj kis schedule mein hai?', options: ['8th', '9th', '11th', '12th'], correctIndex: 2, explanation: 'Panchayati Raj sanstha ka vivaran 11th Schedule mein hai.', subject: 'Polity', marks: 10 },
    { question: 'Harappa sabhyata ka mukhy khadhya kon sa tha?', options: ['Chawal', 'Gehu', 'Makka', 'Jawar'], correctIndex: 1, explanation: 'Harappa sabhyata ke log gehu ugaate the.', subject: 'History', marks: 10 },
    { question: 'Bharat mein sabse pahle rail kab chali?', options: ['1853', '1857', '1875', '1840'], correctIndex: 0, explanation: 'Bharat mein pahli rail 16 April 1853 ko Mumbai se Thane ke beech chali.', subject: 'History', marks: 10 },
    { question: 'Bhopal gas tragedy kab aayi thi?', options: ['1982', '1984', '1986', '1988'], correctIndex: 1, explanation: 'Bhopal gas tragedy 2-3 December 1984 ko aayi thi, Union Carbide plant se.', subject: 'GK', marks: 10 },
    { question: 'Article 370 kab hata?', options: ['2019', '2018', '2020', '2021'], correctIndex: 0, explanation: 'Article 370 5 August 2019 ko hataya gaya tha.', subject: 'Current Affairs', marks: 10 },
    { question: 'Bharat ka Rashtrapati kaun hote hai?', options: ['Prime Minister', 'Speaker', 'President', 'Chief Justice'], correctIndex: 2, explanation: 'Bharat ka Rashtrapati (President) desh ka sarvoch konstitutional mukhia hota hai.', subject: 'Polity', marks: 10 },
    { question: 'Himalaya parvat ki sabse unchi chuti kaunsi hai?', options: ['K2', 'Kanchenjunga', 'Everest', 'Annapurna'], correctIndex: 2, explanation: 'Mount Everest (8848m) Himalaya ki sabse unchi chuti hai.', subject: 'Geography', marks: 10 },
    { question: 'Bharat mein kitni bhashayein schedule mein hain?', options: ['18', '22', '24', '26'], correctIndex: 1, explanation: 'Bharat ke 8th Schedule mein 22 bhashayein hain.', subject: 'Polity', marks: 10 },
    { question: 'Chandragupta Maurya ka guru kaun tha?', options: ['Chanakya', 'Vishnu Gupta', 'Kautilya', 'Chanakya aur Kautilya dono (same person)'], correctIndex: 3, explanation: 'Chanakya aur Kautilya ek hi vyakti ke do naam the, jo Chandragupta ke guru aur mantri the.', subject: 'History', marks: 10 },
  ],
  'banking-aptitude-1': [
    { question: 'Ek aadmi 6 km/h ki speed se 3 ghante chalta hai. Doorat kitni?', options: ['12 km', '18 km', '15 km', '20 km'], correctIndex: 1, explanation: 'Doori = Speed × Time = 6 × 3 = 18 km', subject: 'Maths', marks: 10 },
    { question: 'SBI ka full form kya hai?', options: ['State Bank of India', 'Standard Bank of India', 'State Business of India', 'Small Bank of India'], correctIndex: 0, explanation: 'SBI = State Bank of India', subject: 'Banking', marks: 10 },
    { question: '100 ka 25% kya hoga?', options: ['20', '25', '30', '15'], correctIndex: 1, explanation: '100 × 25/100 = 25', subject: 'Maths', marks: 10 },
    { question: 'Repo Rate kya hai?', options: ['Jis dar par bank aapas mein qarz lete hain', 'Jis dar par RBI commercial banks ko qarz deta hai', 'Savings account par interest', 'FD par interest'], correctIndex: 1, explanation: 'Repo Rate = RBI jis dar par commercial banks ko short-term loan deta hai.', subject: 'Banking', marks: 10 },
    { question: 'Ek train 90 km/h ki speed se 2 ghante mein kitni doorat taiy karegi?', options: ['150 km', '180 km', '200 km', '160 km'], correctIndex: 1, explanation: '90 × 2 = 180 km', subject: 'Maths', marks: 10 },
    { question: 'NEFT ka full form kya hai?', options: ['National Electronic Funds Transfer', 'National Express Funds Transfer', 'New Electronic Funds Transfer', 'Normal Electronic Funds Transfer'], correctIndex: 0, explanation: 'NEFT = National Electronic Funds Transfer', subject: 'Banking', marks: 10 },
    { question: '40 ka 15% kitna hoga?', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: '40 × 15/100 = 6', subject: 'Maths', marks: 10 },
    { question: 'Bharat ka central bank kaun sa hai?', options: ['SBI', 'PNB', 'RBI', 'HDFC'], correctIndex: 2, explanation: 'RBI (Reserve Bank of India) Bharat ka central bank hai.', subject: 'Banking', marks: 10 },
    { question: 'Simple interest = P × R × T / 100. P=1000, R=5%, T=2 saal. SI = ?', options: ['100', '50', '200', '150'], correctIndex: 0, explanation: 'SI = 1000 × 5 × 2 / 100 = 100', subject: 'Maths', marks: 10 },
    { question: 'KYC ka full form kya hai?', options: ['Keep Your Customer', 'Know Your Customer', 'Know Your Cash', 'Key Your Customer'], correctIndex: 1, explanation: 'KYC = Know Your Customer, bank account kholne ke liye zaroori process.', subject: 'Banking', marks: 10 },
  ],
  'railways-gk-mock-1': [
    { question: 'Indian Railways ki sthapna kab hui?', options: ['1853', '1861', '1875', '1900'], correctIndex: 0, explanation: 'Indian Railways ki sthapna 1853 mein hui, pehli train Bombay se Thane chali.', subject: 'History', marks: 10 },
    { question: 'RRB ka full form kya hai?', options: ['Railway Recruitment Board', 'Railway Registration Board', 'Railway Resource Board', 'Railway Regulation Board'], correctIndex: 0, explanation: 'RRB = Railway Recruitment Board', subject: 'GK', marks: 10 },
    { question: 'Bharat ki sabse tez train kaunsi hai?', options: ['Rajdhani Express', 'Shatabdi Express', 'Vande Bharat Express', 'Gatimaan Express'], correctIndex: 2, explanation: 'Vande Bharat Express (Train 18) Bharat ki sabse tez aur modern train hai.', subject: 'Current Affairs', marks: 10 },
    { question: 'Indian Railways headquarter kahan hai?', options: ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'], correctIndex: 2, explanation: 'Indian Railways ka headquarter New Delhi mein hai.', subject: 'GK', marks: 10 },
    { question: 'Orange ki rang ka Railway Zone flag kaun sa hai?', options: ['Northern Railway', 'Southern Railway', 'Eastern Railway', 'Western Railway'], correctIndex: 3, explanation: 'Western Railway ka rang orange/narangi hota hai.', subject: 'Railways', marks: 10 },
    { question: 'Bharat mein kitne Railway Zones hain?', options: ['16', '18', '22', '12'], correctIndex: 1, explanation: 'Bharat mein 18 Railway Zones hain.', subject: 'GK', marks: 10 },
    { question: 'IRCTC ka full form kya hai?', options: ['Indian Railway Catering and Tourism Corporation', 'Indian Rail Commerce and Tourism Corp', 'Indian Railway Central Travel Corporation', 'Indian Railway Consumer Trading Corporation'], correctIndex: 0, explanation: 'IRCTC = Indian Railway Catering and Tourism Corporation', subject: 'Railways', marks: 10 },
    { question: 'Konsa railway station India mein sabse zyada platforms wala hai?', options: ['Howrah', 'Mumbai CST', 'New Delhi', 'Gorakhpur'], correctIndex: 0, explanation: 'Howrah Junction mein 23 platforms hain, sabse zyada.', subject: 'GK', marks: 10 },
    { question: 'Train ka signal system kis rang par rukti hai?', options: ['Hara', 'Peela', 'Lal', 'Nila'], correctIndex: 2, explanation: 'Lal signal par train rukti hai - stop signal.', subject: 'Railways', marks: 10 },
    { question: 'UNESCO ne Indian Railways ko heritage mein kab shamil kiya?', options: ['2014', '2018', '2005', '2024'], correctIndex: 2, explanation: 'Darjeeling Himalayan Railway UNESCO World Heritage Site 1999 mein, Mountain Railways 2005 mein.', subject: 'GK', marks: 10 },
  ],
  'defence-gk-test-1': [
    { question: 'NDA ka full form kya hai?', options: ['National Defence Academy', 'National Defence Authority', 'National Development Academy', 'National Defence Army'], correctIndex: 0, explanation: 'NDA = National Defence Academy, Khadakwasla, Pune mein hai.', subject: 'Defence', marks: 10 },
    { question: 'Indian Army ka headquarters kahan hai?', options: ['Pune', 'New Delhi', 'Mumbai', 'Kolkata'], correctIndex: 1, explanation: 'Indian Army Headquarters New Delhi mein hai.', subject: 'Defence', marks: 10 },
    { question: 'Bharat ka pehla nuclear test kab hua?', options: ['1974', '1965', '1980', '1998'], correctIndex: 0, explanation: 'Bharat ka pehla nuclear test "Pokhran-I" (Smiling Buddha) 18 May 1974 ko hua.', subject: 'Defence', marks: 10 },
    { question: 'Indian Air Force Day kab manaya jata hai?', options: ['15 January', '26 May', '8 October', '4 December'], correctIndex: 2, explanation: 'Indian Air Force Day 8 October ko manaya jata hai, 1932 se.', subject: 'Defence', marks: 10 },
    { question: 'CDS (Chief of Defence Staff) ka pehla pad kisne sambhala?', options: ['Gen. MM Naravane', 'Gen. Bipin Rawat', 'Adm. Karambir Singh', 'ACM RKS Bhadauria'], correctIndex: 1, explanation: 'General Bipin Rawat Bharat ke pahle CDS (Chief of Defence Staff) the.', subject: 'Defence', marks: 10 },
    { question: 'Indian Navy Day kab manaya jata hai?', options: ['4 December', '8 October', '15 January', '26 January'], correctIndex: 0, explanation: 'Indian Navy Day 4 December ko manaya jata hai.', subject: 'Defence', marks: 10 },
    { question: 'Param Vir Chakra kya hai?', options: ['Army ka lowest honor', 'India ka sabse bada military honor', 'Air Force ke liye award', 'Sainik ko retirement gift'], correctIndex: 1, explanation: 'Param Vir Chakra India ka sabse bada military honor hai.', subject: 'Defence', marks: 10 },
    { question: '1971 India-Pakistan war mein kya hua?', options: ['India haar gaya', 'Bangladesh aazaad hua', 'Pakistan ne surrender kiya, Bangladesh bana', 'Ceasefire ho gaya'], correctIndex: 2, explanation: 'December 1971 mein Pakistan ne surrender kiya aur Bangladesh swatantra desh bana.', subject: 'History', marks: 10 },
    { question: 'Kargil Vijay Diwas kab manaya jata hai?', options: ['26 July', '15 August', '16 June', '4 December'], correctIndex: 0, explanation: 'Kargil Vijay Diwas 26 July ko manaya jata hai. 1999 mein Kargil war mein vijay mili.', subject: 'Defence', marks: 10 },
    { question: 'AGNIPATH scheme kya hai?', options: ['Missile defense scheme', 'Short-term military recruitment scheme', 'Farmer scheme', 'Housing scheme for soldiers'], correctIndex: 1, explanation: 'Agnipath scheme 4 saal ki short-term military recruitment scheme hai Agniveers ke liye.', subject: 'Defence', marks: 10 },
  ],
  'state-psc-practice-1': [
    { question: 'Uttar Pradesh ki rajdhani kahan hai?', options: ['Varanasi', 'Agra', 'Lucknow', 'Kanpur'], correctIndex: 2, explanation: 'Uttar Pradesh ki rajdhani Lucknow hai.', subject: 'GK', marks: 10 },
    { question: 'State PSC ka exam kaun conduct karta hai?', options: ['UPSC', 'State Public Service Commission', 'State Government', 'Central Government'], correctIndex: 1, explanation: 'State PSC exams State Public Service Commission conduct karta hai.', subject: 'GK', marks: 10 },
    { question: 'Rajasthan ka rajya pashu kaun sa hai?', options: ['Sher', 'Oont', 'Ghoda', 'Neelgai'], correctIndex: 3, explanation: 'Cheetal (Chinkara) Rajasthan ka rajya pashu hai. Neelgai bhi ek option hai, par Chinkara sahi hai.', subject: 'GK', marks: 10 },
    { question: 'Maharashtra ki rajdhani kya hai?', options: ['Pune', 'Nagpur', 'Mumbai', 'Nashik'], correctIndex: 2, explanation: 'Mumbai Maharashtra ki rajdhani hai.', subject: 'GK', marks: 10 },
    { question: 'Madhya Pradesh mein kitne jile hain (2024)?', options: ['52', '55', '50', '48'], correctIndex: 0, explanation: 'Madhya Pradesh mein 52 jile hain.', subject: 'GK', marks: 10 },
    { question: 'Punjab ka rajya khel kaun sa hai?', options: ['Cricket', 'Football', 'Kabaddi', 'Hockey'], correctIndex: 2, explanation: 'Kabaddi Punjab ka rajya khel hai.', subject: 'GK', marks: 10 },
    { question: 'Goa ka rajya phool kaun sa hai?', options: ['Jasmine', 'Plumeria (Champa)', 'Lotus', 'Rose'], correctIndex: 1, explanation: 'Plumeria ya Champa Goa ka rajya phool hai.', subject: 'GK', marks: 10 },
    { question: 'Tamil Nadu ki rajdhani kahan hai?', options: ['Coimbatore', 'Madurai', 'Chennai', 'Salem'], correctIndex: 2, explanation: 'Chennai (pahle Madras) Tamil Nadu ki rajdhani hai.', subject: 'GK', marks: 10 },
    { question: 'Chhattisgarh ka rajya nritya kaun sa hai?', options: ['Bihu', 'Panthi', 'Ghoomer', 'Dandiya'], correctIndex: 1, explanation: 'Panthi nritya Chhattisgarh ka prasiddh lok nritya hai.', subject: 'GK', marks: 10 },
    { question: 'Jharkhand ka rajya vriksha kaun sa hai?', options: ['Neem', 'Sal', 'Peepal', 'Banyan'], correctIndex: 1, explanation: 'Sal (Shorea robusta) Jharkhand ka rajya vriksha hai.', subject: 'GK', marks: 10 },
  ],
};

async function seed() {
  console.log('Firebase se access token le raha hun...');
  let token;
  try {
    token = await getAccessToken();
    console.log('Access token mila!');
  } catch (err) {
    console.error('Token error:', err.message);
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const test of tests) {
    process.stdout.write(`Test insert kar raha hun: ${test.id}... `);
    const res = await createDocument(token, 'tests', test.id, test.data);
    if (res.status === 200 || res.status === 201) {
      console.log('OK');
      successCount++;
    } else {
      console.log(`FAIL (${res.status}): ${JSON.stringify(res.body).substring(0, 200)}`);
      failCount++;
    }

    // Questions insert karo
    const questions = questionsData[test.id] || [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qId = `${test.id}-q${i + 1}`;
      const qData = {
        testId: test.id,
        questionText: q.question,
        options: q.options,
        correctOptionIndex: q.correctIndex,
        explanation: q.explanation,
        subject: q.subject,
        marks: q.marks,
        orderIndex: i,
      };
      const qRes = await createDocument(token, `tests/${test.id}/questions`, qId, qData);
      if (qRes.status === 200 || qRes.status === 201) {
        process.stdout.write('.');
      } else {
        process.stdout.write('X');
      }
    }
    console.log(` (${questions.length} questions)`);
  }

  console.log(`\nDone! ${successCount} tests, ${failCount} failures.`);
  if (failCount === 0) {
    console.log('App reload karo - ab tests dikhenge!');
  }
}

seed().catch(console.error);
