// Updated AddExpenseForm.jsx
import React from 'react';
import '../styles/FormStyles.css';


function AddExpenseForm({ formData, setFormData, categories, onAdd, handleBack, currency }) {
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const subcategories = formData.category ? categories[formData.category] || [] : [];

  return (
    <div className="content-wrapper">
      <button className="side-back-button" onClick={handleBack}>⬅ Back</button>
      <div className="form-box">
        <input type="date" name="date" value={formData.date} onChange={handleChange} />
        <select name="category" value={formData.category} onChange={handleChange} disabled={!formData.date}>
          <option value="">Select Category</option>
          {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select name="subcategory" value={formData.subcategory} onChange={handleChange} disabled={!formData.category}>
          <option value="">Select Subcategory</option>
          {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>
        <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Description (optional)" />
        <input type="number" name="amount" value={formData.amount} onChange={handleChange}   placeholder={`Amount (${currency})`} disabled={!formData.subcategory} />
        <button className="form-add-btn" onClick={onAdd}>Add</button>
      </div>
    </div>
  );
}

export default AddExpenseForm;