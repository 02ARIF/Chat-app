// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-hot-toast";
import { signInWithEmailAndPassword } from "firebase/auth";



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username,email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email:"",
            name: "",
            avatar: "",
            bio: "Hey I am using ChatApp",
            lastSeen:Date.now(),
        });
        await setDoc(doc(db, "Chats", user.uid), {
            chatsData: []
        });
    } catch (error) {
        console.error(error);
        toast.error(error.message || "Signup failed");
    }
}

const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    toast.success("Login successful!");
    return userCredential.user; 
  } catch (error) {
    console.error(error);
    toast.error(error.message|| "Login failed");
  }
};
const logout = async() => {
    try{
         await signOut(auth);
    }
    catch(error){
        console.error(error);
        toast.error(error.message || "Logout failed");
    }
}

export{signup,login,logout,auth,db}; 

