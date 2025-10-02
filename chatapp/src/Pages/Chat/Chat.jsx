import React, { useContext, useEffect, useState } from 'react';
import './Chat.css';
import LeftSidebar from '../../componenets/ChatBox/LeftSidebar/LeftSidebar';
import Chatbox from '../../componenets/ChatBox/Chatbox';
import RightSidebar from '../../componenets/ChatBox/RightSidebar/RightSidebar';
import { Appcontext } from '../../context/Appcontext';

const Chat = () => {
  const { chatData, userData } = useContext(Appcontext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatData && userData) setLoading(false);
  }, [chatData, userData]);

  return (
    <div className='chat'>
      {loading ? (
        <p className='loading'>Loading...</p>
      ) : (
        <div className="chat-container">
          <LeftSidebar />
          <Chatbox />
          <RightSidebar />
        </div>
      )}
    </div>
  );
};

export default Chat;
