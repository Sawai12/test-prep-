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

async function main() {
  console.log('Admin user setup kar raha hun...');
  console.log('');
  console.log('⚠️  NOTE: Apka current Firebase UID admin set karne ke liye:');
  console.log('');
  console.log('1. App mein login karo');
  console.log('2. Browser DevTools open karo (F12)');
  console.log('3. Console mein ye paste karo:');
  console.log('');
  console.log('firebase.auth().currentUser.uid');
  console.log('');
  console.log('4. Output copy karo (ye aapka UID hai)');
  console.log('5. Is script ko re-run karo aur UID provide karo');
  console.log('');
  console.log('Ya seedDatabase command use karo with your UID:');
  console.log('node seed_admin.js <YOUR_UID>');
  console.log('');

  // Check if UID passed as argument
  if (process.argv.length > 2) {
    const uid = process.argv[2];
    console.log(`Setting admin for UID: ${uid}...`);

    let token;
    try {
      token = await getAccessToken();
    } catch (err) {
      console.error('Token error:', err.message);
      process.exit(1);
    }

    try {
      const res = await createDocument(token, 'admins', uid, {
        isAdmin: true,
        grantedAt: new Date().toISOString(),
        role: 'admin',
      });

      if (res.status === 200 || res.status === 201) {
        console.log('✅ Admin access granted successfully!');
        console.log(`UID: ${uid}`);
        console.log('Ab aap admin panel use kar sakte ho.');
      } else {
        console.error(`❌ Error: ${res.status}`, res.body);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  } else {
    console.log('❌ UID required!');
    console.log('Usage: node seed_admin.js <YOUR_UID>');
    process.exit(1);
  }
}

main();
