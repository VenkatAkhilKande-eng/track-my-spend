import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import '../styles/ExpenseStats.css';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a1cfff', '#d84f4f'];

function ExpenseStats({
  currentItems, totalSpent, topCategory, topCategoryAmount,
  paginate, currentPage, totalPages,
  viewFilter, filterType, formData, handleBack, handleClick, currency, convertAmount
}) {
  const [viewMode, setViewMode] = useState('table'); // table | pie | bar

 const pieData = useMemo(() => {
    const totals = {};
    currentItems.forEach(item => {
      const category = item.Category;
      totals[category] = (totals[category] || 0) + convertAmount(item.Amount);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [currentItems, convertAmount]);

  const barData = useMemo(() => {
    const grouped = {};
    currentItems.forEach(item => {
      const date = item.Date;
      grouped[date] = (grouped[date] || 0) + convertAmount(item.Amount);
    });
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }, [currentItems, convertAmount]);


  const renderActiveFilter = () => {
    if (viewFilter === 'by') {
      if (filterType === 'Date' && formData.date) return `Date: ${formData.date}`;
      if (filterType === 'Month' && formData.month) return `Month: ${formData.month}`;
      if (filterType === 'Year' && formData.year) return `Year: ${formData.year}`;
    } else if (viewFilter === 'from' && filterType === 'Date') {
      if (formData.fromDate && formData.toDate)
        return `From: ${formData.fromDate} to ${formData.toDate}`;
    }
    return '';
  };

  return (
    <div className="table-with-summary">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => setViewMode('table')}>Table View</button>
        <button onClick={() => setViewMode('pie')}>Pie Chart</button>
        <button onClick={() => setViewMode('bar')}>Bar Chart</button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '1rem',
        minWidth: '200px',
        marginTop: '1rem'
      }}>
        
        <button
          className="action-btn move-top-left"
          onClick={handleClick || (() => {})}
          style={{ pointerEvents: handleClick ? 'auto' : 'none' }}
        >
          View Expense
        </button>

        {renderActiveFilter() && (
          <div className="filter-label">
            {renderActiveFilter()}
          </div>
        )}

        <button className="back-btn" onClick={handleBack}>⬅ Back</button>
      </div>

      {viewMode === 'table' && (
        <div className="table-container">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th><th>Category</th><th>Description</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((exp, idx) => (
                <tr key={idx}>
                  <td>{exp.Date}</td>
                  <td>{exp.Category}</td>
                  <td>{exp.Description || '-'}</td>
                  <td>{convertAmount(exp.Amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => paginate(idx + 1)}
                  className={currentPage === idx + 1 ? 'active-page' : ''}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'pie' && (
        <div className="chart-container">
          <PieChart width={500} height={300}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              label
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}

      {viewMode === 'bar' && (
        <div className="chart-container">
          <BarChart width={600} height={300} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#82ca9d" />
          </BarChart>
        </div>
      )}


      {/* Summary Boxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: '2rem' }}>
        <div className="summary-box">
          <h3>Total Spent</h3>
          <p>{currency}{Number(totalSpent).toFixed(2)}</p>
        </div>
        <div className="summary-box category-summary">
          <h3>Top Category</h3>
          <p>
            {topCategory
              ? `${topCategory} - ${currency}${Number(topCategoryAmount).toFixed(2)}`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExpenseStats;
