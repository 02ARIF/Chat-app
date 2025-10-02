import React, { useContext, useEffect, useState } from 'react';
import './RightSidebar.css';
import assets from '../../../assets/assets';
import { logout } from '../../../config/Firebase';
import { Appcontext } from '../../../context/Appcontext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/Firebase';

const RightSidebar = () => {
  const { chatUser, messagesId } = useContext(Appcontext);
  const [media, setMedia] = useState([]);

  // Fetch media images from messages
  useEffect(() => {
    if (!messagesId) {
      setMedia([]);
      return;
    }

    const messagesRef = doc(db, 'messages', messagesId);
    const unsubscribe = onSnapshot(messagesRef, (docSnap) => {
      if (docSnap.exists()) {
        const msgs = docSnap.data().messages || [];
        // Filter messages with images
        const images = msgs
          .filter(msg => msg.imageUrl)
          .map(msg => msg.imageUrl)
          .reverse(); // Latest first
        setMedia(images);
      } else {
        setMedia([]);
      }
    });

    return () => unsubscribe();
  }, [messagesId]);

  return (
    <div className='rs'>
      <div className="rs-profile">
        <img src={chatUser?.avatar || assets.profile_img} alt="" />
        <h3>
          {chatUser?.name || "Select a user"}
          {chatUser && <img className='dot' src={assets.green_dot} alt="" />}
        </h3>
        <p>{chatUser?.bio || "Hey there! I am using chat app"}</p>
      </div>

      <hr />

      <div className="rs-media">
        <p>Media</p>
        <div className="media-gallery">
          {media.length > 0 ? (
            media.map((imgUrl, idx) => (
              <img key={idx} src={imgUrl} alt={`media-${idx}`} />
            ))
          ) : (
            <p>No media yet.</p>
          )}
        </div>
      </div>

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default RightSidebar;
