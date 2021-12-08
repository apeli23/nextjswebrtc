import firebase from 'firebase/app'; //updates the firebase object
import 'firebase/firestore'; // runs firebase side effects

const config = {
    apiKey: "AIzaSyD48gGgGT_s_DpGVO5hGnK_Vxi_eFSsmkk",
    authDomain: "nextwebrtc.firebaseapp.com",
    projectId: "nextwebrtc",
    storageBucket: "nextwebrtc.appspot.com",
    messagingSenderId: "928313419309",
    appId: "1:928313419309:web:1d8854fab0662aea163aa4"
};

//initialize firebase apps if there are no initialized apps
if(!firebase.apps.length){
    firebase.initializeApp(config);
}
//since we will be interracting with firestore, we
//grab a refference to the firestore database object and export it from this file 
const firestore = firebase.firestore();

export{firestore};