import { createContext, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../config/Firebase";

export const Appcontext = createContext();

const AppcontextProvider = (props) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesId, setMessagesId] = useState(null);

  // Load user data and update lastSeen
  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      setUserData(data);

      // Initial lastSeen update
      await updateDoc(userRef, { lastSeen: Date.now() });

      // Update lastSeen every 60 seconds
      const interval = setInterval(async () => {
        if (auth.currentUser) {
          await updateDoc(userRef, { lastSeen: Date.now() });
        }
      }, 60000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Real-time chat list listener
  useEffect(() => {
    if (!userData?.uid) return;

    const chatRef = doc(db, "chats", userData.uid);
    const unSub = onSnapshot(chatRef, async (res) => {
      const chatItems = res.data()?.chatsData || [];
      const tempData = [];

      for (const item of chatItems) {
        const userRef = doc(db, "users", item.rID);
        const userSnap = await getDoc(userRef);
        const otherUserData = userSnap.data();

        tempData.push({
          ...item,
          user: otherUserData,
        });
      }

      // Sort by updatedAt descending
      setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
    });

    return () => unSub();
  }, [userData]);

  return (
    <Appcontext.Provider
      value={{
        userData,
        setUserData,
        chatData,
        setChatData,
        loadUserData,
        chatUser,
        setChatUser,
        messages,
        setMessages,
        messagesId,
        setMessagesId,
      }}
    >
      {props.children}
    </Appcontext.Provider>
  );
};

export default AppcontextProvider;
