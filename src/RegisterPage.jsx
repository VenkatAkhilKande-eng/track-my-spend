import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Track My.png';
import './App.css';

function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const username = `${firstName.trim().toLowerCase()}_${lastName.trim().toLowerCase()}`;

    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, firstName, lastName })
    });

    const data = await response.json();
    alert(data.message);

    if (response.status === 200) {
      alert(`${data.message}\nYour 4-digit passcode: ${data.passcode}`);
      navigate("/");
    }
  };

  return (
    <div className="reg-page">
      <div className="login-container right-aligned">
        <form onSubmit={handleRegister} className="login-form">
          <img src={logo} alt="Track My Logo" className="login-logo" />
          <h2>Create Account</h2>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Register</button>
          <div className="register-footer">
            <span>Already have an account?</span>
            <button type="button" className="login-redirect" onClick={() => navigate("/")}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
