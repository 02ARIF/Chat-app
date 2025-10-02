import React, { useState, useEffect, useContext } from 'react';
import './ProfileUpdate.css';
import assets from '../../../assets/assets';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../config/Firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import upload from '../../../lib/Upload';
import { toast } from 'react-hot-toast';
import { Appcontext } from '../../../context/Appcontext';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(Appcontext);

  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState(null);
  const [prevImage, setPrevImage] = useState('');

  // Load current profile data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setBio(data.bio || '');
          setPrevImage(data.avatar || '');
        }
      } else {
        navigate('/'); // user not logged in
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle profile update
  const profileUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!prevImage && !image) {
        toast.error("Please select a profile image");
        return;
      }

      const docRef = doc(db, "users", uid);

      let updatedData = {
        name,
        bio,
      };

      if (image) {
        const imgUrl = await upload(image);
        updatedData.avatar = imgUrl;
        setPrevImage(imgUrl);
      }

      await updateDoc(docRef, updatedData);

      // Update context
      const snap = await getDoc(docRef);
      setUserData(snap.data());

      toast.success("Profile Updated Successfully");
      navigate('/chat'); // redirect to chat after update
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profile update failed");
    }
  };

  return (
    <div className='profile'>
      <div className="p-c">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

          <label htmlFor="avatar">
            <input
              type="file"
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
            <img
              src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon}
              alt="Profile"
            />
            upload profile image
          </label>

          <input
            type="text"
            placeholder='Your name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder='Write Profile Bio'
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <button type='submit'>Save</button>
        </form>

        <img
          className='pic-p'
          src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon}
          alt="Preview"
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;
