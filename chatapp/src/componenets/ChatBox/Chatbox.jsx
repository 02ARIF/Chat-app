import React, { useContext, useEffect, useState } from 'react';
import './Chatbot.css';
import assets from '../../assets/assets';
import { Appcontext } from '../../context/Appcontext';
import { arrayUnion, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../config/Firebase';
import toast from 'react-hot-toast';
import axios from 'axios'; // Axios for Cloudinary

const Chatbox = () => {
  const { chatUser, messages, setMessages, messagesId, userData, chatData, setChatData } = useContext(Appcontext);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);

  // Fetch messages
  useEffect(() => {
    if (!messagesId) {
      setMessages([]);
      return;
    }

    const messagesRef = doc(db, 'messages', messagesId);
    const unsubscribe = onSnapshot(messagesRef, (docSnap) => {
      if (docSnap.exists()) {
        const msgs = docSnap.data().messages || [];
        const formattedMsgs = msgs.map(msg => ({
          ...msg,
          createdAt: msg.createdAt?.seconds
            ? new Date(msg.createdAt.seconds * 1000)
            : new Date(msg.createdAt)
        }));
        setMessages(formattedMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [messagesId, setMessages]);

  // Cloudinary upload function
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Cloudinary error:", error);
      toast.error("Image upload failed");
      return null;
    }
  };

  // Send text or image message
  const sendMessage = async () => {
    if ((!input && !file) || !messagesId) return;

    let newMessage = {
      sID: userData.id,
      createdAt: new Date().toISOString()
    };

    try {
      // If text
      if (input) newMessage.text = input;

      // If file -> Upload to Cloudinary
      if (file) {
        const imageUrl = await uploadToCloudinary(file);
        if (!imageUrl) return; // stop if upload failed
        newMessage.imageUrl = imageUrl;
        setFile(null);
      }

      // Save message in Firestore
      await updateDoc(doc(db, 'messages', messagesId), {
        messages: arrayUnion(newMessage)
      });

      setMessages(prev => [...prev, { ...newMessage, createdAt: new Date(newMessage.createdAt) }]);

      // Update sidebar last message
      const userIDs = [chatUser.id, userData.id];
      for (const id of userIDs) {
        const userChatsRef = doc(db, 'chats', id);
        const userChatsSnapshot = await getDoc(userChatsRef);
        if (userChatsSnapshot.exists()) {
          const userChatData = userChatsSnapshot.data();
          const chatIndex = userChatData.chatsData.findIndex(c => c.messageId === messagesId);

          if (chatIndex !== -1) {
            userChatData.chatsData[chatIndex].lastMessage =
              newMessage.text || "📷 Photo";
            userChatData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatData.chatsData[chatIndex].rID === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, { chatsData: userChatData.chatsData });

            setChatData(prev => {
              const updated = [...prev];
              const itemIndex = updated.findIndex(c => c.messageId === messagesId);
              if (itemIndex !== -1) {
                updated[itemIndex].lastMessage =
                  newMessage.text || "📷 Photo";
                updated[itemIndex].updatedAt = Date.now();
              }
              return updated;
            });
          }
        }
      }

      setInput("");
    } catch (error) {
      console.error(error);
      toast.error("Error sending message");
    }
  };

  const hasChatUser = chatUser && Object.keys(chatUser).length > 0;

  return hasChatUser ? (
    <div className='chat-box'>
      <div className="chat-user">
        <img src={chatUser?.avatar || chatUser?.profileImg || assets.profile_img} alt="profile" />
        <p>{chatUser?.name || 'User'} <img className='dot' src={assets.green_dot} alt="online" /></p>
        <img src={assets.help_icon} alt="help" />
      </div>

      <div className="chat-msg">
        {messages?.length > 0 ? (
          messages.map((msg, idx) => {
            const isSender = msg.sID === userData.id;
            const avatar = isSender
              ? userData.avatar || assets.profile_img
              : chatUser?.avatar || chatUser?.profileImg || assets.profile_img;

            return (
              <div key={idx} className={isSender ? 's-msg' : 'r-msg'}>
                <div className="msg-avatar">
                  <img src={avatar} alt="profile" />
                </div>
                <div className="msg-content">
                  {msg.text && <p className='msg'>{msg.text}</p>}
                  {msg.imageUrl && <img src={msg.imageUrl} alt="chat-img" className="msg-img" />}
                  <span className='msg-time'>
                    {msg.createdAt instanceof Date
                      ? msg.createdAt.toLocaleTimeString()
                      : 'Invalid Date'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-msg">No messages yet. Start the conversation!</p>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder='Send a message'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />

        {/* File input */}
        <input
          type="file"
          id="image"
          accept='image/*'
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
              e.target.value = null;
            }
          }}
        />
        <label htmlFor="image" style={{ cursor: 'pointer' }}>
          <img src={assets.gallery_icon} alt="upload" />
        </label>

        {/* Preview selected image */}
        {file && (
          <div className="preview-img">
            <img src={URL.createObjectURL(file)} alt="preview" className="msg-img" />
            <button onClick={() => setFile(null)}>Remove</button>
          </div>
        )}

        <img onClick={sendMessage} src={assets.send_button} alt="send" />
      </div>
    </div>
  ) : (
    <div className='chat-welcome'>
      <img src={assets.logo_icon} alt="logo" />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default Chatbox;
