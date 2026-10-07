// Browser console se manually UID copy karne ke liye simple method:
//
// Step 1: DevTools console mein ye likho:
// localStorage.getItem('firebase:authUser:[PROJECT_ID]:[APP_ID]')
//
// Ya ye try karo:
// firebase.auth().currentUser.uid
//
// Step 2: "allow pasting" type karo agar prompt aaye
// Step 3: Enter press karo
// Step 4: Output copy karo aur admin setup command mein use karo

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           NURSEPREP APP - ADMIN UID SETUP GUIDE               ║
╚════════════════════════════════════════════════════════════════╝

OPTION 1: DevTools Console (Recommended)
─────────────────────────────────────────
1. Browser F12 press karo
2. Console tab mein jao
3. "allow pasting" type karo + Enter
4. Ye code paste karo:

   firebase.auth().currentUser.uid

5. Enter press karo
6. Output copy karo (UID string)
7. Terminal mein run karo:

   cd "C:/Users/PC/Desktop/MY DATA" && node seed_admin.js YOUR_UID_HERE


OPTION 2: Firebase Console (Alternative)
──────────────────────────────────────────
1. https://console.firebase.google.com/ open karo
2. testprep-app-2024 project select karo
3. Authentication → Users tab
4. Apna email wala user click karo
5. UID copy karo
6. Terminal mein run karo:

   cd "C:/Users/PC/Desktop/MY DATA" && node seed_admin.js YOUR_UID_HERE


EXAMPLE:
────────
Agar UID ye hai: d1a2b3c4e5f6g7h8i9j0k1l2m3n4o5p6

Terminal command:
   node seed_admin.js d1a2b3c4e5f6g7h8i9j0k1l2m3n4o5p6

✅ Success message dikhega


Questions?
──────────
• "allow pasting" likha to devtools security warning ke liye
• UID 28 characters long होता है
• Copy karte time spaces include mat karo
`);
