import firebase from "firebase/app";//updates the firebase object
import 'firebase/firestore'// runs firebase side effects

const config = {
   
};

//initialize firebase apps if there are no initialized apps
if(!firebase.apps.length){
    firebase.initializeApp(config);
}
//since we will be interracting with firestore, we
//grab a refference to the firestore database object and export it from this file 
const firestore = firebase.firestore();

export{firestore};