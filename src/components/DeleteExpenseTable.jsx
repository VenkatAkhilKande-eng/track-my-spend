import React from 'react';
import '../styles/DeleteExpenseTable.css';

function DeleteExpenseTable({
  formData, setFormData,
  filterType, setFilterType,
  deleteExpenses, setDeleteExpenses,
  handleBack, onFetch, onDelete,
  showDeleteMenu, setShowDeleteMenu
}) {
  const renderInputs = () => {
    if (filterType === 'Date') return <input type="date" name="date" value={formData.date} onChange={handleChange} />;
    if (filterType === 'Month') return <input type="month" name="month" value={formData.month} onChange={handleChange} />;
    if (filterType === 'Year') return <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="Year" />;
    return null;
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFetchClick = () => {
    onFetch();
  };

  if (!showDeleteMenu) return null;

  return (
    <>
      <div className="backdrop" onClick={() => setShowDeleteMenu(false)}></div>

      {/* Show Filter Box initially */}
      {deleteExpenses.length === 0 && (
        <div className="delete-expense-centera">
          <div className="form-box">
            <button className="side-back-button" onClick={handleBack}>⬅ Back</button>
            <div className="view-toggle-buttons">
              <button className="view-btn active">By</button>
              <div className="sub-options">
                <button onClick={() => setFilterType('Date')}>Date</button>
                <button onClick={() => setFilterType('Month')}>Month</button>
                <button onClick={() => setFilterType('Year')}>Year</button>
              </div>
            </div>
            <div className="dynamic-inputs">{renderInputs()}</div>
            <button className="form-add-btn" onClick={handleFetchClick}>Fetch</button>
          </div>
        </div>
      )}

      {/* Show Table Box after Fetch */}
      {deleteExpenses.length > 0 && (
        <div className="delete-expense-center">
          <div className="delete-table-container">
            <button className="side-back-button" onClick={() => {
              setDeleteExpenses([]); // hide table and go back to filter
            }}>⬅ Back</button>
            <table className="delete-table">
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Subcategory</th><th>Amount</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deleteExpenses.map((exp, idx) => (
                  <tr key={idx}>
                    <td>{exp.Date}</td>
                    <td>{exp.Category}</td>
                    <td>{exp.Subcategory}</td>
                    <td>{exp.Amount}</td>
                    <td><button className="delete-btn" onClick={() => onDelete(exp)}>🗑️ Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default DeleteExpenseTable;
