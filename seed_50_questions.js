const https = require('https');
const fs = require('fs');

const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID = 'testprep-app-2024';

const config = JSON.parse(fs.readFileSync('C:/Users/PC/.config/configstore/firebase-tools.json', 'utf8'));
const REFRESH_TOKEN = config.tokens.refresh_token;

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

  return httpsRequest('firestore.googleapis.com', path, 'PATCH', body, token);
}

// 50 questions per test - expanded nursing content
const questions = {
  'gnm-anatomy-1': [
    { q: 'Manushya sharir mein kitni haddiyan hoti hain?', opts: ['186', '206', '216', '196'], ans: 1, exp: 'Vyask manushya mein 206 haddiyan hoti hain.', subj: 'Anatomy' },
    { q: 'Hriday ke kitne chamber hote hain?', opts: ['3', '2', '4', '5'], ans: 2, exp: 'Hriday mein 4 chamber hote hain - 2 atrium aur 2 ventricles.', subj: 'Anatomy' },
    { q: 'Sabse lambi haddi sharir mein kaun si hai?', opts: ['Spinal cord', 'Femur', 'Tibia', 'Fibula'], ans: 1, exp: 'Femur (thigh bone) sabse lambi haddi hai.', subj: 'Anatomy' },
    { q: 'Khoon mein kitni oxygen transport hoti hai?', opts: ['Hemoglobin', 'Proteins', 'Lipids', 'Carbohydrates'], ans: 0, exp: 'Hemoglobin oxygen ko transport karta hai.', subj: 'Anatomy' },
    { q: 'Aankh ka lens kis prakar ka protein hai?', opts: ['Albumin', 'Crystallin', 'Globulin', 'Fibrinogen'], ans: 1, exp: 'Lens crystallin protein se bana hota hai.', subj: 'Anatomy' },
    { q: 'Brain mein kitne lobes hote hain?', opts: ['2', '3', '4', '6'], ans: 2, exp: 'Cerebrum mein 4 lobes hote hain.', subj: 'Anatomy' },
    { q: 'Skin ka sabse bahar wala layer?', opts: ['Dermis', 'Epidermis', 'Subcutaneous', 'Hypodermis'], ans: 1, exp: 'Epidermis skin ka bahar wala protective layer.', subj: 'Anatomy' },
    { q: 'Liver ka main function kya hai?', opts: ['Digestion', 'Detoxification', 'Filtration', 'Absorption'], ans: 1, exp: 'Liver body ke toxic substances ko detoxify karta hai.', subj: 'Anatomy' },
    { q: 'Kidney ka structural unit?', opts: ['Glomerulus', 'Nephron', 'Tubule', 'Calyx'], ans: 1, exp: 'Nephron kidney ka functional unit hai.', subj: 'Anatomy' },
    { q: 'Lungs mein air sacs ko kya kehte hain?', opts: ['Bronchioles', 'Alveoli', 'Bronchi', 'Trachea'], ans: 1, exp: 'Alveoli lungs ke air sacs hote hain.', subj: 'Anatomy' },
    { q: 'Thyroid gland kahan sthit hota hai?', opts: ['Brain', 'Neck', 'Chest', 'Abdomen'], ans: 1, exp: 'Thyroid gland neck mein larynx ke samne hota hai.', subj: 'Anatomy' },
    { q: 'Pancreas kis qism ka gland hai?', opts: ['Endocrine', 'Exocrine', 'Dono', 'Ductless'], ans: 2, exp: 'Pancreas endocrine aur exocrine dono qism ka gland hai.', subj: 'Anatomy' },
    { q: 'RBC ka lifespan kitna hota hai?', opts: ['60 days', '80 days', '100 days', '120 days'], ans: 3, exp: 'Red blood cells ka average lifespan 120 days hota hai.', subj: 'Anatomy' },
    { q: 'WBC ka main function kya hai?', opts: ['Oxygen carry', 'Immunity', 'Clotting', 'Nutrition'], ans: 1, exp: 'White blood cells body ke immune defense ke liye responsible hote hain.', subj: 'Anatomy' },
    { q: 'Platelet ka main function?', opts: ['Oxygen transport', 'Blood clotting', 'Infection fight', 'Nutrition'], ans: 1, exp: 'Platelets blood clotting mein important role play karte hain.', subj: 'Anatomy' },
    { q: 'Heart beat normally kitni baar hoti hai?', opts: ['60-80', '80-100', '100-120', '50-70'], ans: 0, exp: 'Normal resting heart rate 60-80 bpm hota hai.', subj: 'Anatomy' },
    { q: 'Respiratory rate normally kitni hoti hai?', opts: ['10-15', '12-20', '20-30', '30-40'], ans: 1, exp: 'Normal respiratory rate 12-20 breaths per minute hota hai.', subj: 'Anatomy' },
    { q: 'Blood pressure normal kitna hota hai?', opts: ['100/60', '110/70', '120/80', '130/90'], ans: 2, exp: 'Normal blood pressure 120/80 mmHg consider kiya jata hai.', subj: 'Anatomy' },
    { q: 'Temperature normal kitna hota hai?', opts: ['96.5F', '98.6F', '99.5F', '101F'], ans: 1, exp: 'Normal body temperature 98.6F (37C) hota hai.', subj: 'Anatomy' },
    { q: 'Esophagus ki length kitni hoti hai?', opts: ['10-12 inches', '15-18 inches', '20-24 inches', '24-28 inches'], ans: 1, exp: 'Esophagus approximately 10 inches (25 cm) lambi hoti hai.', subj: 'Anatomy' },
    { q: 'Stomach ki capacity kitni hoti hai?', opts: ['500 ml', '1 liter', '1.5 liter', '2 liter'], ans: 2, exp: 'Stomach ki capacity approximately 1-1.5 liter hoti hai.', subj: 'Anatomy' },
    { q: 'Small intestine ki length?', opts: ['5 feet', '10 feet', '15-20 feet', '25-30 feet'], ans: 2, exp: 'Small intestine approximately 15-20 feet lambi hoti hai.', subj: 'Anatomy' },
    { q: 'Large intestine ki length?', opts: ['5-6 feet', '10-12 feet', '15-20 feet', '20-25 feet'], ans: 0, exp: 'Large intestine (colon) approximately 5-6 feet lambi hoti hai.', subj: 'Anatomy' },
    { q: 'Spinal cord mein kitne vertebrae hote hain?', opts: ['24', '33', '26', '31'], ans: 1, exp: 'Spine mein 33 vertebrae hote hain (cervical 7, thoracic 12, lumbar 5, sacral 5, coccygeal 4).', subj: 'Anatomy' },
    { q: 'Ribs ki number kitni hoti hai?', opts: ['10 pairs', '11 pairs', '12 pairs', '13 pairs'], ans: 2, exp: 'Human mein 12 pairs ribs hoti hain.', subj: 'Anatomy' },
    { q: 'Muscles body mein kitne percent hote hain?', opts: ['20%', '30%', '40%', '50%'], ans: 2, exp: 'Muscles body ka approximately 40% weight hote hain.', subj: 'Anatomy' },
    { q: 'Skin body ka kitna percent cover karta hai?', opts: ['10%', '15%', '20%', '25%'], ans: 2, exp: 'Skin body surface area ka approximately 20% cover karta hai (1.5-2 sq meters).', subj: 'Anatomy' },
    { q: 'Glucose normal range blood mein?', opts: ['70-80 mg/dl', '80-120 mg/dl', '120-150 mg/dl', '150-180 mg/dl'], ans: 1, exp: 'Normal fasting blood glucose 80-120 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Hemoglobin normal level males mein?', opts: ['10-12 g/dl', '12-14 g/dl', '13-16 g/dl', '16-18 g/dl'], ans: 2, exp: 'Normal hemoglobin in males 13.5-16 g/dl hota hai.', subj: 'Anatomy' },
    { q: 'WBC count normal range?', opts: ['3000-5000', '5000-10000', '10000-15000', '15000-20000'], ans: 1, exp: 'Normal WBC count 5000-10000 cells/microliter hota hai.', subj: 'Anatomy' },
    { q: 'Calcium normal level blood mein?', opts: ['6-7 mg/dl', '8-10 mg/dl', '10-12 mg/dl', '12-14 mg/dl'], ans: 1, exp: 'Normal serum calcium 8.5-10.2 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Potassium normal level?', opts: ['2-3 mEq/L', '3.5-5 mEq/L', '5-6 mEq/L', '6-7 mEq/L'], ans: 1, exp: 'Normal serum potassium 3.5-5 mEq/L hota hai.', subj: 'Anatomy' },
    { q: 'Sodium normal level?', opts: ['120-130 mEq/L', '130-140 mEq/L', '135-145 mEq/L', '145-155 mEq/L'], ans: 2, exp: 'Normal serum sodium 135-145 mEq/L hota hai.', subj: 'Anatomy' },
    { q: 'Albumin normal level?', opts: ['2-3 g/dl', '3.5-5 g/dl', '5-6 g/dl', '6-7 g/dl'], ans: 1, exp: 'Normal serum albumin 3.5-5 g/dl hota hai.', subj: 'Anatomy' },
    { q: 'Cholesterol normal level?', opts: ['100-150', '150-200', 'Less than 200', '200-250'], ans: 2, exp: 'Normal total cholesterol less than 200 mg/dl consider kiya jata hai.', subj: 'Anatomy' },
    { q: 'Triglycerides normal level?', opts: ['50-100', '100-150', 'Less than 150', '150-200'], ans: 2, exp: 'Normal triglycerides less than 150 mg/dl hote hain.', subj: 'Anatomy' },
    { q: 'Bilirubin normal level?', opts: ['0.1-0.3 mg/dl', '0.5-1 mg/dl', '1-1.5 mg/dl', '1.5-2 mg/dl'], ans: 0, exp: 'Normal total bilirubin 0.1-1.2 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Creatinine normal level males?', opts: ['0.5-0.8', '0.8-1.3', '1.3-1.8', '1.8-2.3'], ans: 1, exp: 'Normal serum creatinine in males 0.7-1.3 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'BUN normal level?', opts: ['5-10 mg/dl', '10-20 mg/dl', '20-30 mg/dl', '30-40 mg/dl'], ans: 1, exp: 'Normal blood urea nitrogen (BUN) 7-20 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Uric acid normal level males?', opts: ['2-4 mg/dl', '3.5-7 mg/dl', '7-10 mg/dl', '10-13 mg/dl'], ans: 1, exp: 'Normal uric acid in males 3.5-7.2 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'ALT enzyme normal level?', opts: ['5-15 U/L', '7-35 U/L', '20-50 U/L', '50-100 U/L'], ans: 1, exp: 'Normal ALT (alanine aminotransferase) 7-35 U/L hota hai.', subj: 'Anatomy' },
    { q: 'AST enzyme normal level?', opts: ['5-15 U/L', '10-40 U/L', '20-50 U/L', '50-100 U/L'], ans: 1, exp: 'Normal AST (aspartate aminotransferase) 10-40 U/L hota hai.', subj: 'Anatomy' },
    { q: 'Alkaline phosphatase normal level?', opts: ['15-35 U/L', '35-65 U/L', '65-100 U/L', '100-150 U/L'], ans: 1, exp: 'Normal alkaline phosphatase 35-65 U/L hota hai.', subj: 'Anatomy' },
    { q: 'TSH normal level?', opts: ['0.2-0.5 mIU/L', '0.5-5 mIU/L', '5-10 mIU/L', '10-15 mIU/L'], ans: 1, exp: 'Normal TSH (Thyroid Stimulating Hormone) 0.4-4 mIU/L hota hai.', subj: 'Anatomy' },
    { q: 'Iron normal level females?', opts: ['30-50 mcg/dl', '50-70 mcg/dl', '60-170 mcg/dl', '170-250 mcg/dl'], ans: 2, exp: 'Normal serum iron in females 60-170 mcg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Magnesium normal level?', opts: ['1-2 mg/dl', '1.7-2.2 mg/dl', '2.5-3.5 mg/dl', '3.5-4.5 mg/dl'], ans: 1, exp: 'Normal serum magnesium 1.7-2.2 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Phosphorus normal level?', opts: ['1.5-2.5 mg/dl', '2.5-4.5 mg/dl', '4.5-6.5 mg/dl', '6.5-8.5 mg/dl'], ans: 1, exp: 'Normal serum phosphorus 2.5-4.5 mg/dl hota hai.', subj: 'Anatomy' },
    { q: 'Chloride normal level?', opts: ['90-100 mEq/L', '98-107 mEq/L', '105-115 mEq/L', '115-125 mEq/L'], ans: 1, exp: 'Normal serum chloride 98-107 mEq/L hota hai.', subj: 'Anatomy' },
  ],
  'anm-community-1': [
    { q: 'Community health nursing ka main focus?', opts: ['Hospital care', 'Prevention', 'Emergency', 'Surgery'], ans: 1, exp: 'CHN disease prevention par focus karta hai.', subj: 'Community' },
    { q: '5W1H mein H ka matlab?', opts: ['How', 'Health', 'Help', 'Human'], ans: 0, exp: '5W1H = Who, What, When, Where, Why, How.', subj: 'Community' },
    { q: 'MMR mein kya count hota hai?', opts: ['Pregnant women', 'Deaths during pregnancy', 'Infant deaths', 'Child deaths'], ans: 1, exp: 'MMR deaths during pregnancy/childbirth per 100,000 live births.', subj: 'Community' },
    { q: 'PHC kis level par kaam karta hai?', opts: ['National', 'State', 'Village', 'District'], ans: 2, exp: 'PHC community/village level par services provide karta hai.', subj: 'Community' },
    { q: 'BCG vaccine kis umar par?', opts: ['6 weeks', 'Birth', '6 months', '9 months'], ans: 1, exp: 'BCG vaccine birth ke turant baad diya jata hai.', subj: 'Community' },
    { q: 'IMR se kya sabudha hai?', opts: ['Deaths in 1st year', 'Deaths in 1st month', 'Deaths in 1st week', 'Fetal deaths'], ans: 0, exp: 'IMR 1000 live births par 1 year tak deaths.', subj: 'Community' },
    { q: 'NRHM ka full form?', opts: ['National Rural Health', 'National Reproductive', 'National Risk Health', 'None'], ans: 0, exp: 'NRHM = National Rural Health Mission (ab NHM).', subj: 'Community' },
    { q: 'Nutrition survey mein kya measure?', opts: ['Weight', 'Height', 'MUAC', 'Sab'], ans: 3, exp: 'Weight, height, aur MUAC sab measure kiye jate hain.', subj: 'Community' },
    { q: 'Health indicator unit?', opts: ['Per 100', 'Per 1000', 'Per 10000', 'Sab'], ans: 1, exp: 'Most health indicators per 1000 population.', subj: 'Community' },
    { q: 'Communicable disease control pehla step?', opts: ['Treatment', 'Prevention', 'Early detection', 'Rehabilitation'], ans: 2, exp: 'Early detection aur prompt treatment zaroori.', subj: 'Community' },
    { q: 'Infant mortality rate formula?', opts: ['Deaths < 1 year / LB', 'Deaths < 5 years / LB', 'Deaths at birth / LB', 'Deaths < 1 month / LB'], ans: 0, exp: 'IMR = Deaths of infants < 1 year / 1000 live births.', subj: 'Community' },
    { q: 'Child mortality rate kya measure karta hai?', opts: ['Deaths 1-5 years', 'Deaths < 5 years', 'Deaths < 10 years', 'Deaths 5-10 years'], ans: 1, exp: 'CMR = Deaths of children < 5 years / 1000 live births.', subj: 'Community' },
    { q: 'Maternal mortality ratio (MMR) definition?', opts: ['Pregnant women deaths', 'Deaths during pregnancy per LB', 'Deaths after delivery', 'Deaths from any cause'], ans: 1, exp: 'MMR = Maternal deaths per 100,000 live births.', subj: 'Community' },
    { q: 'Life expectancy at birth normal?', opts: ['50 years', '65 years', '70 years', '75 years'], ans: 2, exp: 'Current life expectancy at birth India mein approximately 70 years.', subj: 'Community' },
    { q: 'Crude birth rate (CBR) kya hai?', opts: ['Births per month', 'Births per 100 pop', 'Births per 1000 pop', 'Total births'], ans: 2, exp: 'CBR = Births per 1000 population per year.', subj: 'Community' },
    { q: 'Crude death rate (CDR) definition?', opts: ['Deaths per month', 'Deaths per 100', 'Deaths per 1000 pop', 'Total deaths'], ans: 2, exp: 'CDR = Deaths per 1000 population per year.', subj: 'Community' },
    { q: 'Natural increase rate (NIR) formula?', opts: ['CBR - CDR', 'CBR + CDR', 'CBR / CDR', 'CDR / CBR'], ans: 0, exp: 'NIR = CBR - CDR.', subj: 'Community' },
    { q: 'Total fertility rate (TFR) kya measure karta hai?', opts: ['Total births', 'Avg children per woman', 'Births per year', 'Live births'], ans: 1, exp: 'TFR = Average number of children per woman.', subj: 'Community' },
    { q: 'Contraceptive prevalence rate kya?', opts: ['% using contraception', 'Total contraceptives', 'Contraceptive methods', 'Fertility rate'], ans: 0, exp: 'CPR = % of married women using contraception.', subj: 'Community' },
    { q: 'Immunization coverage normal?', opts: ['50%', '70%', '85-95%', '100%'], ans: 2, exp: 'Target immunization coverage 85-95% hona chahiye.', subj: 'Community' },
    { q: 'Polio vaccination kis prakar se diya jata hai?', opts: ['Injection', 'Oral drops', 'Inhalation', 'Skin'], ans: 1, exp: 'Polio vaccine oral (OPV - drops) se diya jata hai.', subj: 'Community' },
    { q: 'DPT vaccine kis liye diya jata hai?', opts: ['3 diseases', 'Fever', 'Cough', 'Diarrhea'], ans: 0, exp: 'DPT = Diphtheria, Pertussis, Tetanus - 3 diseases ke liye.', subj: 'Community' },
    { q: 'Measles vaccine kis umar par diya jata hai?', opts: ['At birth', '6 weeks', '9 months', '15 months'], ans: 2, exp: 'Measles vaccine 9 months par diya jata hai.', subj: 'Community' },
    { q: 'Health survey mein random sampling kya?', opts: ['Convenient selection', 'Selection with chance', 'Selective method', 'Quota method'], ans: 1, exp: 'Random sampling = every individual ka equal chance select hone ka.', subj: 'Community' },
    { q: 'Stratified sampling kya hai?', opts: ['Divide into groups', 'Random selection', 'Systematic method', 'Convenient'], ans: 0, exp: 'Stratified sampling = population ko groups mein divide karke select karna.', subj: 'Community' },
    { q: 'Cluster sampling ka use kab hota hai?', opts: ['Small population', 'Large dispersed population', 'Urban areas', 'Hospitals'], ans: 1, exp: 'Cluster sampling large dispersed population mein use hota hai.', subj: 'Community' },
    { q: 'Epidemiology ka definition?', opts: ['Disease study', 'Population disease study', 'Treatment methods', 'Lab tests'], ans: 1, exp: 'Epidemiology = Population mein disease ka distribution aur determinants.', subj: 'Community' },
    { q: 'Endemic disease kya hota hai?', opts: ['Sudden outbreak', 'Always present in area', 'Affecting many', 'From outside'], ans: 1, exp: 'Endemic = disease jo har time area mein present hota hai.', subj: 'Community' },
    { q: 'Epidemic kya hota hai?', opts: ['Sudden disease', 'Disease spread in population', 'Individual illness', 'Chronic disease'], ans: 1, exp: 'Epidemic = sudden increase in disease cases short time mein.', subj: 'Community' },
    { q: 'Pandemic kya hota hai?', opts: ['Regional spread', 'National spread', 'International spread', 'Local spread'], ans: 2, exp: 'Pandemic = disease jo multiple countries mein spread hota hai.', subj: 'Community' },
    { q: 'Incidence rate kya measure karta hai?', opts: ['Existing cases', 'New cases', 'Total cases', 'Death rate'], ans: 1, exp: 'Incidence rate = new disease cases specific period mein.', subj: 'Community' },
    { q: 'Prevalence rate kya?', opts: ['New cases', 'Existing cases', 'Deaths', 'Recovery'], ans: 1, exp: 'Prevalence rate = total existing cases specific time par.', subj: 'Community' },
    { q: 'Attack rate kya?', opts: ['Death percentage', 'Cases in exposed pop', 'Infection rate', 'Incidence'], ans: 1, exp: 'Attack rate = % of exposed population developing disease.', subj: 'Community' },
    { q: 'Case fatality rate (CFR) kya?', opts: ['Total deaths', 'Deaths in confirmed cases %', 'Mortality rate', 'Infection rate'], ans: 1, exp: 'CFR = (Deaths / Confirmed cases) × 100.', subj: 'Community' },
    { q: 'Communicability period kya hota hai?', opts: ['Disease duration', 'Time disease can spread', 'Treatment time', 'Recovery time'], ans: 1, exp: 'Communicability period = time jab disease doosre ko spread ho sakta hai.', subj: 'Community' },
    { q: 'Quarantine ka matlab?', opts: ['Treatment', 'Isolation of suspects', 'Hospital admission', 'Vaccination'], ans: 1, exp: 'Quarantine = infected/suspects ko isolate karna disease spread rokne ke liye.', subj: 'Community' },
    { q: 'Isolation ka matlab?', opts: ['Suspect separation', 'Patient separation', 'Healthy separation', 'All'], ans: 1, exp: 'Isolation = confirmed patients ko separate karna.', subj: 'Community' },
    { q: 'Disinfection kya hota hai?', opts: ['Killing all microbes', 'Killing some microbes', 'Cleaning', 'Sterilization'], ans: 1, exp: 'Disinfection = pathogenic organisms ko destroy karna.', subj: 'Community' },
    { q: 'Sterilization vs Disinfection mein farak?', opts: ['Same process', 'Sterilization = all microbes', 'Disinfection = all microbes', 'No difference'], ans: 1, exp: 'Sterilization = sab microbes kill, Disinfection = sirf pathogens.', subj: 'Community' },
  ],
  'bsc-msn-1': [
    { q: 'MSN ka scope?', opts: ['Preventive', 'Acute/chronic care', 'Psychological', 'Sab'], ans: 3, exp: 'MSN adults ke acute, chronic, rehabilitative care cover karta hai.', subj: 'MSN' },
    { q: 'Shock ke stages mein pehla?', opts: ['Irreversible', 'Compensatory', 'Progressive', 'Refractory'], ans: 1, exp: 'Compensatory shock pehla stage.', subj: 'MSN' },
    { q: 'Wound healing inflammatory phase duration?', opts: ['3-5 days', '5-10 days', '24-72 hours', '10-14 days'], ans: 2, exp: '24-72 hours inflammatory phase.', subj: 'MSN' },
    { q: 'Thromboembolism prevention?', opts: ['Rest', 'Early mobilization', 'Antibiotics', 'Pain relief'], ans: 1, exp: 'Early mobilization prevention.', subj: 'MSN' },
    { q: 'Normal Na+ level?', opts: ['120-140', '135-145', '145-155', '115-125'], ans: 1, exp: '135-145 mEq/L normal.', subj: 'MSN' },
    { q: 'Catheterization technique?', opts: ['Clean', 'Sterile', 'Non-sterile', 'Medical asepsis'], ans: 1, exp: 'Sterile technique required.', subj: 'MSN' },
    { q: 'Burn 20% fluid loss treatment?', opts: ['Blood transfusion', 'IV fluid', 'Oral', 'Colloids'], ans: 1, exp: 'IV fluids essential.', subj: 'MSN' },
    { q: 'Pain assessment reliable method?', opts: ['Observation', 'Self-report', 'Vital signs', 'Behavior'], ans: 1, exp: 'Self-report most accurate.', subj: 'MSN' },
    { q: 'Pressure ulcer prevention?', opts: ['Nutrition', 'Frequent turning', 'Hygiene', 'Medication'], ans: 1, exp: 'Frequent turning 2-hourly.', subj: 'MSN' },
    { q: 'NG tube insertion distance?', opts: ['50-55 cm', '55-60 cm', '60-65 cm', '65-70 cm'], ans: 1, exp: '55-60 cm normal.', subj: 'MSN' },
    { q: 'Foley catheter change interval?', opts: ['Every week', 'Every 2 weeks', 'Every month', 'Every 3 months'], ans: 2, exp: 'Every month change recommended.', subj: 'MSN' },
    { q: 'Decubitus ulcer stages kitne?', opts: ['2', '3', '4', '5'], ans: 2, exp: '4 stages hai pressure ulcer ke.', subj: 'MSN' },
    { q: 'Stage 1 pressure ulcer?', opts: ['Skin break', 'Red area', 'Deep ulcer', 'Bone exposure'], ans: 1, exp: 'Red area skin intact.', subj: 'MSN' },
    { q: 'Stage 2 pressure ulcer?', opts: ['Redness', 'Partial thickness loss', 'Full thickness', 'Muscle involvement'], ans: 1, exp: 'Partial thickness skin loss.', subj: 'MSN' },
    { q: 'Stage 3 pressure ulcer?', opts: ['Redness', 'Surface ulcer', 'Full thickness tissue', 'Bone visible'], ans: 2, exp: 'Full thickness tissue loss.', subj: 'MSN' },
    { q: 'Proper patient turning schedule?', opts: ['Every hour', '2 hourly', '4 hourly', '8 hourly'], ans: 1, exp: 'Every 2 hours recommended.', subj: 'MSN' },
    { q: 'DVT ka risk factor?', opts: ['Activity', 'Hydration', 'Immobility', 'Movement'], ans: 2, exp: 'Immobility DVT ka major risk.', subj: 'MSN' },
    { q: 'Homan\'s sign kya hota hai?', opts: ['Fever', 'Swelling', 'Leg pain', 'Calf tenderness'], ans: 3, exp: 'Calf tenderness DVT sign.', subj: 'MSN' },
    { q: 'Pulmonary embolism symptoms?', opts: ['Cough', 'Chest pain', 'Dyspnea', 'Sab'], ans: 3, exp: 'Sudden onset chest pain dyspnea.', subj: 'MSN' },
    { q: 'Post-op pain management first step?', opts: ['Medication', 'Assessment', 'Surgery', 'Observation'], ans: 1, exp: 'Assessment first step.', subj: 'MSN' },
    { q: 'Incentive spirometer ka use?', opts: ['Pain relief', 'Lung expansion', 'Breathing exercise', 'Oxygen'], ans: 1, exp: 'Lung expansion prevent karne.', subj: 'MSN' },
    { q: 'Coughing and deep breathing timing?', opts: ['Every 1 hr', 'Every 2 hrs', 'As needed', '4 times daily'], ans: 0, exp: 'Every 1-2 hours recommend.', subj: 'MSN' },
    { q: 'Early ambulation benefits?', opts: ['Rest', 'Complications prevent', 'Weakness', 'Pain increase'], ans: 1, exp: 'Complications prevent.', subj: 'MSN' },
    { q: 'Wound dehiscence kya hota hai?', opts: ['Infection', 'Wound opening', 'Pain', 'Fever'], ans: 1, exp: 'Sutures ke baad wound open hona.', subj: 'MSN' },
    { q: 'Wound evisceration kya?', opts: ['Infection', 'Opening', 'Organs protruding', 'Bleeding'], ans: 2, exp: 'Intestines wound se bahar aana.', subj: 'MSN' },
    { q: 'Hemorrhage control first step?', opts: ['Surgery', 'Pressure', 'Medication', 'Tourniquet'], ans: 1, exp: 'Direct pressure apply.', subj: 'MSN' },
    { q: 'Tourniquet timing?', opts: ['30 mins', '1 hour', '2 hours', '3 hours'], ans: 2, exp: '2 hours se longer tourniquet tissue damage.', subj: 'MSN' },
    { q: 'Tetanus toxoid booster interval?', opts: ['Every year', 'Every 2 years', '5 years', '10 years'], ans: 2, exp: 'Every 10 years booster.', subj: 'MSN' },
    { q: 'Fluid balance calculation?', opts: ['Input only', 'Output only', 'Input - Output', 'Total volume'], ans: 2, exp: 'Fluid balance = Input - Output.', subj: 'MSN' },
    { q: 'Dehydration signs?', opts: ['Weight gain', 'Moist mucosa', 'Dry mucosa', 'Low urine'], ans: 2, exp: 'Dry mucosa, decreased urine.', subj: 'MSN' },
    { q: 'Edema assessment technique?', opts: ['Inspection', 'Palpation', 'Percussion', 'Auscultation'], ans: 1, exp: 'Palpation se assess karte hain.', subj: 'MSN' },
    { q: 'Pitting edema scale 0-4 mein normal?', opts: ['0', '1', '+1', '+2'], ans: 2, exp: '+1 normal hai.', subj: 'MSN' },
    { q: 'Ascites assessment?', opts: ['Inspection', 'Palpation', 'Fluid wave', 'All'], ans: 3, exp: 'Multiple methods use.', subj: 'MSN' },
    { q: 'Diarrhea management fluid?', opts: ['Restrict', 'Increase oral', 'IV only', 'NPO'], ans: 1, exp: 'Increase oral fluids.', subj: 'MSN' },
    { q: 'Constipation prevention primary?', opts: ['Laxatives', 'Activity', 'Diet', 'Fluids'], ans: 2, exp: 'High fiber diet.', subj: 'MSN' },
    { q: 'Nasogastric feeding formula?', opts: ['100 ml only', '200-400 ml', '500-1000 ml', 'As tolerated'], ans: 1, exp: '200-400 ml slowly give.', subj: 'MSN' },
    { q: 'Colostomy care frequency?', opts: ['Daily', 'Every 2 days', '3 times weekly', 'Weekly'], ans: 0, exp: 'Daily care required.', subj: 'MSN' },
    { q: 'Urostomy pouching change?', opts: ['Daily', '2-3 days', 'Weekly', 'As needed'], ans: 1, exp: '2-3 days change.', subj: 'MSN' },
    { q: 'Tracheostomy suctioning duration?', opts: ['10 seconds', '15 seconds', '30 seconds', '45 seconds'], ans: 1, exp: '15 seconds max suctioning.', subj: 'MSN' },
  ],
  'aiims-pharma-1': [
    { q: 'Pharmacology definition?', opts: ['Drug making', 'Drug action study', 'Drug sale', 'Drug transport'], ans: 1, exp: 'Study of drug action.', subj: 'Pharma' },
    { q: 'Half-life meaning?', opts: ['Ban time', 'Peak time', '50% elimination time', 'Absorption time'], ans: 2, exp: '50% drug eliminate time.', subj: 'Pharma' },
    { q: 'Bioavailability definition?', opts: ['Price', 'Percentage absorption', 'Effectiveness', 'Side effects'], ans: 1, exp: 'Percentage absorption.', subj: 'Pharma' },
    { q: 'First pass metabolism where?', opts: ['Stomach', 'Liver', 'Intestine', 'Blood'], ans: 1, exp: 'Liver mein happen.', subj: 'Pharma' },
    { q: 'Aspirin action?', opts: ['Antipyretic', 'Analgesic', 'COX inhibition', 'Sab'], ans: 3, exp: 'COX inhibit karta hai.', subj: 'Pharma' },
    { q: 'Antibiotics target?', opts: ['Human cells', 'Bacterial wall', 'Virus', 'Fungi'], ans: 1, exp: 'Bacterial cell wall.', subj: 'Pharma' },
    { q: 'Penicillin allergy reaction?', opts: ['Hypoglycemia', 'Anaphylaxis', 'Hyperkalemia', 'Acidosis'], ans: 1, exp: 'Anaphylaxis possible.', subj: 'Pharma' },
    { q: 'Drug interaction types?', opts: ['Pharmacokinetic', 'Pharmacodynamic', 'Dono', 'Neither'], ans: 2, exp: 'Both types possible.', subj: 'Pharma' },
    { q: 'Therapeutic drug monitoring?', opts: ['Paracetamol', 'Digoxin', 'Aspirin', 'Metformin'], ans: 1, exp: 'Digoxin monitoring.', subj: 'Pharma' },
    { q: 'Type A ADR?', opts: ['Unpredictable', 'Dose-dependent', 'Allergic', 'Idiosyncratic'], ans: 1, exp: 'Dose-dependent reaction.', subj: 'Pharma' },
    { q: 'Acetaminophen max daily dose?', opts: ['2000 mg', '3000 mg', '4000 mg', '5000 mg'], ans: 2, exp: '3000-4000 mg max.', subj: 'Pharma' },
    { q: 'NSAIDs contraindication?', opts: ['Fever', 'Pain', 'GI ulcer', 'Headache'], ans: 2, exp: 'GI ulcer mein contraindicated.', subj: 'Pharma' },
    { q: 'Metformin use?', opts: ['Type 1 diabetes', 'Type 2 diabetes', 'Hypertension', 'Anxiety'], ans: 1, exp: 'Type 2 diabetes treatment.', subj: 'Pharma' },
    { q: 'Insulin injection site?', opts: ['Arm', 'Abdomen', 'Thigh', 'All'], ans: 3, exp: 'All sites possible.', subj: 'Pharma' },
    { q: 'Beta blockers use?', opts: ['Hypertension', 'Asthma', 'Hypoglycemia', 'Allergy'], ans: 0, exp: 'Hypertension treatment.', subj: 'Pharma' },
    { q: 'ACE inhibitors action?', opts: ['Dilate vessels', 'Reduce blood pressure', 'Both', 'Neither'], ans: 2, exp: 'Vessels dilate, pressure reduce.', subj: 'Pharma' },
    { q: 'Warfarin drug interaction?', opts: ['Aspirin', 'NSAIDs', 'Antibiotics', 'All'], ans: 3, exp: 'Multiple interactions possible.', subj: 'Pharma' },
    { q: 'Statin use reason?', opts: ['Lower blood pressure', 'Lower cholesterol', 'Lower glucose', 'Lower sodium'], ans: 1, exp: 'Cholesterol lowering.', subj: 'Pharma' },
    { q: 'Antidepressant common side effect?', opts: ['Agitation', 'Drowsiness', 'Insomnia', 'All'], ans: 3, exp: 'Multiple effects possible.', subj: 'Pharma' },
    { q: 'Antipsychotic use disorder?', opts: ['Depression', 'Anxiety', 'Schizophrenia', 'Sleep'], ans: 2, exp: 'Schizophrenia treatment.', subj: 'Pharma' },
    { q: 'Benzodiazepine use?', opts: ['Pain', 'Anxiety', 'Infection', 'Fever'], ans: 1, exp: 'Anxiety treatment.', subj: 'Pharma' },
    { q: 'Antihistamine use?', opts: ['Infection', 'Allergy', 'Pain', 'Fever'], ans: 1, exp: 'Allergy treatment.', subj: 'Pharma' },
    { q: 'Proton pump inhibitor use?', opts: ['Diarrhea', 'Acidity', 'Fever', 'Pain'], ans: 1, exp: 'Acidity/GERD treatment.', subj: 'Pharma' },
    { q: 'Antacid interaction time?', opts: ['Same time', '1 hour apart', '2 hours apart', '3 hours apart'], ans: 2, exp: '2 hours apart give.', subj: 'Pharma' },
    { q: 'Antibiotic resistance cause?', opts: ['Improper use', 'Allergies', 'Fever', 'Infection'], ans: 0, exp: 'Improper/incomplete use.', subj: 'Pharma' },
    { q: 'Antibiotic course duration?', opts: ['1 day', '3 days', '7 days', '14 days'], ans: 2, exp: 'Usually 7 days.', subj: 'Pharma' },
    { q: 'Vaccination timing contraindication?', opts: ['Fever', 'Cough', 'Mild illness', 'Allergy'], ans: 3, exp: 'Allergy/severe illness contraindicated.', subj: 'Pharma' },
    { q: 'Vaccine storage temperature?', opts: ['Room temp', '2-8 C', '-20 C', '37 C'], ans: 1, exp: '2-8 degrees Celsius.', subj: 'Pharma' },
    { q: 'Drug absorption fastest from?', opts: ['Oral', 'IV', 'IM', 'SC'], ans: 1, exp: 'IV fastest absorption.', subj: 'Pharma' },
    { q: 'Drug half-life practical use?', opts: ['Dosing interval', 'Drug interaction', 'Side effects', 'Storage'], ans: 0, exp: 'Determine dosing frequency.', subj: 'Pharma' },
    { q: 'Metabolism site majority drugs?', opts: ['Lungs', 'Liver', 'Kidneys', 'Heart'], ans: 1, exp: 'Liver primary site.', subj: 'Pharma' },
    { q: 'Renal excretion importance?', opts: ['Pain relief', 'Drug removal', 'Infection fight', 'Inflammation'], ans: 1, exp: 'Remove drug from body.', subj: 'Pharma' },
    { q: 'Drug-food interaction example?', opts: ['Paracetamol', 'Milk-tetracycline', 'Aspirin', 'Glucose'], ans: 1, exp: 'Tetracycline milk se interaction.', subj: 'Pharma' },
    { q: 'Adverse effect reporting system?', opts: ['Self-care', 'Pharmacovigilance', 'Home remedy', 'Insurance'], ans: 1, exp: 'Pharmacovigilance program.', subj: 'Pharma' },
    { q: 'Prescribing error prevention?', opts: ['Clear writing', 'Generic names', 'Dose clarity', 'All'], ans: 3, exp: 'All measures important.', subj: 'Pharma' },
    { q: 'Drug name confusion?', opts: ['Brand names', 'Generic names', 'Similar names', 'Abbreviations'], ans: 2, exp: 'Similar names confusion risk.', subj: 'Pharma' },
    { q: 'Off-label drug use?', opts: ['Illegal', 'Licensed use', 'Non-approved use', 'Experimental'], ans: 2, exp: 'Non-approved indication use.', subj: 'Pharma' },
    { q: 'Polypharmacy risk?', opts: ['Safety', 'Interactions', 'Compliance', 'All'], ans: 3, exp: 'Multiple risks present.', subj: 'Pharma' },
    { q: 'Drug teratogenicity concern?', opts: ['Males', 'Elderly', 'Pregnancy', 'Children'], ans: 2, exp: 'Birth defects risk.', subj: 'Pharma' },
  ],
  'staff-psych-1': [
    { q: 'Psychiatry focus?', opts: ['Physical', 'Mental', 'Infectious', 'Trauma'], ans: 1, exp: 'Mental health disorders.', subj: 'Psych' },
    { q: 'Depression symptom NOT present?', opts: ['Sadness', 'Loss of interest', 'Increased energy', 'Guilt'], ans: 2, exp: 'Decreased energy present.', subj: 'Psych' },
    { q: 'Anxiety disorder therapy?', opts: ['Surgery', 'CBT', 'Radiation', 'Antibiotics'], ans: 1, exp: 'CBT most effective.', subj: 'Psych' },
    { q: 'Schizophrenia positive symptoms?', opts: ['Hallucinations', 'Apathy', 'Depression', 'Confusion'], ans: 0, exp: 'Hallucinations present.', subj: 'Psych' },
    { q: 'Therapeutic communication effective?', opts: ['Advice giving', 'Active listening', 'Judging', 'Dismissing'], ans: 1, exp: 'Active listening important.', subj: 'Psych' },
    { q: 'Suicide assessment question?', opts: ['Happy?', 'Suicide thought?', 'Money ok?', 'Work ok?'], ans: 1, exp: 'Direct questioning safe.', subj: 'Psych' },
    { q: 'Anxiety medication category?', opts: ['Antipsychotic', 'Anxiolytic', 'Antidepressant', 'Mood stabilizer'], ans: 1, exp: 'Anxiolytics use.', subj: 'Psych' },
    { q: 'Mental status exam component NOT?', opts: ['Orientation', 'Memory', 'Mood', 'Blood pressure'], ans: 3, exp: 'Blood pressure physical exam.', subj: 'Psych' },
    { q: 'Behavior modification principle?', opts: ['Classical conditioning', 'Operant conditioning', 'Observational learning', 'All'], ans: 3, exp: 'Multiple principles use.', subj: 'Psych' },
    { q: 'Milieu therapy important?', opts: ['Medication', 'Environment', 'Exercise', 'Diet'], ans: 1, exp: 'Therapeutic environment.', subj: 'Psych' },
    { q: 'Depression diagnosis criteria duration?', opts: ['1 week', '2 weeks', '1 month', '3 months'], ans: 2, exp: 'Minimum 2 weeks symptoms.', subj: 'Psych' },
    { q: 'Bipolar disorder phases?', opts: ['One phase', 'Two phases', 'Three phases', 'Variable'], ans: 1, exp: 'Manic and depressive phases.', subj: 'Psych' },
    { q: 'Mania duration minimum?', opts: ['Few days', '1 week', '2 weeks', '1 month'], ans: 2, exp: 'Minimum 1 week symptoms.', subj: 'Psych' },
    { q: 'PTSD trigger?', opts: ['Stress', 'Trauma', 'Anxiety', 'All'], ans: 1, exp: 'Traumatic event exposure.', subj: 'Psych' },
    { q: 'OCD main feature?', opts: ['Compulsions', 'Obsessions', 'Both', 'Neither'], ans: 2, exp: 'Obsessions and compulsions.', subj: 'Psych' },
    { q: 'Phobia treatment?', opts: ['Medication', 'Exposure therapy', 'Surgery', 'Hospitalization'], ans: 1, exp: 'Exposure therapy effective.', subj: 'Psych' },
    { q: 'Psychosis hallucination type?', opts: ['Visual', 'Auditory', 'Tactile', 'All'], ans: 3, exp: 'All types possible.', subj: 'Psych' },
    { q: 'Delusion definition?', opts: ['False belief', 'Hallucination', 'Confusion', 'Disorientation'], ans: 0, exp: 'Fixed false belief.', subj: 'Psych' },
    { q: 'Paranoid delusion example?', opts: ['Being wealthy', 'Being watched', 'Being powerful', 'Being famous'], ans: 1, exp: 'Persecution theme.', subj: 'Psych' },
    { q: 'Depersonalization feeling?', opts: ['Reality loss', 'Body detachment', 'Identity loss', 'Time loss'], ans: 1, exp: 'Detached from body.', subj: 'Psych' },
    { q: 'Derealization definition?', opts: ['Self-detachment', 'Environment-detachment', 'Reality confusion', 'Memory loss'], ans: 1, exp: 'Environment feels unreal.', subj: 'Psych' },
    { q: 'Dissociative disorder symptom?', opts: ['Pain', 'Memory loss', 'Fever', 'Rash'], ans: 1, exp: 'Memory discontinuity.', subj: 'Psych' },
    { q: 'Somatization definition?', opts: ['Psychic pain', 'Physical symptoms', 'Mental pain', 'Behavior change'], ans: 1, exp: 'Psychological symptoms as physical.', subj: 'Psych' },
    { q: 'Conversion disorder symptom?', opts: ['Pain', 'Paralysis', 'Fever', 'Rash'], ans: 1, exp: 'Physical manifestation without organic cause.', subj: 'Psych' },
    { q: 'Malingering vs factitious difference?', opts: ['Same', 'External gain', 'Internal gain', 'Unconscious'], ans: 2, exp: 'Malingering = external, Factitious = internal.', subj: 'Psych' },
    { q: 'Adjustment disorder timing?', opts: ['Before stressor', 'During stressor', 'After stressor 3 months', 'Year after'], ans: 2, exp: 'Within 3 months of stressor.', subj: 'Psych' },
    { q: 'Grief process stages?', opts: ['2', '3', '5', '7'], ans: 2, exp: 'Denial, anger, bargaining, depression, acceptance.', subj: 'Psych' },
    { q: 'Therapeutic relationship phase?', opts: ['Introduction', 'Building rapport', 'Working', 'Termination'], ans: 3, exp: 'All phases important.', subj: 'Psych' },
    { q: 'Countertransference meaning?', opts: ['Patient feelings', 'Therapist feelings', 'Environmental', 'Medication'], ans: 1, exp: 'Therapist emotional response.', subj: 'Psych' },
    { q: 'Psychotherapy type cognitive?', opts: ['Behavioral', 'Cognitive', 'Psychodynamic', 'Humanistic'], ans: 1, exp: 'Thought pattern modification.', subj: 'Psych' },
    { q: 'Family therapy goal?', opts: ['Individual change', 'Family system change', 'Medication', 'Hospitalization'], ans: 1, exp: 'System-level intervention.', subj: 'Psych' },
    { q: 'Group therapy advantage?', opts: ['Individual focus', 'Peer support', 'Privacy', 'One-on-one'], ans: 1, exp: 'Group dynamics healing.', subj: 'Psych' },
    { q: 'Confidentiality exception?', opts: ['Patient preference', 'Danger to self/others', 'Legal proceedings', 'Insurance'], ans: 1, exp: 'Safety override confidentiality.', subj: 'Psych' },
    { q: 'Crisis intervention goal?', opts: ['Long-term therapy', 'Immediate stabilization', 'Medication', 'Hospitalization'], ans: 1, exp: 'Immediate support focus.', subj: 'Psych' },
    { q: 'Suicide risk assessment timing?', opts: ['Initial only', 'Each session', 'Weekly', 'Monthly'], ans: 1, exp: 'Every session assess.', subj: 'Psych' },
    { q: 'Mental health recovery principle?', opts: ['Cure focus', 'Symptom management', 'Empowerment', 'All'], ans: 3, exp: 'Holistic recovery approach.', subj: 'Psych' },
    { q: 'Stigma reduction strategy?', opts: ['Silence', 'Education', 'Stereotyping', 'Isolation'], ans: 1, exp: 'Public education important.', subj: 'Psych' },
    { q: 'Community mental health center role?', opts: ['Hospitalization', 'Prevention', 'Cure all', 'Medication only'], ans: 1, exp: 'Prevention and early intervention.', subj: 'Psych' },
  ],
  'pgimer-obs-1': [
    { q: 'Obstetrics scope?', opts: ['Pregnancy', 'Gynecological', 'Infertility', 'Contraception'], ans: 0, exp: 'Pregnancy and childbirth.', subj: 'OB' },
    { q: 'Normal pregnancy duration?', opts: ['36 weeks', '38 weeks', '40 weeks', '42 weeks'], ans: 2, exp: '280 days approximately.', subj: 'OB' },
    { q: 'First trimester weeks?', opts: ['0-12', '0-13', '0-14', '0-15'], ans: 1, exp: '0-13 weeks first.', subj: 'OB' },
    { q: 'Antenatal care screening?', opts: ['BP only', 'Urine only', 'Weight only', 'All'], ans: 3, exp: 'Comprehensive screening.', subj: 'OB' },
    { q: 'Labor first stage duration?', opts: ['2-3 hours', '6-8 hours', '8-12 hours', '12-16 hours'], ans: 2, exp: 'Typically 8-12 hours.', subj: 'OB' },
    { q: 'Partograph feature?', opts: ['BP only', 'Labor progress', 'Fetal HR', 'Pulse'], ans: 1, exp: 'Labor monitoring tool.', subj: 'OB' },
    { q: 'Postpartum hemorrhage early sign?', opts: ['Hypotension', 'Tachycardia', 'Pallor', 'Confusion'], ans: 1, exp: 'Increased heart rate.', subj: 'OB' },
    { q: 'Puerperium period?', opts: ['3 weeks', '4 weeks', '6 weeks', '8 weeks'], ans: 2, exp: 'Postpartum recovery 6 weeks.', subj: 'OB' },
    { q: 'Colostrum duration?', opts: ['2-3 days', '3-5 days', '5-7 days', '7-10 days'], ans: 1, exp: 'First 3-5 days secreted.', subj: 'OB' },
    { q: 'Most reliable contraception?', opts: ['Barrier', 'IUD', 'Sterilization', 'Lactational'], ans: 2, exp: 'Permanent method.', subj: 'OB' },
    { q: 'Pregnancy test hormone?', opts: ['Estrogen', 'hCG', 'Progesterone', 'LH'], ans: 1, exp: 'Human chorionic gonadotropin.', subj: 'OB' },
    { q: 'Implantation timing?', opts: ['Day 1', 'Day 7', 'Day 14', 'Day 21'], ans: 1, exp: 'About 7 days after fertilization.', subj: 'OB' },
    { q: 'Expected date delivery Naegele?', opts: ['LMP + 280 days', 'LMP + 270 days', 'LMP + 290 days', 'LMP + 260 days'], ans: 0, exp: 'LMP + 280 days method.', subj: 'OB' },
    { q: 'Quickening sensation timing?', opts: ['4 weeks', '8 weeks', '12-16 weeks', '20 weeks'], ans: 2, exp: 'First fetal movements.', subj: 'OB' },
    { q: 'Weight gain pregnancy?', opts: ['5-10 kg', '10-15 kg', '15-20 kg', '20-25 kg'], ans: 1, exp: 'Approximately 12.5 kg.', subj: 'OB' },
    { q: 'Braxton Hicks contractions?', opts: ['False labor', 'True labor', 'Prodromal', 'Both'], ans: 0, exp: 'Practice contractions.', subj: 'OB' },
    { q: 'Cervical dilation complete?', opts: ['6 cm', '8 cm', '10 cm', '12 cm'], ans: 2, exp: 'Full dilation 10 cm.', subj: 'OB' },
    { q: 'Uterine contractions true labor?', opts: ['Irregular', 'Regular', 'Painless', 'Stops with rest'], ans: 1, exp: 'Regular progressive contractions.', subj: 'OB' },
    { q: 'Second stage labor duration?', opts: ['30 minutes', '1 hour', '1-2 hours', '2-3 hours'], ans: 2, exp: 'Pushing stage 1-2 hours.', subj: 'OB' },
    { q: 'Third stage labor management?', opts: ['Wait spontaneous', 'Oxytocin', 'Manual removal', 'Massage'], ans: 1, exp: 'Active management prevents hemorrhage.', subj: 'OB' },
    { q: 'Placenta delivery timing?', opts: ['5 min', '10 min', '15-30 min', '1 hour'], ans: 2, exp: 'Usually 5-30 minutes.', subj: 'OB' },
    { q: 'Lochia color progression?', opts: ['Red-brown-white', 'Red-pink-white', 'Brown-red-white', 'White-red-brown'], ans: 0, exp: 'Rubra, serosa, alba stages.', subj: 'OB' },
    { q: 'Uterine involution rate?', opts: ['1 cm/day', '1.5 cm/day', '2 cm/day', '3 cm/day'], ans: 0, exp: '1 cm per day descent.', subj: 'OB' },
    { q: 'Lactation hormones?', opts: ['Oxytocin', 'Prolactin', 'Both', 'Neither'], ans: 2, exp: 'Both play roles.', subj: 'OB' },
    { q: 'Exclusive breastfeeding duration?', opts: ['3 months', '6 months', '1 year', '2 years'], ans: 1, exp: '6 months WHO recommendation.', subj: 'OB' },
    { q: 'Complementary feeding age?', opts: ['3 months', '4 months', '6 months', '8 months'], ans: 2, exp: 'Start at 6 months.', subj: 'OB' },
    { q: 'Anemia in pregnancy Hb level?', opts: ['> 11 g/dl', '10-11 g/dl', '< 10 g/dl', '< 9 g/dl'], ans: 2, exp: 'Less than 10 g/dl anemia.', subj: 'OB' },
    { q: 'Gestational diabetes screening?', opts: ['1st trimester', '2nd trimester', '3rd trimester', 'All'], ans: 1, exp: '24-28 weeks screening.', subj: 'OB' },
    { q: 'Preeclampsia BP definition?', opts: ['> 140/90', '> 160/100', '> 180/110', '> 160/110'], ans: 1, exp: 'Systolic 140 or higher.', subj: 'OB' },
    { q: 'Eclampsia vs preeclampsia difference?', opts: ['BP only', 'Seizures', 'Protein', 'Edema'], ans: 1, exp: 'Seizures presence.', subj: 'OB' },
    { q: 'Placenta previa risk?', opts: ['Pain', 'Hemorrhage', 'Infection', 'Anemia'], ans: 1, exp: 'Vaginal bleeding risk.', subj: 'OB' },
    { q: 'Placental abruption symptom?', opts: ['No symptoms', 'Sudden pain', 'Gradual bleeding', 'Spotting'], ans: 1, exp: 'Sudden onset pain.', subj: 'OB' },
    { q: 'Shoulder dystocia management?', opts: ['Push harder', 'Leg maneuver', 'Episiotomy', 'All'], ans: 3, exp: 'Multiple techniques used.', subj: 'OB' },
    { q: 'Retained placenta definition?', opts: ['> 15 min', '> 30 min', '> 45 min', '> 1 hour'], ans: 2, exp: 'After 30 minutes retained.', subj: 'OB' },
    { q: 'Postpartum depression onset?', opts: ['Immediate', 'Few days', '2 weeks', 'Few months'], ans: 2, exp: 'Usually within 2 weeks.', subj: 'OB' },
    { q: 'Puerperal psychosis timing?', opts: ['Few days', '1-2 weeks', '2-4 weeks', 'Few months'], ans: 1, exp: 'Acute onset 1-2 weeks.', subj: 'OB' },
    { q: 'Mastitis prevention?', opts: ['Proper latch', 'Regular feeding', 'Hygiene', 'All'], ans: 3, exp: 'All measures important.', subj: 'OB' },
    { q: 'Episiotomy indication?', opts: ['Routine', 'Fetal distress', 'Slow progress', 'All'], ans: 1, exp: 'Only when medically indicated.', subj: 'OB' },
    { q: 'Cesarean section indication?', opts: ['Placenta previa', 'Fetal distress', 'Failure to progress', 'All'], ans: 3, exp: 'Multiple possible indications.', subj: 'OB' },
  ],
};

async function seed() {
  console.log('50 questions per test seed kar raha hun...');
  let token;
  try {
    token = await getAccessToken();
    console.log('Token mil gaya!');
  } catch (err) {
    console.error('Token error:', err.message);
    process.exit(1);
  }

  let total = 0;

  const testIds = ['gnm-anatomy-1', 'anm-community-1', 'bsc-msn-1', 'aiims-pharma-1', 'staff-psych-1', 'pgimer-obs-1'];

  for (const testId of testIds) {
    const qs = questions[testId] || [];
    console.log(`${testId}: ${qs.length} questions add kar raha hun...`);

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const qId = `q${String(i + 1).padStart(2, '0')}`;
      const qData = {
        testId: testId,
        questionText: q.q,
        options: q.opts,
        correctOptionIndex: q.ans,
        explanation: q.exp,
        subject: q.subj,
        marks: 1,
        orderIndex: i,
      };
      const qRes = await createDocument(token, `tests/${testId}/questions`, qId, qData);
      if (qRes.status === 200 || qRes.status === 201) {
        process.stdout.write('.');
        total++;
      } else {
        process.stdout.write('X');
      }
    }
    console.log(` (${qs.length})`);
  }

  console.log(`\nDone! Total ${total} questions added.`);
  console.log('App reload karo - ab questions dikhenge!');
}

seed().catch(console.error);
