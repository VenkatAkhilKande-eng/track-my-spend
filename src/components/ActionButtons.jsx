// components/ActionButtons.jsx
import React from 'react';
import '../styles/ActionButtons.css';

function ActionButtons({ viewMode, statsVisible, handleClick }) {
  return (
    <div className="home-actions">
      {!statsVisible && (
        <>
          <button className={`action-btn ${viewMode === 'add' ? 'move-top-left' : viewMode ? 'hidden-btn' : ''}`} onClick={() => handleClick('add')}>Add Expense</button>
          <button className={`action-btn ${viewMode === 'view' || statsVisible ? 'move-top-left' : viewMode ? 'hidden-btn' : ''}`} onClick={() => handleClick('view')}>View Expense</button>
        </>
      )}
    </div>
  );
}

export default ActionButtons;