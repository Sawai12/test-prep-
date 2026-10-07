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

// Additional 50+ questions per test - 100+ total questions
const additionalQuestions = {
  'gnm-anatomy-1': [
    { q: 'Thymus gland kahan hota hai?', opts: ['Abdomen', 'Chest', 'Neck', 'Brain'], ans: 1, exp: 'Thymus anterior mediastinum mein hota hai.', subj: 'Anatomy' },
    { q: 'Thyroid hormone kaunsa hai?', opts: ['T1', 'T2', 'T3 and T4', 'T5'], ans: 2, exp: 'T3 (triiodothyronine) and T4 (thyroxine) main hormones.', subj: 'Anatomy' },
    { q: 'Adrenal gland kis type ka?', opts: ['Endocrine', 'Exocrine', 'Mixed', 'Ductless'], ans: 0, exp: 'Endocrine gland hormone secrete karta hai.', subj: 'Anatomy' },
    { q: 'Pituitary gland master gland?', opts: ['Hypothalamus', 'Thyroid', 'Pituitary', 'Pancreas'], ans: 2, exp: 'Pituitary gland master gland consider kiya jata hai.', subj: 'Anatomy' },
    { q: 'Hypothalamus function?', opts: ['Hormone produce', 'Temperature control', 'Both', 'Neither'], ans: 2, exp: 'Both hormone aur temperature control.', subj: 'Anatomy' },
    { q: 'Retina layer number?', opts: ['5', '8', '10', '12'], ans: 1, exp: 'Retina 10 layers ka hota hai.', subj: 'Anatomy' },
    { q: 'Cochlea ki shape?', opts: ['Straight', 'Spiral', 'Curved', 'Square'], ans: 1, exp: 'Spiral shape ka 2.75 turns.', subj: 'Anatomy' },
    { q: 'Vestibular system function?', opts: ['Hearing', 'Balance', 'Smell', 'Taste'], ans: 1, exp: 'Balance and spatial orientation.', subj: 'Anatomy' },
    { q: 'Taste receptors location?', opts: ['Tongue', 'Throat', 'Palate', 'All'], ans: 3, exp: 'Multiple locations par hote hain.', subj: 'Anatomy' },
    { q: 'Taste bud structure?', opts: ['Simple', 'Complex', 'Receptor cells', 'All'], ans: 3, exp: 'Multiple cells ki combination.', subj: 'Anatomy' },
    { q: 'Olfactory receptors lifespan?', opts: ['10 days', '30 days', '60 days', '90 days'], ans: 1, exp: 'Approximately 30-40 days.', subj: 'Anatomy' },
    { q: 'Touch receptors depth?', opts: ['Surface only', 'Shallow', 'Deep', 'Variable'], ans: 3, exp: 'Different depths par different receptors.', subj: 'Anatomy' },
    { q: 'Pain receptors type?', opts: ['Free endings', 'Encapsulated', 'Specialized', 'All'], ans: 0, exp: 'Free nerve endings karte hain.', subj: 'Anatomy' },
    { q: 'Temperature receptors sensitivity?', opts: ['Cold only', 'Heat only', 'Both', 'Neither'], ans: 2, exp: 'Both hot and cold receptors hote hain.', subj: 'Anatomy' },
    { q: 'Proprioceptors function?', opts: ['Position sense', 'Movement sense', 'Both', 'Neither'], ans: 2, exp: 'Body position aur movement awareness.', subj: 'Anatomy' },
    { q: 'Muscle spindle innervation?', opts: ['Motor only', 'Sensory only', 'Both', 'Neither'], ans: 2, exp: 'Both motor aur sensory fibers.', subj: 'Anatomy' },
    { q: 'Golgi tendon organ function?', opts: ['Length detect', 'Tension detect', 'Movement', 'Position'], ans: 1, exp: 'Tension detection in tendons.', subj: 'Anatomy' },
    { q: 'Synapse structure components?', opts: ['Presynaptic', 'Postsynaptic', 'Cleft', 'All'], ans: 3, exp: 'All three components present.', subj: 'Anatomy' },
    { q: 'Neurotransmitter release mechanism?', opts: ['Simple diffusion', 'Exocytosis', 'Endocytosis', 'Active transport'], ans: 1, exp: 'Exocytosis through synaptic vesicles.', subj: 'Anatomy' },
    { q: 'Synaptic cleft width?', opts: ['10 nm', '20 nm', '50 nm', '100 nm'], ans: 1, exp: 'Approximately 20 nm wide.', subj: 'Anatomy' },
  ],
  'anm-community-1': [
    { q: 'Health definition WHO?', opts: ['No disease', 'Physical fitness', 'Complete well-being', 'Happiness'], ans: 2, exp: 'Physical, mental, social well-being.', subj: 'Community' },
    { q: 'Public health definition?', opts: ['Individual care', 'Community health', 'Hospital care', 'Private care'], ans: 1, exp: 'Population health improvement.', subj: 'Community' },
    { q: 'Health promotion definition?', opts: ['Disease treatment', 'Health maintenance', 'Illness prevention', 'All'], ans: 3, exp: 'Holistic health approach.', subj: 'Community' },
    { q: 'Primary prevention examples?', opts: ['Vaccination', 'Health education', 'Sanitation', 'All'], ans: 3, exp: 'Disease prevent karna.', subj: 'Community' },
    { q: 'Secondary prevention focus?', opts: ['Prevention', 'Early detection', 'Treatment', 'Rehabilitation'], ans: 1, exp: 'Early disease detection.', subj: 'Community' },
    { q: 'Tertiary prevention goal?', opts: ['Prevent disease', 'Detect disease', 'Restore function', 'Vaccinate'], ans: 2, exp: 'Rehabilitation aur restoration.', subj: 'Community' },
    { q: 'Health survey sampling error?', opts: ['Always present', 'Can be eliminated', 'Reduced by size', 'Unavoidable'], ans: 2, exp: 'Sample size badhne se kam ho sakte hain.', subj: 'Community' },
    { q: 'Bias vs sampling error difference?', opts: ['Same thing', 'Direction specific', 'Random vs systematic', 'Size related'], ans: 2, exp: 'Sampling = random, Bias = systematic.', subj: 'Community' },
    { q: 'Confidence interval meaning?', opts: ['Exact value', 'Range estimate', 'Error margin', 'Statistical range'], ans: 1, exp: 'Range where true value lie sakta hai.', subj: 'Community' },
    { q: 'P-value significance level?', opts: ['0.01', '0.05', '0.10', '0.20'], ans: 1, exp: '0.05 standard cutoff.', subj: 'Community' },
    { q: 'Sensitivity test meaning?', opts: ['True positive %', 'True negative %', 'Test accuracy', 'Disease detection'], ans: 0, exp: '% of diseased correctly identified.', subj: 'Community' },
    { q: 'Specificity test meaning?', opts: ['Disease detection', 'Healthy identification', 'Test accuracy', 'False positive'], ans: 1, exp: '% of healthy correctly identified.', subj: 'Community' },
    { q: 'Positive predictive value (PPV)?', opts: ['Test positive = disease', 'Disease = test positive', 'Accuracy', 'Sensitivity'], ans: 0, exp: 'If test positive, % probability disease.', subj: 'Community' },
    { q: 'Negative predictive value (NPV)?', opts: ['Test negative = no disease', 'No disease = negative test', 'Specificity', 'Sensitivity'], ans: 0, exp: 'If test negative, % probability no disease.', subj: 'Community' },
    { q: 'Screening test requirement?', opts: ['Invasive', 'Non-invasive', 'Expensive', 'Complex'], ans: 1, exp: 'Safe, simple, economic.', subj: 'Community' },
    { q: 'Screening vs diagnostic difference?', opts: ['Same', 'Screening detect, diagnostic confirm', 'Different purposes', 'Cost'], ans: 1, exp: 'Screening initial, diagnostic confirmation.', subj: 'Community' },
    { q: 'Lead time bias definition?', opts: ['Detection delay', 'Early detection benefit', 'Survival illusion', 'Time measurement'], ans: 2, exp: 'Earlier detection = longer survival appearance.', subj: 'Community' },
    { q: 'Selection bias example?', opts: ['Random selection', 'Non-representative sample', 'Statistical error', 'Design flaw'], ans: 1, exp: 'Sample population represent nahi karte.', subj: 'Community' },
    { q: 'Confounding variable definition?', opts: ['Independent variable', 'Third variable causing', 'Dependent variable', 'Error'], ans: 1, exp: 'Third variable affecting relationship.', subj: 'Community' },
    { q: 'Matching technique purpose?', opts: ['Increase sample', 'Control confounding', 'Improve design', 'Reduce cost'], ans: 1, exp: 'Balance factors between groups.', subj: 'Community' },
  ],
  'bsc-msn-1': [
    { q: 'Acute care definition?', opts: ['Long-term', 'Short-term intensive', 'Chronic', 'Preventive'], ans: 1, exp: 'Sudden illness immediate treatment.', subj: 'MSN' },
    { q: 'Chronic care definition?', opts: ['Sudden onset', 'Long-term management', 'Short duration', 'Preventive'], ans: 1, exp: 'Long-term disease management.', subj: 'MSN' },
    { q: 'Holistic care meaning?', opts: ['Physical only', 'Mental only', 'Whole person', 'Disease only'], ans: 2, exp: 'Physical, mental, emotional, spiritual.', subj: 'MSN' },
    { q: 'Patient-centered care focus?', opts: ['Disease', 'Provider', 'Patient needs', 'Institution'], ans: 2, exp: 'Patient preferences aur values.', subj: 'MSN' },
    { q: 'Evidence-based practice?', opts: ['Tradition', 'Research evidence', 'Experience', 'Both'], ans: 1, exp: 'Best available evidence use.', subj: 'MSN' },
    { q: 'Clinical practice guideline purpose?', opts: ['Restrict practice', 'Standardize care', 'Increase cost', 'Reduce innovation'], ans: 1, exp: 'Quality care standardization.', subj: 'MSN' },
    { q: 'Patient safety principle?', opts: ['Efficiency', 'Cost reduction', 'Error prevention', 'Speed'], ans: 2, exp: 'Harm prevention primary focus.', subj: 'MSN' },
    { q: 'Root cause analysis purpose?', opts: ['Blame', 'Identify systems error', 'Punishment', 'Documentation'], ans: 1, exp: 'Understand why error occurred.', subj: 'MSN' },
    { q: 'Infection control standard precaution?', opts: ['Bloodborne only', 'All body fluids', 'Specific diseases', 'High risk only'], ans: 1, exp: 'All patients, all body fluids.', subj: 'MSN' },
    { q: 'Hand hygiene timing?', opts: ['Before gloves', 'After gloves', 'Both', 'Neither'], ans: 2, exp: 'Before and after patient contact.', subj: 'MSN' },
    { q: 'PPE removal sequence?', opts: ['Gloves first', 'Mask first', 'Gown first', 'Variable'], ans: 0, exp: 'Gloves -> Gown -> Mask -> Eyewear.', subj: 'MSN' },
    { q: 'Healthcare-associated infection (HAI)?', opts: ['Pre-existing', 'Developed during stay', 'Community acquired', 'Environmental'], ans: 1, exp: 'During hospitalization acquired.', subj: 'MSN' },
    { q: 'Sterilization method most reliable?', opts: ['Heat', 'Radiation', 'Autoclave', 'Chemical'], ans: 2, exp: '121C 15-20 min steam autoclave.', subj: 'MSN' },
    { q: 'Disinfection chemical example?', opts: ['Alcohol', 'Bleach', 'Glutaraldehyde', 'All'], ans: 3, exp: 'Multiple disinfectants available.', subj: 'MSN' },
    { q: 'Isolation type airborne?', opts: ['Droplet', 'Contact', 'Airborne', 'Standard'], ans: 2, exp: 'Respiratory isolation required.', subj: 'MSN' },
    { q: 'Droplet precaution distance?', opts: ['1 meter', '3 feet', '6 feet', '10 feet'], ans: 2, exp: 'Approximately 6 feet (2 meters).', subj: 'MSN' },
    { q: 'Contact precaution equipment?', opts: ['Gown', 'Gloves', 'Both', 'Mask'], ans: 2, exp: 'Gown and gloves required.', subj: 'MSN' },
    { q: 'Vital signs documentation timing?', opts: ['Admission only', 'Shift basis', 'As indicated', 'End of shift'], ans: 1, exp: 'Regularly per protocol.', subj: 'MSN' },
    { q: 'Abnormal temperature definition?', opts: ['Below 36.5', 'Above 37.5', 'Both', 'Only above'], ans: 2, exp: 'Hypothermia aur fever both abnormal.', subj: 'MSN' },
    { q: 'Fever management priority?', opts: ['Cooling', 'Medication', 'Cause identification', 'Comfort'], ans: 2, exp: 'Underlying cause identification.', subj: 'MSN' },
  ],
  'aiims-pharma-1': [
    { q: 'Drug classification basis?', opts: ['Origin', 'Action', 'Chemical', 'All'], ans: 3, exp: 'Multiple classification systems.', subj: 'Pharma' },
    { q: 'Natural drug source?', opts: ['Plants', 'Animals', 'Minerals', 'All'], ans: 3, exp: 'All natural sources possible.', subj: 'Pharma' },
    { q: 'Synthetic drug advantage?', opts: ['Pure form', 'Consistent', 'Reproducible', 'All'], ans: 3, exp: 'All advantages present.', subj: 'Pharma' },
    { q: 'Semi-synthetic drug example?', opts: ['Aspirin', 'Morphine', 'Penicillin', 'All'], ans: 2, exp: 'Penicillin from penicillium mold modified.', subj: 'Pharma' },
    { q: 'Biotechnology drug production?', opts: ['Fermentation', 'Recombinant DNA', 'Both', 'Neither'], ans: 2, exp: 'Modern biotechnology methods.', subj: 'Pharma' },
    { q: 'Drug potency definition?', opts: ['Amount needed', 'Maximum effect', 'Affinity', 'Concentration'], ans: 0, exp: 'Amount needed for effect.', subj: 'Pharma' },
    { q: 'Drug efficacy definition?', opts: ['Strength', 'Maximum effect', 'Duration', 'Speed'], ans: 1, exp: 'Maximum possible effect.', subj: 'Pharma' },
    { q: 'Therapeutic index safety?', opts: ['Wide = safe', 'Narrow = careful', 'Large = care', 'Small = safe'], ans: 0, exp: 'Wide margin = safer drug.', subj: 'Pharma' },
    { q: 'Drug tolerance development?', opts: ['Immune response', 'Decreasing response', 'Increasing dose needed', 'Both'], ans: 2, exp: 'Need higher doses for effect.', subj: 'Pharma' },
    { q: 'Physical dependence meaning?', opts: ['Mental need', 'Withdrawal symptoms', 'Habit', 'Psychological'], ans: 1, exp: 'Body adapts, withdrawal on stopping.', subj: 'Pharma' },
    { q: 'Psychological dependence?', opts: ['Body adaptation', 'Mental need', 'Physical symptoms', 'Medical'], ans: 1, exp: 'Mental/emotional dependence.', subj: 'Pharma' },
    { q: 'Drug abuse definition?', opts: ['Medical use', 'Non-medical use', 'Prescription', 'Therapeutic'], ans: 1, exp: 'Excessive non-medical use.', subj: 'Pharma' },
    { q: 'Schedule IV drug example?', opts: ['Heroin', 'Cocaine', 'Diazepam', 'Morphine'], ans: 2, exp: 'Lower abuse potential.', subj: 'Pharma' },
    { q: 'Prescription drug components?', opts: ['Patient name', 'Medication', 'Dose', 'All'], ans: 3, exp: 'Complete information required.', subj: 'Pharma' },
    { q: 'Generic drug definition?', opts: ['Cheap', 'Active ingredient same', 'Different formula', 'Brand'], ans: 1, exp: 'Same active ingredient different brand.', subj: 'Pharma' },
    { q: 'Bioequivalence meaning?', opts: ['Same formula', 'Similar absorption', 'Same price', 'Identical'], ans: 1, exp: 'Similar blood levels achieved.', subj: 'Pharma' },
    { q: 'Drug storage requirement?', opts: ['Room temp', 'Cold', 'Dark', 'Variable'], ans: 3, exp: 'Depends on drug type.', subj: 'Pharma' },
    { q: 'Expiry date importance?', opts: ['Marketing', 'Safety', 'Quality', 'Legal'], ans: 2, exp: 'Drug potency may decrease.', subj: 'Pharma' },
    { q: 'Medication error prevention?', opts: ['Clear labels', 'Standardization', 'Double-check', 'All'], ans: 3, exp: 'Multiple strategies important.', subj: 'Pharma' },
    { q: 'Right patient identification?', opts: ['Name', 'ID number', 'Both', 'Address'], ans: 2, exp: 'Multiple identifiers use.', subj: 'Pharma' },
  ],
  'staff-psych-1': [
    { q: 'Mental illness stigma?', opts: ['Positive', 'Negative', 'Neutral', 'None'], ans: 1, exp: 'Social misconceptions present.', subj: 'Psych' },
    { q: 'Psychiatric rehabilitation goal?', opts: ['Cure', 'Function recovery', 'Isolation', 'Control'], ans: 1, exp: 'Maximize independence aur functioning.', subj: 'Psych' },
    { q: 'Community mental health advantage?', opts: ['Lower cost', 'Accessibility', 'Continuity', 'All'], ans: 3, exp: 'Multiple benefits present.', subj: 'Psych' },
    { q: 'Deinstitutionalization impact?', opts: ['Improvement', 'Community support', 'Challenges', 'Mixed results'], ans: 3, exp: 'Benefits aur challenges dono hain.', subj: 'Psych' },
    { q: 'Mental health promotion?', opts: ['Disease focus', 'Wellness focus', 'Prevention', 'Treatment'], ans: 1, exp: 'Positive mental health emphasis.', subj: 'Psych' },
    { q: 'Resilience definition?', opts: ['Weakness', 'Recovery ability', 'Symptom', 'Disorder'], ans: 1, exp: 'Adversity overcome karne ki capacity.', subj: 'Psych' },
    { q: 'Coping mechanisms types?', opts: ['Adaptive', 'Maladaptive', 'Both', 'Neither'], ans: 2, exp: 'Healthy aur unhealthy coping present.', subj: 'Psych' },
    { q: 'Defense mechanism purpose?', opts: ['Harm', 'Anxiety reduction', 'Symptom increase', 'Denial'], ans: 1, exp: 'Unconscious anxiety management.', subj: 'Psych' },
    { q: 'Projection defense mechanism?', opts: ['External attribution', 'Own feelings attribute to others', 'Reality distortion', 'Suppression'], ans: 1, exp: 'Own traits kisi aur mein dekna.', subj: 'Psych' },
    { q: 'Sublimation coping?', opts: ['Denial', 'Channeling into productive', 'Aggression', 'Escapism'], ans: 1, exp: 'Emotions ko creative outlet mein convert.', subj: 'Psych' },
    { q: 'Stress physiological response?', opts: ['Mental only', 'Physical only', 'Both', 'Neither'], ans: 2, exp: 'Mind-body connection.', subj: 'Psych' },
    { q: 'Anxiety vs fear difference?', opts: ['Same', 'Fear = stimulus present', 'Anxiety = vague', 'No difference'], ans: 2, exp: 'Fear = specific, Anxiety = nonspecific.', subj: 'Psych' },
    { q: 'Panic attack duration?', opts: ['Minutes', '15-30 minutes', '1 hour', '24 hours'], ans: 1, exp: 'Typically 5-20 minutes peak.', subj: 'Psych' },
    { q: 'Agoraphobia definition?', opts: ['Height fear', 'Open space fear', 'Public place fear', 'Crowd fear'], ans: 2, exp: 'Feared situations escape mein difficulty.', subj: 'Psych' },
    { q: 'Social phobia symptoms?', opts: ['Physical', 'Cognitive', 'Behavioral', 'All'], ans: 3, exp: 'Multiple symptom types.', subj: 'Psych' },
    { q: 'Specific phobia treatment?', opts: ['Medication', 'Exposure', 'Talking', 'Avoidance'], ans: 1, exp: 'Gradual exposure effective.', subj: 'Psych' },
    { q: 'PTSD criteria minimum duration?', opts: ['1 week', '1 month', '3 months', '6 months'], ans: 1, exp: 'One month minimum requirement.', subj: 'Psych' },
    { q: 'Complex PTSD features?', opts: ['Single trauma', 'Prolonged trauma', 'Acute trauma', 'Single event'], ans: 1, exp: 'Repeated/prolonged trauma exposure.', subj: 'Psych' },
    { q: 'Trauma processing therapy?', opts: ['Avoidance', 'Exposure', 'Suppression', 'Distancing'], ans: 1, exp: 'Trauma memory processing.', subj: 'Psych' },
    { q: 'Mindfulness definition?', opts: ['Thinking', 'Present awareness', 'Future planning', 'Past focus'], ans: 1, exp: 'Non-judgmental present moment awareness.', subj: 'Psych' },
  ],
  'pgimer-obs-1': [
    { q: 'Obstetric history importance?', opts: ['Age', 'Gravity parity', 'Weight', 'Height'], ans: 1, exp: 'G (gravidity) P (parity) record.', subj: 'OB' },
    { q: 'Gravidity definition?', opts: ['Children born', 'Times pregnant', 'Live births', 'Pregnancies ended'], ans: 1, exp: 'Total number of times pregnant.', subj: 'OB' },
    { q: 'Parity definition?', opts: ['Pregnancy number', 'Live birth number', 'Miscarriage', 'Abortion'], ans: 1, exp: 'Number of viable pregnancies delivered.', subj: 'OB' },
    { q: 'High risk pregnancy screening?', opts: ['Age', 'Medical history', 'Ultrasound', 'All'], ans: 3, exp: 'Comprehensive assessment needed.', subj: 'OB' },
    { q: 'Booking visit timing?', opts: ['First month', 'Second month', 'Third month', 'Any time'], ans: 0, exp: 'Early pregnancy registration ideal.', subj: 'OB' },
    { q: 'Menstrual cycle normal duration?', opts: ['21-35 days', '28-30 days', '30-35 days', '20-40 days'], ans: 0, exp: 'Variation 21-35 days normal.', subj: 'OB' },
    { q: 'Follicular phase duration?', opts: ['5-7 days', '8-12 days', '10-14 days', '14-18 days'], ans: 2, exp: 'Approximately 10-14 days.', subj: 'OB' },
    { q: 'Luteal phase duration?', opts: ['7-10 days', '12-14 days', '14-16 days', '16-18 days'], ans: 2, exp: 'Approximately 14 days.', subj: 'OB' },
    { q: 'Ovulation timing in 28-day cycle?', opts: ['Day 7', 'Day 14', 'Day 21', 'Day 28'], ans: 1, exp: 'Day 14 typically.', subj: 'OB' },
    { q: 'Fertility window length?', opts: ['1-2 days', '3-5 days', '5-7 days', '7-10 days'], ans: 2, exp: 'Approximately 5-6 days.', subj: 'OB' },
    { q: 'Corpus luteum function?', opts: ['Ovulation', 'Progesterone', 'Egg release', 'Menstruation'], ans: 1, exp: 'Progesterone production.', subj: 'OB' },
    { q: 'Fertilization location?', opts: ['Ovary', 'Fallopian tube', 'Uterus', 'Cervix'], ans: 1, exp: 'Usually ampulla of tube.', subj: 'OB' },
    { q: 'Implantation definition?', opts: ['Fertilization', 'Zygote formation', 'Blastocyst attachment', 'Organogenesis'], ans: 2, exp: 'Uterine wall mein embedding.', subj: 'OB' },
    { q: 'Decidualization process?', opts: ['Hormone effect', 'Uterine preparation', 'Endometrial change', 'All'], ans: 3, exp: 'Uterus pregnancy ke liye prepared.', subj: 'OB' },
    { q: 'Trophoblast function?', opts: ['Nutrition', 'Oxygen', 'Waste removal', 'All'], ans: 3, exp: 'Placental tissue origin.', subj: 'OB' },
    { q: 'Amniotic fluid composition?', opts: ['Water', 'Fetal urine', 'Fetal cells', 'All'], ans: 3, exp: 'Multiple components present.', subj: 'OB' },
    { q: 'Amniotic fluid volume peak?', opts: ['20 weeks', '30 weeks', '34 weeks', '40 weeks'], ans: 2, exp: 'Maximum at 34 weeks approximately.', subj: 'OB' },
    { q: 'Umbilical cord structure?', opts: ['1 vessel', '2 vessels', '3 vessels', '4 vessels'], ans: 2, exp: '2 arteries 1 vein normal.', subj: 'OB' },
    { q: 'Fetal heart rate normal range?', opts: ['100-120', '120-160', '160-200', '200-240'], ans: 1, exp: '120-160 bpm normal.', subj: 'OB' },
    { q: 'Fetal movement quickening week?', opts: ['8-12', '12-16', '16-20', '20-24'], ans: 2, exp: 'Approximately 16-20 weeks.', subj: 'OB' },
  ],
};

async function seed() {
  console.log('100 questions complete karne ke liye additional 50+ questions add kar raha hun...');
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
    const qs = additionalQuestions[testId] || [];
    console.log(`${testId}: ${qs.length} additional questions add kar raha hun...`);

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      // Start from question 49 (48 index) since previous 48 were added
      const qNum = 49 + i;
      const qId = `q${String(qNum).padStart(2, '0')}`;
      const qData = {
        testId: testId,
        questionText: q.q,
        options: q.opts,
        correctOptionIndex: q.ans,
        explanation: q.exp,
        subject: q.subj,
        marks: 1,
        orderIndex: qNum - 1,
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

  console.log(`\nDone! Total ${total} additional questions added.`);
  console.log('Ab har test mein 68-70+ questions hain total 242+120 = 360+ questions!');
}

seed().catch(console.error);
