
import { db } from './src/lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// Bu betik, belirtilen UID'yi admin olarak atar.
async function makeAdmin(uid) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        await updateDoc(userRef, { isAdmin: true });
        console.log(`User ${uid} successfully promoted to Admin.`);
    } else {
        // Kullanıcı dökümanı yoksa oluştur
        await setDoc(userRef, {
            isAdmin: true,
            username: 'Admin',
            btcBalance: 0,
            tycoonPoints: 0,
            level: 1,
            xp: 0
        });
        console.log(`User ${uid} created and promoted to Admin.`);
    }
}

// Buraya kendi UID'nizi yazıp tarayıcı konsolunda veya geçici bir sayfada çalıştırabilirsiniz.
// makeAdmin('YOUR_UID_HERE');
