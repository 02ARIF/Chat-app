import React, { useState, useContext } from 'react';
import './Login.css';
import assets from '../../../assets/assets';
import { signup, login } from '../../../config/Firebase';
import { Appcontext } from '../../../context/Appcontext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [currState, setCurrState] = useState("SignUp");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loadUserData } = useContext(Appcontext);
  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      let user;
      if (currState === 'SignUp') {
        user = await signup(username, email, password);
      } else {
        user = await login(email, password);
      }

      if (user?.uid) {
        await loadUserData(user.uid);

        // After loading userData, navigate based on existing profile
        if (user.displayName && user.photoURL) {
          navigate('/chat');
        } else {
          navigate('/profile'); // new user or missing profile info
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="login">
      <img src={assets.logo_big} alt="rev" className="logo" />
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>{currState}</h2>
        {currState === 'SignUp' &&
          <input onChange={(e) => setUsername(e.target.value)} value={username} type="text" placeholder='username' className="form-input" required />}
        <input onChange={(e) => setEmail(e.target.value)} value={email} type="text" placeholder='Email address' className="form-input" required />
        <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder='password' className="form-input" required />
        <button type='submit'>{currState === 'SignUp' ? 'Create Account' : 'Login Now'}</button>
        <div className="long_term">
          <input type="checkbox" />
          <p>Agree To the terms</p>
        </div>
        <div className="login-forgot">
          {currState === 'SignUp'
            ? <p className="login-toggle">Already Have An Account <span onClick={() => setCurrState('Login')}>Login here</span></p>
            : <p className="login-toggle">Create An Account <span onClick={() => setCurrState('SignUp')}>click here</span></p>
          }
        </div>
      </form>
    </div>
  )
}

export default Login;
