import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Track My.png';
import './App.css';

function LoginPage({ setUserData }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("username") || sessionStorage.getItem("username");
    if (user) {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    alert(data.message);

    if (response.status === 200) {
      setUserData({ username, password });
      if (rememberMe) {
        localStorage.setItem("username", username);
      } else {
        sessionStorage.setItem("username", username);
      }
      localStorage.setItem("justLoggedIn", "true");
      navigate("/home");
    } else if (response.status === 403) {
      alert("Account is deactivated. Please reactivate.");
      navigate("/reactivate");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <img src={logo} alt="Track My Logo" className="login-logo" />
          <h2>Login</h2>

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

          <div className="form-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember Me
            </label>
            <button
              type="button"
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit">Login</button>

          <div className="register-row">
            <span>Don't have an account?</span>
            <button
              type="button"
              className="register-button"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
