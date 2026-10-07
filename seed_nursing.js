const https = require('https');
const fs = require('fs');

const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID = 'testprep-app-2024';

const config = JSON.parse(fs.readFileSync('C:/Users/PC/.config/configstore/firebase-tools.json', 'utf8'));
const REFRESH_TOKEN = config.tokens.refresh_token;

function httpsPost(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({
      hostname, path, method: 'POST',
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

function httpsRequest(hostname, path, method, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname, path, method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(body && { 'Content-Length': Buffer.byteLength(body) }),
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
    if (body) req.write(body);
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

  const res = await httpsPost('oauth2.googleapis.com', '/token', params.toString(),
    { contentType: 'application/x-www-form-urlencoded' });

  if (res.status !== 200) throw new Error(`Token error ${res.status}`);
  return res.body.access_token;
}

async function deleteDocument(token, collection, docId) {
  const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await httpsRequest('firestore.googleapis.com', path, 'DELETE', null, token);
  return res.status === 200;
}

async function createDocument(token, collection, docId, data) {
  const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

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
  const body = { fields };

  const res = await httpsRequest('firestore.googleapis.com', path, 'PATCH', body, token);
  return res;
}

const nursingTests = [
  { id: 'gnm-anatomy-1', categoryId: 'gnm', category: 'GNM Nursing', title: 'GNM Anatomy Mock Test 1', description: 'Complete anatomy test for GNM nursing', duration: 1500, totalQuestions: 10, maxScore: 100, difficulty: 'Medium', isPremium: false },
  { id: 'anm-community-1', categoryId: 'anm', category: 'ANM Nursing', title: 'ANM Community Health Nursing 1', description: 'Community health nursing practice test for ANM', duration: 1200, totalQuestions: 10, maxScore: 100, difficulty: 'Easy', isPremium: false },
  { id: 'bsc-msn-1', categoryId: 'bsc_nursing', category: 'B.Sc Nursing', title: 'Medical-Surgical Nursing Test 1', description: 'Advanced MSN concepts for B.Sc nursing', duration: 1800, totalQuestions: 10, maxScore: 100, difficulty: 'Hard', isPremium: false },
  { id: 'aiims-pharma-1', categoryId: 'aiims_nursing', category: 'AIIMS Nursing', title: 'AIIMS Pharmacology Mock 1', description: 'Pharmacology test for AIIMS nursing entrance', duration: 1500, totalQuestions: 10, maxScore: 100, difficulty: 'Hard', isPremium: false },
  { id: 'staff-psych-1', categoryId: 'staff_nurse', category: 'Staff Nurse', title: 'Psychiatric Nursing Practice 1', description: 'Psychiatric nursing test for staff nurse exam', duration: 1200, totalQuestions: 10, maxScore: 100, difficulty: 'Medium', isPremium: false },
  { id: 'pgimer-obs-1', categoryId: 'pgimer', category: 'PGIMER / JIPMER', title: 'Obstetric & Gynecology Nursing 1', description: 'OB/GYN nursing for PGIMER/JIPMER', duration: 1800, totalQuestions: 10, maxScore: 100, difficulty: 'Hard', isPremium: false },
];

const questions = {
  'gnm-anatomy-1': [
    { question: 'Manushya sharir mein kitni haddiyan hoti hain?', options: ['186', '206', '216', '196'], correctIndex: 1, explanation: 'Vyask manushya mein 206 haddiyan hoti hain.', subject: 'Anatomy', marks: 10 },
    { question: 'Hriday ke kitne chamber hote hain?', options: ['3', '2', '4', '5'], correctIndex: 2, explanation: 'Hriday mein 4 chamber hote hain - 2 atrium aur 2 ventricles.', subject: 'Anatomy', marks: 10 },
    { question: 'Sabse lambi haddi sharir mein kaun si hai?', options: ['Spinal cord', 'Femur', 'Tibia', 'Fibula'], correctIndex: 1, explanation: 'Femur (thigh bone) sabse lambi haddi hai.', subject: 'Anatomy', marks: 10 },
    { question: 'Khoon mein kitni oxygen transport hoti hai?', options: ['Hemoglobin', 'Proteins', 'Lipids', 'Carbohydrates'], correctIndex: 0, explanation: 'Hemoglobin oxygen ko transport karta hai red blood cells mein.', subject: 'Anatomy', marks: 10 },
    { question: 'Aankh ka lens kis prakar ka protein hai?', options: ['Albumin', 'Crystallin', 'Globulin', 'Fibrinogen'], correctIndex: 1, explanation: 'Lens crystallin protein se bana hota hai.', subject: 'Anatomy', marks: 10 },
    { question: 'Brain mein kitne lobes hote hain?', options: ['2', '3', '4', '6'], correctIndex: 2, explanation: 'Cerebrum mein 4 lobes hote hain - Frontal, Parietal, Temporal, Occipital.', subject: 'Anatomy', marks: 10 },
    { question: 'Skin ka sabse bahar wala layer kya kehte hain?', options: ['Dermis', 'Epidermis', 'Subcutaneous', 'Hypodermis'], correctIndex: 1, explanation: 'Epidermis skin ka bahar wala protective layer hai.', subject: 'Anatomy', marks: 10 },
    { question: 'Liver ka main function kya hai?', options: ['Digestion', 'Detoxification', 'Filtration', 'Absorption'], correctIndex: 1, explanation: 'Liver body ke toxic substances ko detoxify karta hai.', subject: 'Anatomy', marks: 10 },
    { question: 'Kidney ka structural unit kya hai?', options: ['Glomerulus', 'Nephron', 'Tubule', 'Calyx'], correctIndex: 1, explanation: 'Nephron kidney ka functional aur structural unit hai.', subject: 'Anatomy', marks: 10 },
    { question: 'Lungs mein air sacs ko kya kehte hain?', options: ['Bronchioles', 'Alveoli', 'Bronchi', 'Trachea'], correctIndex: 1, explanation: 'Alveoli lungs ke air sacs hote hain jahan gas exchange hota hai.', subject: 'Anatomy', marks: 10 },
  ],
  'anm-community-1': [
    { question: 'Community health nursing ka main focus kya hai?', options: ['Hospital care', 'Prevention of disease', 'Emergency care', 'Surgical care'], correctIndex: 1, explanation: 'CHN disease prevention aur health promotion par focus karta hai.', subject: 'Community Health', marks: 10 },
    { question: 'Public health mein 5W1H mein H ka matlab?', options: ['How', 'Health', 'Help', 'Human'], correctIndex: 0, explanation: '5W1H = Who, What, When, Where, Why, How.', subject: 'Community Health', marks: 10 },
    { question: 'Maternal Mortality Rate (MMR) mein kya count hota hai?', options: ['Pregnant women', 'Deaths during pregnancy/childbirth', 'Infant deaths', 'Child deaths'], correctIndex: 1, explanation: 'MMR pregnant women aur childbirth mein deaths count karta hai.', subject: 'Community Health', marks: 10 },
    { question: 'Primary Health Centre (PHC) kis level par kaam karta hai?', options: ['National', 'State', 'Village/Community', 'District'], correctIndex: 2, explanation: 'PHC community/village level par health services provide karta hai.', subject: 'Community Health', marks: 10 },
    { question: 'Vaccination schedule mein BCG kis umar par lagate hain?', options: ['6 weeks', 'At birth', '6 months', '9 months'], correctIndex: 1, explanation: 'BCG vaccine birth ke turant baad (0 days) diya jata hai.', subject: 'Community Health', marks: 10 },
    { question: 'Infant Mortality Rate (IMR) se kya sabudha hai?', options: ['Deaths in 1st year of life', 'Deaths in 1st month', 'Deaths in 1st week', 'Fetal deaths'], correctIndex: 0, explanation: 'IMR 1000 live births par 1 year tak deaths count karta hai.', subject: 'Community Health', marks: 10 },
    { question: 'NRHM ka full form kya hai?', options: ['National Rural Health Mission', 'National Reproductive Health Mission', 'National Risk Health Measure', 'None'], correctIndex: 0, explanation: 'NRHM = National Rural Health Mission (ab NHM bola jata hai).', subject: 'Community Health', marks: 10 },
    { question: 'Nutrition survey mein kya measure kiya jata hai?', options: ['Weight', 'Height', 'Mid-upper arm circumference', 'Sab'], correctIndex: 3, explanation: 'Nutrition assessment mein weight, height, aur MUAC sab measure kiye jate hain.', subject: 'Community Health', marks: 10 },
    { question: 'Health indicator mein kaunsi unit use hota hai?', options: ['Per 100', 'Per 1000', 'Per 10000', 'Sab dhik hai'], correctIndex: 1, explanation: 'Most health indicators per 1000 population par express kiye jate hain.', subject: 'Community Health', marks: 10 },
    { question: 'Communicable disease control mein pehla step kya hai?', options: ['Treatment', 'Prevention', 'Early detection', 'Rehabilitation'], correctIndex: 2, explanation: 'Communicable disease mein early detection aur prompt treatment zaroori hai.', subject: 'Community Health', marks: 10 },
  ],
  'bsc-msn-1': [
    { question: 'Medical-Surgical Nursing ka scope kya hai?', options: ['Preventive care', 'Acute and chronic illness care', 'Psychological support', 'Sab'], correctIndex: 3, explanation: 'MSN adults ke acute, chronic, aur rehabilitative care cover karta hai.', subject: 'MSN', marks: 10 },
    { question: 'Shock ke stages mein pehla stage kaunsa hai?', options: ['Irreversible', 'Compensatory', 'Progressive', 'Refractory'], correctIndex: 1, explanation: 'Compensatory shock pehla stage hai jahan body compensate kar sakta hai.', subject: 'MSN', marks: 10 },
    { question: 'Wound healing mein inflammatory phase kitne din tak chalta hai?', options: ['3-5 days', '5-10 days', '24-72 hours', '10-14 days'], correctIndex: 2, explanation: 'Inflammatory phase wound healing mein 24-72 hours tak chalata hai.', subject: 'MSN', marks: 10 },
    { question: 'Post-operative complication mein thromboembolism se kya prevention karta hai?', options: ['Rest', 'Early mobilization', 'Antibiotics', 'Pain relief'], correctIndex: 1, explanation: 'Early mobilization thromboembolism prevention ka main measure hai.', subject: 'MSN', marks: 10 },
    { question: 'Fluid and electrolyte balance mein normal Na+ level kya hai?', options: ['120-140 mEq/L', '135-145 mEq/L', '145-155 mEq/L', '115-125 mEq/L'], correctIndex: 1, explanation: 'Normal serum sodium level 135-145 mEq/L hota hai.', subject: 'MSN', marks: 10 },
    { question: 'Catheterization mein kaunsa aseptic technique use karte hain?', options: ['Clean', 'Sterile', 'Non-sterile', 'Medical asepsis'], correctIndex: 1, explanation: 'Urinary catheterization sterile technique se kiya jata hai.', subject: 'MSN', marks: 10 },
    { question: 'Burn injury mein 20% se zyada fluid loss mein kya dena padta hai?', options: ['Blood transfusion', 'IV fluid', 'Oral fluid', 'Colloids'], correctIndex: 1, explanation: '20% se zyada burn mein IV fluids essential hote hain.', subject: 'MSN', marks: 10 },
    { question: 'Pain assessment ka most reliable method kaunsa hai?', options: ['Observation', 'Self-report', 'Vital signs', 'Behavior'], correctIndex: 1, explanation: 'Self-report patient ka pain ka most accurate measurement hai.', subject: 'MSN', marks: 10 },
    { question: 'Pressure ulcer prevention mein most important factor kya hai?', options: ['Nutrition', 'Frequent turning', 'Hygiene', 'Medication'], correctIndex: 1, explanation: 'Frequent position change (2-hourly) pressure ulcer prevention ke liye zaroori hai.', subject: 'MSN', marks: 10 },
    { question: 'Nasogastric tube insertion mein how far insert karte hain?', options: ['50-55 cm', '55-60 cm', '60-65 cm', '65-70 cm'], correctIndex: 1, explanation: 'NG tube approximately 55-60 cm insert kiya jata hai.', subject: 'MSN', marks: 10 },
  ],
  'aiims-pharma-1': [
    { question: 'Pharmacology ka definition kya hai?', options: ['Drug manufacturing', 'Study of drug action', 'Drug distribution', 'Drug sales'], correctIndex: 1, explanation: 'Pharmacology drugs aur unke body par effects ka study hai.', subject: 'Pharmacology', marks: 10 },
    { question: 'Half-life (t1/2) ka matlab kya hai?', options: ['Drug ban hone tak time', 'Drug peak concentration time', 'Time for 50% drug elimination', 'Time for drug absorption'], correctIndex: 2, explanation: 'Half-life woh time hai jab 50% drug body se eliminate ho jata hai.', subject: 'Pharmacology', marks: 10 },
    { question: 'Bioavailability (F) kya indicate karta hai?', options: ['Drug price', 'Drug percentage absorption', 'Drug effectiveness', 'Drug side effects'], correctIndex: 1, explanation: 'Bioavailability administered drug ka percentage joh systemic circulation mein jaata hai.', subject: 'Pharmacology', marks: 10 },
    { question: 'First pass metabolism kahan hota hai?', options: ['Stomach', 'Liver', 'Intestine', 'Blood'], correctIndex: 1, explanation: 'First pass metabolism liver mein hota hai oral drugs ke liye.', subject: 'Pharmacology', marks: 10 },
    { question: 'Aspirin ka main mechanism of action kya hai?', options: ['Antipyretic', 'Analgesic', 'COX inhibition', 'Sab'], correctIndex: 3, explanation: 'Aspirin cyclooxygenase inhibit karta hai, antisepsis, analgesic, aur antiplatelet action hai.', subject: 'Pharmacology', marks: 10 },
    { question: 'Antibiotics ka main target kya hai?', options: ['Human cells', 'Bacterial cell wall', 'Virus', 'Fungi'], correctIndex: 1, explanation: 'Antibiotics bacterial cell wall ya protein synthesis target karte hain.', subject: 'Pharmacology', marks: 10 },
    { question: 'Penicillin allergy se kaunsa reaction hota hai?', options: ['Hypoglycemia', 'Anaphylaxis', 'Hyperkalemia', 'Acidosis'], correctIndex: 1, explanation: 'Penicillin allergy se anaphylaxis jaise serious reaction ho sakte hain.', subject: 'Pharmacology', marks: 10 },
    { question: 'Drug-drug interaction mein kaunsa type hota hai?', options: ['Pharmacokinetic', 'Pharmacodynamic', 'Dono', 'Koi nahi'], correctIndex: 2, explanation: 'Drug interactions pharmacokinetic (absorption, metabolism) aur pharmacodynamic (action) ho sakte hain.', subject: 'Pharmacology', marks: 10 },
    { question: 'Therapeutic drug monitoring kis drug ke liye zaroori hai?', options: ['Paracetamol', 'Digoxin', 'Aspirin', 'Metformin'], correctIndex: 1, explanation: 'Digoxin narrow therapeutic index hai toh monitoring zaroori hai.', subject: 'Pharmacology', marks: 10 },
    { question: 'Adverse drug reaction mein Type A reaction kya hota hai?', options: ['Unpredictable', 'Dose-dependent', 'Allergic', 'Idiosyncratic'], correctIndex: 1, explanation: 'Type A ADR dose-dependent aur predictable hote hain.', subject: 'Pharmacology', marks: 10 },
  ],
  'staff-psych-1': [
    { question: 'Psychiatry ka focus kaun hota hai?', options: ['Mental disorders', 'Physical disorders', 'Infectious diseases', 'Trauma'], correctIndex: 0, explanation: 'Psychiatry mental health disorders aur psychological conditions par focus karta hai.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Depression ke symptoms mein kaunsa main symptom nahi hai?', options: ['Sadness', 'Loss of interest', 'Increased energy', 'Guilt'], correctIndex: 2, explanation: 'Depression mein decreased energy hota hai, increased energy nahi.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Anxiety disorder treatment mein kaunsa therapy use hota hai?', options: ['Surgery', 'Cognitive Behavioral Therapy', 'Radiation', 'Antibiotics'], correctIndex: 1, explanation: 'CBT anxiety disorders ke liye most effective psychological treatment hai.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Schizophrenia mein positive symptoms kaunse hote hain?', options: ['Hallucinations, Delusions', 'Apathy, Social withdrawal', 'Depression', 'Confusion'], correctIndex: 0, explanation: 'Positive symptoms hallucinations aur delusions hote hain schizophrenia mein.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Therapeutic communication technique mein kaunsa effective nahi hai?', options: ['Active listening', 'Empathy', 'Giving advice', 'Reflection'], correctIndex: 2, explanation: 'Advice dena therapeutic communication mein effective nahi hai, patient ko empower karna chahiye.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Suicide assessment mein kaunsa question important hai?', options: ['Kya aap khush hain?', 'Kya aapne suicide ke baare mein socha hai?', 'Aapka paisa kaisa hai?', 'Aapka kaam kaisa hai?'], correctIndex: 1, explanation: 'Direct questioning suicidal ideation about important aur safe hai.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Psychotropic drugs mein kaunsa category anxiety kam karta hai?', options: ['Antipsychotics', 'Anxiolytics', 'Antidepressants', 'Mood stabilizers'], correctIndex: 1, explanation: 'Anxiolytics anxiety disorders treatment mein use hote hain.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Mental status examination mein kaunsa component include nahi hota?', options: ['Orientation', 'Memory', 'Mood', 'Blood pressure'], correctIndex: 3, explanation: 'Blood pressure physical examination ka part hai, mental status exam mein nahi.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Behavior modification technique mein kaunsa principle use hota hai?', options: ['Classical conditioning', 'Operant conditioning', 'Observational learning', 'Sab'], correctIndex: 3, explanation: 'Behavior modification multiple conditioning principles use karta hai.', subject: 'Psychiatric Nursing', marks: 10 },
    { question: 'Milieu therapy mein kya important hai?', options: ['Medication', 'Therapeutic environment', 'Physical exercise', 'Diet'], correctIndex: 1, explanation: 'Milieu therapy therapeutic aur supportive environment create karna emphasize karta hai.', subject: 'Psychiatric Nursing', marks: 10 },
  ],
  'pgimer-obs-1': [
    { question: 'Obstetrics ka scope kya hai?', options: ['Pregnancy aur childbirth', 'Gynecological disorders', 'Infertility', 'Contraception'], correctIndex: 0, explanation: 'Obstetrics pregnancy, labour, aur puerperium ke care se related hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Normal pregnancy duration kitne weeks ka hota hai?', options: ['36 weeks', '38 weeks', '40 weeks', '42 weeks'], correctIndex: 2, explanation: 'Normal pregnancy approximately 40 weeks (280 days) ka hota hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Trimester division mein first trimester kitne weeks tak hota hai?', options: ['0-12 weeks', '0-13 weeks', '0-14 weeks', '0-15 weeks'], correctIndex: 1, explanation: 'First trimester pregnancy ke 0-13 weeks tak hota hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Antenatal care mein routine screening mein kya include hota hai?', options: ['Blood pressure', 'Urine test', 'Weight check', 'Sab'], correctIndex: 3, explanation: 'Antenatal care mein comprehensive screening sab parameters ka hota hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Labor ke stages mein first stage kitni der tak chalti hai?', options: ['2-3 hours', '6-8 hours', '8-12 hours', '12-16 hours'], correctIndex: 2, explanation: 'First stage (latent aur active phase) typically 8-12 hours tak chalti hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Partograph recording mein main feature kya hai?', options: ['Blood pressure', 'Progress of labor', 'Fetal heart rate', 'Maternal pulse'], correctIndex: 1, explanation: 'Partograph labor ke progress aur complications ko track karta hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Postpartum hemorrhage mein kaunsa sign first appear hota hai?', options: ['Hypotension', 'Tachycardia', 'Pallor', 'Confusion'], correctIndex: 1, explanation: 'Tachycardia postpartum hemorrhage ka early sign hota hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Puerperium period kitne din ka hota hai?', options: ['3 weeks', '4 weeks', '6 weeks', '8 weeks'], correctIndex: 2, explanation: 'Puerperium (postpartum period) approximately 6 weeks ka hota hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Breastfeeding mein colostrum kab tak milta hai?', options: ['2-3 days', '3-5 days', '5-7 days', '7-10 days'], correctIndex: 1, explanation: 'Colostrum first 3-5 days mein secreted hota hai.', subject: 'OB/GYN', marks: 10 },
    { question: 'Contraception mein kaunsa most reliable method hai?', options: ['Barrier method', 'Intrauterine device', 'Permanent sterilization', 'Lactational amenorrhea'], correctIndex: 2, explanation: 'Permanent sterilization (tubal ligation/vasectomy) most reliable contraceptive method hai.', subject: 'OB/GYN', marks: 10 },
  ],
};

async function seed() {
  console.log('Nursing exam app setup kar raha hun...');
  let token;
  try {
    token = await getAccessToken();
    console.log('Access token mila!');
  } catch (err) {
    console.error('Token error:', err.message);
    process.exit(1);
  }

  // Purana government exam data delete karo
  const oldIds = ['ssc-cgl-mock-1', 'upsc-gk-practice-1', 'banking-aptitude-1', 'railways-gk-mock-1', 'defence-gk-test-1', 'state-psc-practice-1'];
  console.log('Purana data delete kar raha hun...');
  for (const id of oldIds) {
    await deleteDocument(token, 'tests', id);
  }

  let successCount = 0;
  let failCount = 0;

  // Naya nursing data add karo
  for (const test of nursingTests) {
    process.stdout.write(`Test insert: ${test.id}... `);
    const res = await createDocument(token, 'tests', test.id, test);
    if (res.status === 200 || res.status === 201) {
      console.log('OK');
      successCount++;
    } else {
      console.log(`FAIL (${res.status})`);
      failCount++;
      continue;
    }

    // Questions add karo
    const qs = questions[test.id] || [];
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const qId = `q${i + 1}`;
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
    console.log(` (${qs.length} questions)`);
  }

  console.log(`\nDone! ${successCount} tests, ${failCount} failures.`);
  console.log('App ko reload karo - ab nursing exams dikhenge!');
}

seed().catch(console.error);
