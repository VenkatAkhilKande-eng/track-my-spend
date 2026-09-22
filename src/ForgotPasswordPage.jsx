import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Track My.png';
import './App.css';

function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    const response = await fetch("http://localhost:5000/verify-passcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, passcode })
    });

    const data = await response.json();
    alert(data.message);
    if (response.status === 200) {
      setVerified(true);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, passcode, newPassword })
    });

    const data = await response.json();
    alert(data.message);
    if (response.status === 200) {
      navigate("/");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="login-form" onSubmit={verified ? handleReset : (e) => e.preventDefault()}>
          <img src={logo} alt="Track My Logo" className="login-logo" />
          <h2>Reset Password</h2>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="4-digit Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            required
          />

          {!verified && (
            <button type="button" onClick={handleVerify}>Verify</button>
          )}

          {verified && (
            <>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="submit">Reset Password</button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
