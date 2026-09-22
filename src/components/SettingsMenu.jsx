import React, { useState, useEffect } from 'react';
import '../styles/ModalMenus.css';

const DEFAULT_CURRENCY = '$';

function SettingsMenu({ userData, setUserData, setShowSettingsMenu }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar'));
  const [activeTab, setActiveTab] = useState('profile');

  const [usageStats, setUsageStats] = useState({
    last_login: '',
    login_count: 0,
    total_minutes_spent: 0,
    reports_downloaded: 0,
    expenses_added: 0
  });

  // Load session currency (if present) else default
  useEffect(() => {
    const sessionCur = sessionStorage.getItem('sessionCurrency');
    setCurrency(sessionCur || DEFAULT_CURRENCY);
  }, []);

  useEffect(() => {
    setUsername(userData.username || '');
    setPassword(userData.password || '');

    const storedUsername = userData.username
      || localStorage.getItem('username')
      || sessionStorage.getItem('username');

    if (storedUsername) {
      fetch(`http://localhost:5000/get-usage-summary?username=${storedUsername}`)
        .then(res => res.json())
        .then(data => {
          setUsageStats({
            last_login: data.last_login || '',
            login_count: data.login_count || 0,
            total_minutes_spent: data.total_minutes_spent || 0,
            reports_downloaded: data.reports_downloaded || 0,
            expenses_added: data.expenses_added || 0
          });
        });
    }
  }, [userData]);

  const handleSave = () => {
    setUserData({ username, password });
    alert("Settings saved!");
    setShowSettingsMenu(false);
  };

  const handleLogoutAll = async () => {
    try {
      const res = await fetch("http://localhost:5000/logout-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      alert(data.message || "Logged out from all devices.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch {
      alert("Error logging out from all devices.");
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account?")) return;
    try {
      const res = await fetch("http://localhost:5000/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      alert(data.message || "Account deactivated.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch {
      alert("Error deactivating account.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Avatar = reader.result;
      localStorage.setItem('avatar', base64Avatar);
      setAvatar(base64Avatar);
      fetch("http://localhost:5000/upload-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar: base64Avatar })
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearAvatar = () => {
    localStorage.removeItem('avatar');
    setAvatar(null);
  };

  const formatLoginTime = (iso) => {
    if (!iso) return "–";
    const date = new Date(iso);
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
      <div className="backdrop" onClick={() => setShowSettingsMenu(false)}></div>
      <div className="notifications-popup nav-layout">
        <div className="notifications-header">
          <h3 className="notifications-title">⚙️ Settings</h3>
          <span className="notifications-close" onClick={() => setShowSettingsMenu(false)}>×</span>
        </div>

        <div className="notifications-layout">
          <div className="notifications-nav">
            <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile Settings</button>
            <button className={activeTab === 'currency' ? 'active' : ''} onClick={() => setActiveTab('currency')}>Currency Preference</button>
            <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>Manage Account</button>
            <button className={activeTab === 'usage' ? 'active' : ''} onClick={() => setActiveTab('usage')}>Usage Stats</button>
          </div>

          <div className="notifications-content">
            {activeTab === 'profile' && (
              <div className="notifications-settings">
                <label>Username:
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                </label>
                <label>Password:
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </label>
                <label>Manage Avatar:
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </label>
                {avatar && <button onClick={handleClearAvatar}>Remove Avatar</button>}
                <button className="alert-button" onClick={handleSave}>Save</button>
              </div>
            )}

            {activeTab === 'currency' && (
              <div className="notifications-settings">
                <p><strong>💱 Currency Preference (session‑only)</strong></p>

                <label>Select Currency:
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="₹">INR (₹)</option>
                  </select>
                </label>

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    className="alert-button"
                    onClick={() => {
                      sessionStorage.setItem('sessionCurrency', currency);
                      window.dispatchEvent(new CustomEvent('sessionCurrencyChanged', { detail: currency }));
                      alert(`Saved for this session: ${currency}`);
                    }}
                  >
                    Save for this session
                  </button>

                  <button
                    className="alert-button"
                    style={{ backgroundColor: '#e5e7eb', color: '#111', border: '1px solid #d1d5db' }}
                    onClick={() => {
                      sessionStorage.removeItem('sessionCurrency');
                      const next = DEFAULT_CURRENCY;
                      setCurrency(next);
                      window.dispatchEvent(new CustomEvent('sessionCurrencyChanged', { detail: next }));
                      alert('Reset to default: $');
                    }}
                  >
                    Reset to default ($)
                  </button>
                </div>

                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  This preference is stored only for the current browser tab/window. Closing the tab resets to <b>$</b>.
                </p>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="notifications-settings">
                <button className="alert-button" onClick={handleLogoutAll}>Logout from All Devices</button>
                <button className="alert-button" style={{ backgroundColor: '#ff4d4d' }} onClick={handleDeactivate}>Deactivate My Account</button>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="notifications-settings">
                <p><strong>📊 Usage Stats</strong></p>
                <p><strong>Last Active:</strong> {formatLoginTime(usageStats.last_login)}</p>
                <p><strong>Logins:</strong> {usageStats.login_count}</p>
                <p><strong>Time Spent:</strong> {(usageStats.total_minutes_spent / 60).toFixed(1)} hrs</p>
                <p><strong>Reports Downloaded:</strong> {usageStats.reports_downloaded}</p>
                <p><strong>Expenses Added:</strong> {usageStats.expenses_added}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsMenu;
