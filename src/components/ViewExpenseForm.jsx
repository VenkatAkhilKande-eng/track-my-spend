// components/ViewExpenseForm.jsx
import React from 'react';
import '../styles/FormStyles.css';


function ViewExpenseForm({ formData, setFormData, viewFilter, setViewFilter, filterType, setFilterType, handleView, handleBack }) {
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const renderInputs = () => {
    if (viewFilter === 'by') {
      if (filterType === 'Date') return <input type="date" name="date" value={formData.date} onChange={handleChange} />;
      if (filterType === 'Month') return <input type="month" name="month" value={formData.month} onChange={handleChange} />;
      if (filterType === 'Year') return <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="Year" />;
    } else if (viewFilter === 'from') {
      if (filterType === 'Date') {
        return (
          <>
            <input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} />
            <input type="date" name="toDate" value={formData.toDate} onChange={handleChange} />
          </>
        );
      }
      if (filterType === 'Month') {
        return (
          <>
            <input type="month" name="fromMonth" value={formData.fromMonth} onChange={handleChange} />
            <input type="month" name="toMonth" value={formData.toMonth} onChange={handleChange} />
          </>
        );
      }
      if (filterType === 'Year') {
        return (
          <>
            <input type="number" name="fromYear" placeholder="From Year" value={formData.fromYear} onChange={handleChange} />
            <input type="number" name="toYear" placeholder="To Year" value={formData.toYear} onChange={handleChange} />
          </>
        );
      }
    }
    return null;
  };

  return (
    <div className="content-wrapper">
      <button className="side-back-button" onClick={handleBack}>⬅ Back</button>
      <div className="form-box">
        <div className="view-toggle-buttons">
          <div>
            <button className="view-btn" onClick={() => setViewFilter('by')}>By</button>
            {viewFilter === 'by' && (
              <div className="sub-options">
                <button onClick={() => setFilterType('Date')}>Date</button>
                <button onClick={() => setFilterType('Month')}>Month</button>
                <button onClick={() => setFilterType('Year')}>Year</button>
              </div>
            )}
          </div>
          <div>
            <button className="view-btn" onClick={() => setViewFilter('from')}>From</button>
            {viewFilter === 'from' && (
              <div className="sub-options">
                <button onClick={() => setFilterType('Date')}>Date</button>
                <button onClick={() => setFilterType('Month')}>Month</button>
                <button onClick={() => setFilterType('Year')}>Year</button>
              </div>
            )}
          </div>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search..."
            name="search"
            value={formData.search || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, search: e.target.value }))}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="dynamic-inputs">{renderInputs()}</div>
        <button className="form-add-btn" onClick={handleView}>View</button>
      </div>
    </div>
  );
}

export default ViewExpenseForm;