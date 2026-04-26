const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // changed to default as the ID string is not working here

async function run() {
  const q = query(collection(db, 'workouts'), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, "=>", JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}
run();
