// ReactivatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ReactivatePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const navigate = useNavigate();

  const handleReactivate = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/reactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, passcode })
    });

    const data = await res.json();
    alert(data.message);

    if (res.status === 200) {
      navigate("/");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleReactivate} className="login-form">
        <h2>Reactivate Account</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          type="text"
          placeholder="4-digit Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          required
          maxLength={4}
        />
        <button type="submit">Reactivate</button>
      </form>
    </div>
  );
}

export default ReactivatePage;
