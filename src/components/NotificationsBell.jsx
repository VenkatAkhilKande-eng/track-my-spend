import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import '../styles/NotificationsBell.css';

function NotificationsBell({
  alertThreshold,
  setAlertThreshold,
  categoriesData,
  userData
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [alertRules, setAlertRules] = useState([]);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [weeklyDay, setWeeklyDay] = useState("Sunday");
  const [monthlyEnabled, setMonthlyEnabled] = useState(false);
  const [monthlyDay, setMonthlyDay] = useState(1); // 1..31
  const [yearlyEnabled, setYearlyEnabled] = useState(false);
  const [yearlyMonth, setYearlyMonth] = useState("January");
  const [yearlyDay, setYearlyDay] = useState(1);
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const username = userData?.username || '';
  const categoryOptions = Object.keys(categoriesData);
  const subcategoryMap = categoriesData;

  useEffect(() => {
    if (!username) return;
    fetch(`http://localhost:5000/get-alerts?username=${username}`)
      .then(res => res.json())
      .then(data => setAlertRules(data || []))
      .catch(err => console.error("Failed to load alerts:", err));
  }, [showPopup, username]);

  useEffect(() => {
    if (!username) return;
    fetch(`http://localhost:5000/get-notifications?username=${username}`)
      .then(res => res.json())
      .then(data => setNotifications(data || []))
      .catch(err => console.error("Failed to fetch notifications", err));
  }, [username, showPopup]);

  // NEW: load saved scheduled alerts when opening or switching to the tab
  useEffect(() => {
    if (!username) return;
    if (!showPopup) return;                // only when popup is open
    if (activeTab !== 'scheduled') return; // only when scheduled tab is active

    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/get-scheduled-alerts?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to load scheduled alerts');
        const data = await res.json();

        setWeeklyEnabled(Boolean(data.weekly_enabled));
        setWeeklyDay(data.weekly_day || "Sunday");

        setMonthlyEnabled(Boolean(data.monthly_enabled));
        setMonthlyDay(Number(data.monthly_day ?? 1) || 1);

        setYearlyEnabled(Boolean(data.yearly_enabled));
        setYearlyMonth(data.yearly_month || "January");
        setYearlyDay(Number(data.yearly_day ?? 1) || 1);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [username, showPopup, activeTab]);


  const togglePopup = () => setShowPopup(prev => !prev);
  const handleSetAlert = async () => {
    alert(username);
    if (!username || !category || !customAmount) {
      alert("Please fill in all fields and ensure you're logged in.");
      return;
    }

    const payload = {
      username,
      category,
      subcategory: subcategory || null,
      threshold: parseFloat(customAmount)
    };

    try {
      const res = await fetch("http://localhost:5000/set-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newAlert = await res.json();
        setAlertRules(prev => [...prev, { ...payload, id: newAlert.id || Date.now() }]);
        setCategory('');
        setSubcategory('');
        setCustomAmount('');
        alert("Alert successfully set.");
      } else {
        alert("Failed to set alert.");
      }
    } catch (err) {
      console.error("Error setting alert:", err);
      alert("Error while setting alert.");
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      const res = await fetch("http://localhost:5000/delete-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setAlertRules(prev => prev.filter(rule => rule.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  return (
    <>
      <div className="notifications-wrapper">
        <div className="notifications-icon" onClick={togglePopup} title="Smart Alerts">
          <Bell />
          {notifications.length > 0 && <span className="notif-count" />}
        </div>
      </div>

      {showPopup && (
        <>
          <div className="notifications-backdrop" onClick={() => setShowPopup(false)}></div>
          <div className="notifications-popup nav-layout">
            <div className="notifications-header">
              <h3 className="notifications-title">🔔 Smart Alerts</h3>
              <span className="notifications-close" onClick={() => setShowPopup(false)}>×</span>
            </div>
            <div className="notifications-layout">
              <div className="notifications-nav">
                <button
                  className={activeTab === 'settings' ? 'active' : ''}
                  onClick={() => setActiveTab('settings')}
                >
                  Set Alerts
                </button>
                <button
                  className={activeTab === 'scheduled' ? 'active' : ''}
                  onClick={() => setActiveTab('scheduled')}
                >
                  Scheduled Alerts
                </button>
                <button
                  className={activeTab === 'notifications' ? 'active' : ''}
                  onClick={() => setActiveTab('notifications')}
                >
                  Show Notifications
                </button>
              </div>

              {activeTab === 'settings' && (
                <div className="notifications-content">
                  <div className="notifications-settings">
                    <label className="setting-toggle">
                      <input
                        type="checkbox"
                        checked={alertsEnabled}
                        onChange={() => setAlertsEnabled(!alertsEnabled)}
                      />
                      Enable Alerts
                    </label>

                    <label className="setting-threshold">
                      Category:
                      <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">-- Select Category --</option>
                        {categoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </label>

                    {category && subcategoryMap[category] && (
                      <label className="setting-threshold">
                        Subcategory (optional):
                        <select
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                        >
                          <option value="">-- None --</option>
                          {subcategoryMap[category].map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label className="setting-threshold">
                      Alert Amount ($):
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    </label>

                    <button className="alert-button" onClick={handleSetAlert}>Set Alert</button>

                    {alertRules.length > 0 && (
                      <div className="alert-rules-list">
                        <h4>Defined Alerts</h4>
                        <ul>
                          {alertRules.map((rule, idx) => (
                            <li key={rule.id || idx}>
                              <span>
                                {rule.category}
                                {rule.subcategory ? ` → ${rule.subcategory}` : ''} ≥ ${rule.threshold}
                              </span>
                              {rule.id && (
                                <button onClick={() => handleDeleteRule(rule.id)}>🗑</button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'scheduled' && (
                <div className="notifications-content">
                  <div className="notifications-scheduled">
                    <h4>📅 Schedule-Based Alerts</h4>

                    {/* Weekly */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 8, marginTop: 8 }}>
                      <label className="setting-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={weeklyEnabled}
                          onChange={(e) => setWeeklyEnabled(e.target.checked)}
                        />
                        Enable Weekly Report
                      </label>

                      <div style={{ marginTop: 8, opacity: weeklyEnabled ? 1 : 0.6 }}>
                        <label>
                          Day of week:
                          <select
                            value={weeklyDay}
                            onChange={(e) => setWeeklyDay(e.target.value)}
                            style={{ marginLeft: 8 }}
                            disabled={!weeklyEnabled}
                          >
                            {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    {/* Monthly */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 8, marginTop: 12 }}>
                      <label className="setting-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={monthlyEnabled}
                          onChange={(e) => setMonthlyEnabled(e.target.checked)}
                        />
                        Enable Monthly Report
                      </label>

                      <div style={{ marginTop: 8, opacity: monthlyEnabled ? 1 : 0.6 }}>
                        <label>
                          Day of month:
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={monthlyDay}
                            onChange={(e) => setMonthlyDay(Number(e.target.value))}
                            style={{ marginLeft: 8, width: 80 }}
                            disabled={!monthlyEnabled}
                          />
                        </label>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          (If a month has fewer days, it will run on the last day.)
                        </div>
                      </div>
                    </div>

                    {/* Yearly */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 8, marginTop: 12 }}>
                      <label className="setting-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={yearlyEnabled}
                          onChange={(e) => setYearlyEnabled(e.target.checked)}
                        />
                        Enable Yearly Report
                      </label>

                      <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', opacity: yearlyEnabled ? 1 : 0.6 }}>
                        <label>
                          Month:
                          <select
                            value={yearlyMonth}
                            onChange={(e) => setYearlyMonth(e.target.value)}
                            style={{ marginLeft: 8 }}
                            disabled={!yearlyEnabled}
                          >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </label>

                        <label>
                          Day:
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={yearlyDay}
                            onChange={(e) => setYearlyDay(Number(e.target.value))}
                            style={{ marginLeft: 8, width: 80 }}
                            disabled={!yearlyEnabled}
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      style={{ marginTop: 12 }}
                      onClick={async () => {
                        await fetch("http://localhost:5000/set-scheduled-alerts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            username,
                            weekly_enabled: weeklyEnabled,
                            weekly_day: weeklyDay,
                            monthly_enabled: monthlyEnabled,
                            monthly_day: monthlyDay,
                            yearly_enabled: yearlyEnabled,
                            yearly_month: yearlyMonth,
                            yearly_day: yearlyDay
                          })
                        });
                        alert("Scheduled alert preferences saved.");
                      }}
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="notifications-content">
                  <div className="notifications-body">
                    {notifications.length === 0 ? (
                      <p className="notifications-empty">No alerts at the moment</p>
                    ) : (
                      <ul className="notifications-list">
                        {notifications.map((noteObj, idx) => {
                          const { message, severity } = typeof noteObj === 'string'
                            ? { message: noteObj, severity: 'warning' }
                            : noteObj;
                          const labelPart = message.replace("⚠️ ", "").split(" exceeded by ")[0].split(" is nearing")[0];
                          const icon = severity === 'critical' ? '🔴'
                                      : severity === 'warning' ? '🟡'
                                      : '🟢';
                          const [category, subcategoryRaw] = labelPart.includes("→") ? labelPart.split(" → ") : [labelPart, null];
                          const threshold = alertRules.find(
                            rule => rule.category === category && (rule.subcategory || "NULL") === (subcategoryRaw || "NULL")
                          )?.threshold;

                          return (
                            <li key={idx} className={`notifications-item ${severity}`}>
                              <strong>{icon} {message}</strong>
                              <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={async () => {
                                    await fetch("http://localhost:5000/dismiss-notification", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ username, message })
                                    });
                                    setNotifications(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default NotificationsBell;
