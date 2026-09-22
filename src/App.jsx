import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Home';
import WelcomePage from './WelcomePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ReactivatePage from './ReactivatePage';
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";

function App() {
  const [userData, setUserData] = useState({ username: '', password: '' });

  return (
    <Router>
      <Routes>
        {/* First page is WelcomePage */}
        <Route path="/" element={<WelcomePage />} />

        {/* Auth pages */}
        <Route path="/login" element={<LoginPage setUserData={setUserData} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reactivate" element={<ReactivatePage />} />

        {/* Main app */}
        <Route path="/home" element={<Home userData={userData} setUserData={setUserData} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

export default App;
