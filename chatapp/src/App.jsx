import React from 'react'
import Chat from './Pages/Chat/Chat'
import Login from './Pages/Chat/Login/Login'
import ProfileUpdate from './Pages/Chat/ProfileUpdate/ProfileUpdate'
import { Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './config/Firebase'
import { useNavigate } from "react-router-dom";
import { Appcontext } from './context/Appcontext'



const App = () => {
  const navigate = useNavigate();
  const {loadUserData}=React.useContext(Appcontext);
  useEffect(()=>{
    onAuthStateChanged(auth,async(user)=>{
      if(user){
        //user is logged in
        // navigate('/chat')
        // console.log(user);
        await loadUserData(user.uid);
      }
      else{
        //user is logged out
        navigate('/')
      }
    })

  },[navigate])
  return (
    <>
    <Routes>
      <Route path='/' element={<Login/>}/>
      <Route path='/chat' element={<Chat/>}/>
      <Route path='/profile' element={<ProfileUpdate/>}/>
    </Routes>
      
    </>
  )
}

export default App
