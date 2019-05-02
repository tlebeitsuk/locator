// Initialize Firebase

import * as firebase from 'firebase/app'
import 'firebase/database'

var config = {
  apiKey: 'AIzaSyBY-JoOpYdVZDLIJeqZHL3yyRURkrCOxdE',
  authDomain: 'location-8e25e.firebaseapp.com',
  databaseURL: 'https://location-8e25e.firebaseio.com',
  projectId: 'location-8e25e',
  storageBucket: 'location-8e25e.appspot.com',
  messagingSenderId: '1040229373783'
}

firebase.initializeApp(config)

const database = firebase.database()

// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  Vue.prototype.$db = database
}
