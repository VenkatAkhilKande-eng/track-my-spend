import React, { useState, useEffect } from 'react';
import '../styles/ModalMenus.css';
import JSZip from "jszip";

function ProfileMenu({
  showProfileMenu,
  setShowProfileMenu,
  setDeleteMode,
  setShowSettingsMenu,
  navigate,
  setShowDeleteMenu,
  handleLogout
}) {
  const [avatar, setAvatar] = useState(null);
  const [initials, setInitials] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    const storedAvatar = localStorage.getItem('avatar');
    const storedUsername = localStorage.getItem('username') || sessionStorage.getItem('username');
    if (storedAvatar) setAvatar(storedAvatar);
    if (storedUsername && storedUsername.length > 0) {
      setInitials(storedUsername.charAt(0).toUpperCase());
    }
  }, []);

  const convertToCSV = (data) => {
    if (!data?.length) return '';
    const keys = Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(row => keys.map(k => `"${row[k] || ''}"`).join(','));
    return [header, ...rows].join('\n');
  };

  const handleDownload = async () => {
    try {
      const res = await fetch("http://localhost:8000/expenses/");
      const data = await res.json();
      let fileContent, mimeType, fileName;

      if (downloadFormat === "csv") {
        fileContent = convertToCSV(data);
        mimeType = "text/csv";
        fileName = "my_expenses.csv";
      } else if (downloadFormat === "json") {
        fileContent = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        fileName = "my_expenses.json";
      } else if (downloadFormat === "zip") {
        const zip = new JSZip();
        zip.file("expenses.json", JSON.stringify(data, null, 2));
        const blob = await zip.generateAsync({ type: "blob" });
        triggerDownload(blob, "my_expenses.zip");
        finalizeSync();
        return;
      }

      const blob = new Blob([fileContent], { type: mimeType });
      triggerDownload(blob, fileName);
      finalizeSync();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download data.");
    }
  };

  const triggerDownload = (blob, fileName) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const finalizeSync = async () => {
    setShowDownloadModal(false);
    const username = localStorage.getItem("username") || sessionStorage.getItem("username");
    await fetch("http://localhost:5000/increment-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const now = new Date();
    setLastSynced(`Today at ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`);
  };

  if (!showProfileMenu) {
    return <div className="profile-icon" onClick={() => setShowProfileMenu(true)}>👤</div>;
  }

  return (
    <>
      <div className="backdrop" onClick={() => setShowProfileMenu(false)}></div>
      <div className="profile-menu-center">
        <div className="profile-header">
          {avatar
            ? <img src={avatar} alt="avatar" className="profile-avatar-img" />
            : <div className="profile-avatar-fallback">{initials || '👤'}</div>
          }
          <span className="close-profile" onClick={() => setShowProfileMenu(false)}>✖</span>
        </div>

        <button onClick={() => setShowDownloadModal(true)}>Download My Data</button>
        <button onClick={() => { setDeleteMode(true); setShowProfileMenu(false); setShowDeleteMenu(true); }}>Delete Expense</button>
        <button onClick={() => { setShowSettingsMenu(true); setShowProfileMenu(false); }}>Settings</button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {showDownloadModal && (
        <>
          <div className="backdrop" onClick={() => setShowDownloadModal(false)}></div>
          <div className="download-modal">
            <p>Download your expense data</p>
            <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value)}>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
              <option value="zip">ZIP (.zip)</option>
            </select>
            <button onClick={handleDownload}>Download</button>
            <button onClick={() => setShowDownloadModal(false)}>Cancel</button>
            {lastSynced && <p className="sync-status">Last synced: {lastSynced}</p>}
          </div>
        </>
      )}
    </>
  );
}

export default ProfileMenu;
