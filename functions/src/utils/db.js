import * as admin from "firebase-admin";
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://meetsy-83280.firebaseio.com",
});

const db = admin.firestore();

export {
  db,
};
