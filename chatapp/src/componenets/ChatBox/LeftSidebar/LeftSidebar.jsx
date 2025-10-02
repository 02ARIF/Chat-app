import React, { useContext, useState, useEffect } from 'react';
import './Leftsidebar.css';
import assets from '../../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { Appcontext } from '../../../context/Appcontext';
import { db } from '../../../config/Firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { userData, loadUserData, chatData, setChatData, setChatUser, setMessagesId } = useContext(Appcontext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // 🔎 Search users
  const inputHandler = async (e) => {
    const input = e.target.value;
    if (!input) return setShowSearch(false);
    setShowSearch(true);

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", input.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0].data().id !== userData.id) {
        let userExist = false;
        chatData?.forEach((chatUser) => {
          if (chatUser.rID === querySnapshot.docs[0].data().id) userExist = true;
        });
        if (!userExist) setUser(querySnapshot.docs[0].data());
        else setUser(null);
      } else setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  // ➕ Create new chat
  const addChat = async () => {
    if (!user) return;

    try {
      const messagesRef = collection(db, "messages");
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, { messages: [] });

      const userChatRef = doc(db, "chats", userData.id);
      const searchedUserChatRef = doc(db, "chats", user.id);

      const userChatSnap = await getDoc(userChatRef);
      if (!userChatSnap.exists()) await setDoc(userChatRef, { chatsData: [] });

      const searchedUserChatSnap = await getDoc(searchedUserChatRef);
      if (!searchedUserChatSnap.exists()) await setDoc(searchedUserChatRef, { chatsData: [] });

      const chatObjForCurrent = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rID: user.id,
        updatedAt: Date.now(),
        messageSeen: true,
      };
      const chatObjForOther = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rID: userData.id,
        updatedAt: Date.now(),
        messageSeen: true,
      };

      await updateDoc(userChatRef, { chatsData: arrayUnion(chatObjForCurrent) });
      await updateDoc(searchedUserChatRef, { chatsData: arrayUnion(chatObjForOther) });

      setChatUser(user);
      setMessagesId(newMessageRef.id);

      setUser(null);
      setShowSearch(false);
      toast.success("Chat created!");
    } catch (error) {
      toast.error("Error creating chat");
      console.error(error);
    }
  };

  // ✅ Select chat from list
  const selectChat = (item) => {
    setChatUser(item.user);
    setMessagesId(item.messageId);

    if (!item.messageSeen) {
      const userChatRef = doc(db, "chats", userData.id);
      getDoc(userChatRef).then(docSnap => {
        if (docSnap.exists()) {
          const chats = docSnap.data().chatsData;
          const chatIndex = chats.findIndex(c => c.messageId === item.messageId);
          if (chatIndex !== -1) {
            chats[chatIndex].messageSeen = true;
            updateDoc(userChatRef, { chatsData: chats });
          }
        }
      });
    }
  };

  // 🔄 Real-time listener for sidebar chats
  useEffect(() => {
    if (!userData?.id) return;

    const userChatsRef = doc(db, "chats", userData.id);
    const unsubscribe = onSnapshot(userChatsRef, async (docSnap) => {
      if (docSnap.exists()) {
        const chats = docSnap.data().chatsData || [];

        // 🔹 Deduplicate chats → keep only the latest per user
        const uniqueChatsMap = new Map();
        chats.forEach(chat => {
          if (
            !uniqueChatsMap.has(chat.rID) ||
            chat.updatedAt > uniqueChatsMap.get(chat.rID).updatedAt
          ) {
            uniqueChatsMap.set(chat.rID, chat);
          }
        });

        const uniqueChats = Array.from(uniqueChatsMap.values());

        const updatedChats = await Promise.all(
          uniqueChats.map(async (chat) => {
            const otherUserRef = doc(db, "users", chat.rID);
            const otherUserSnap = await getDoc(otherUserRef);
            const otherUserData = otherUserSnap.exists() ? otherUserSnap.data() : {};
            return {
              ...chat,
              user: otherUserData
            };
          })
        );

        // Sort by latest
        setChatData(updatedChats.sort((a, b) => b.updatedAt - a.updatedAt));
      } else {
        setChatData([]);
      }
    });

    return () => unsubscribe();
  }, [userData?.id, setChatData]);

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => { loadUserData(userData?.uid); navigate('/profile'); }}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input onChange={inputHandler} type="text" placeholder="Search Here..." />
        </div>
      </div>

      <div className="ls-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img src={user.avatar || assets.profile_img} alt="" />
            <p>{user.name}</p>
          </div>
        ) : (
          chatData.map((item, index) => (
            <div
              key={index}
              className={`friends ${!item.messageSeen ? 'unseen' : ''}`}
              onClick={() => selectChat(item)}
            >
              <img src={item.user.avatar || assets.profile_img} alt="" />
              <div>
                <p>{item.user.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
