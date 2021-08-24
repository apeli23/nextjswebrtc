import firebase from "firebase/app";//updates the firebase object
import 'firebase/firestore'// runs firebase side effects

const config = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: "fir-setup-f63d7",//failes with 'process.env'
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId
};

//initialize firebase apps if there are no initialized apps
if(!firebase.apps.length){
    firebase.initializeApp(config);
}
//since we will be interracting with firestore, we
//grab a refference to the firestore database object and export it from this file 
const firestore = firebase.firestore();

export{firestore};