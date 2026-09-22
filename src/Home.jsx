import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./styles/HomeLayout.css";
import TrackMyLogo from "./assets/Track My.png";
import { useNavigate } from "react-router-dom";
import ProfileMenu from './components/ProfileMenu';
import ActionButtons from './components/ActionButtons';
import AddExpenseForm from './components/AddExpenseForm';
import ViewExpenseForm from './components/ViewExpenseForm';
import ExpenseStats from './components/ExpenseStats';
import DeleteExpenseTable from './components/DeleteExpenseTable';
import SettingsMenu from './components/SettingsMenu';
import NotificationsBell from './components/NotificationsBell';
import ChatBotWidget from './components/ChatBotWidget';




const categories = {
  'Living Expenses': ['Rent', 'Utilities', 'Groceries', 'Internet'],
  'Transportation': ['Fuel', 'Car Maintenance', 'Public Transport', 'Insurance'],
  'Food & Dining': ['Restaurants', 'Takeout', 'Coffee', 'Snacks'],
  'Healthcare': ['Medical Bills', 'Pharmacy', 'Health Insurance'],
  'Entertainment': ['Movies', 'Games', 'Travel', 'Events'],
  'Financial': ['Savings', 'Loan Payment', 'Investments'],
  'Education': ['Tuition', 'Books', 'Courses'],
  'Others': ['Gifts', 'Donations', 'Miscellaneous']
};

const DEFAULT_CURRENCY = "$";

// “Base” FX rates relative to USD. Replace with your live rates if needed.
const FX = {
  $: 1, // USD
  "₹": 83.0, // USD->INR approximate
  "€": 0.92, // USD->EUR approximate
};

function Home(  ) {
  const [formData, setFormData] = useState({
    date: '', fromDate: '', toDate: '',
    month: '', fromMonth: '', toMonth: '',
    year: '', fromYear: '', toYear: '',
    category: '', subcategory: '', description: '', amount: ''
  });
  
  const [currency, setCurrency] = useState(
    sessionStorage.getItem("sessionCurrency") ||
      localStorage.getItem("preferredCurrency") ||
      DEFAULT_CURRENCY
  );

  const [expenses, setExpenses] = useState([]);
  const [deleteExpenses, setDeleteExpenses] = useState([]);
  const [viewMode, setViewMode] = useState(null);
  const [viewFilter, setViewFilter] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showDeleteTable, setShowDeleteTable] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [topCategory, setTopCategory] = useState('');
  const [topCategoryAmount, setTopCategoryAmount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [alertThreshold, setAlertThreshold] = useState(500);
  const [userData, setUserData] = useState({ username: '', password: '' });
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const convertFromTo = useCallback((amount, fromCur, toCur) => {
    const amt = parseFloat(amount || 0);
    const f = FX[fromCur] ?? 1; // value of 1 USD in fromCur
    const t = FX[toCur] ?? 1; // value of 1 USD in toCur
    // If FX stores how many "fromCur" per USD, then:
    // amount_in_USD = amt / f
    // amount_in_toCur = amount_in_USD * t
    return (amt / f) * t;
  }, []);

  // Legacy helper kept for children that expect a simple converter to current currency.
  // Interprets the incoming amount as USD if no source currency is given.
  const convertAmount = useCallback(
    (amount, sourceCurrency = "$") => convertFromTo(amount, sourceCurrency, currency),
    [currency, convertFromTo]
  );

  // Listen for runtime session currency changes (from SettingsMenu)
  useEffect(() => {
    const onSessChange = (e) => {
      const next = e?.detail || sessionStorage.getItem("sessionCurrency");
      setCurrency(next || DEFAULT_CURRENCY);
    };
    window.addEventListener("sessionCurrencyChanged", onSessChange);
    return () => window.removeEventListener("sessionCurrencyChanged", onSessChange);
  }, []);

  // Also reflect changes if localStorage preferredCurrency was updated elsewhere
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "preferredCurrency") {
        // Only adopt local pref if there is no session currency override
        if (!sessionStorage.getItem("sessionCurrency")) {
          setCurrency(e.newValue || DEFAULT_CURRENCY);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


  useEffect(() => {
    const username =
      localStorage.getItem("username") || sessionStorage.getItem("username");
    const password =
      localStorage.getItem("password") || sessionStorage.getItem("password");

    if (username && password) {
      setUserData?.({ username, password });
    }

    // Load expenses from your API
    // Expecting rows like:
    // { Date, Category, Subcategory, Description, Amount, Currency? }
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/expenses");
        const data = await res.json();
        // Ensure each row has a Currency (fallback USD)
        const normalized = Array.isArray(data)
          ? data.map((row) => ({
              ...row,
              Currency: row.Currency || "$",
            }))
          : [];
        setExpenses(normalized);
      } catch (e) {
        console.error("Failed to load expenses", e);
      }
    })();
  }, [setUserData]);

  // page slice (use current preferred currency for display)
  const currentItems = useMemo(() => {
    return expenses.slice(indexOfFirstItem, indexOfLastItem).map((exp) => {
      const fromCur = exp.Currency || "$";
      const displayAmount = convertFromTo(exp.Amount, fromCur, currency);
      return { ...exp, _displayAmount: displayAmount };
    });
  }, [expenses, indexOfFirstItem, indexOfLastItem, currency, convertFromTo]);

  useEffect(() => {
    let total = 0;
    const catTotals = {};
    expenses.forEach((e) => {
      const fromCur = e.Currency || "$";
      const amt = convertFromTo(e.Amount, fromCur, currency);
      total += amt;
      catTotals[e.Category] = (catTotals[e.Category] || 0) + amt;
    });
    setTotalSpent(total);

    // find top category
    let topCat = "";
    let topAmt = 0;
    Object.entries(catTotals).forEach(([cat, amt]) => {
      if (amt > topAmt) {
        topCat = cat;
        topAmt = amt;
      }
    });
    setTopCategory(topCat);
    setTopCategoryAmount(topAmt);
    setCategoryTotals(catTotals);
  }, [expenses, currency, convertFromTo]);


  const handleAddExpense = async () => {
    const { date, category, subcategory, amount, description } = formData;
    if (!date || !category || !subcategory || !amount) {
      alert("Please fill all required fields.");
      return;
    }
    const withCurrency = { ...payload, Currency: currency };
    try {
      const response = await fetch("http://localhost:8000/add-expense/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, category, subcategory, description, amount: parseFloat(amount), withCurrency })
      });

      if (response.ok) {
        setExpenses((prev) => [withCurrency, ...prev]);
        alert("Expense added!");
        const newAmount = parseFloat(amount);
        const updatedTotals = { ...categoryTotals };
        updatedTotals[category] = (updatedTotals[category] || 0) + newAmount;
        setCategoryTotals(updatedTotals);

        if (
          updatedTotals[category] > alertThreshold &&
          !notifications.includes(`${category} spending exceeded $${alertThreshold}`)
        ) {
          setNotifications(prev => [
            ...prev,
            `${category} spending exceeded $${alertThreshold}`
          ]);
        }

        setFormData({
          date: '', fromDate: '', toDate: '',
          month: '', fromMonth: '', toMonth: '',
          year: '', fromYear: '', toYear: '',
          category: '', subcategory: '', description: '', amount: ''
        });
      } else {
        alert("Failed to add expense");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred");
    }
  };

  const handleViewExpense = async () => {
    let url = "http://localhost:8000/expenses/?";
    if (viewFilter === 'by' && filterType === 'Date' && formData.date) {
      url += `date=${formData.date}`;
    } else if (viewFilter === 'from' && filterType === 'Date' && formData.fromDate && formData.toDate) {
      url += `from_date=${formData.fromDate}&to_date=${formData.toDate}`;
    } else if (viewFilter === 'by' && filterType === 'Month' && formData.month) {
      url += `month=${formData.month}`;
    }

    if (formData.search) {
      url += `${url.endsWith('?') ? '' : '&'}search=${encodeURIComponent(formData.search)}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      setExpenses(data);
      setTotalSpent(data.reduce((sum, row) => sum + parseFloat(row.Amount || 0), 0));

      const categoryTotals = {};
      data.forEach(row => {
        const cat = row.Category;
        const amt = parseFloat(row.Amount || 0);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      });

      let maxCat = '';
      let maxAmt = 0;
      for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > maxAmt) {
          maxCat = cat;
          maxAmt = amt;
        }
      }
      setTopCategory(maxCat);
      setTopCategoryAmount(maxAmt);
      setStatsVisible(true);
      setViewMode(null);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  const handleDeleteExpense = async () => {
    let url = "http://localhost:8000/expenses/?";
    if (filterType === 'Date' && formData.date) {
      url += `date=${formData.date}`;
    } else if (filterType === 'Month' && formData.month) {
      url += `month=${formData.month}`;
    } else if (filterType === 'Year' && formData.year) {
      url += `year=${formData.year}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      setDeleteExpenses(data);
      setShowDeleteTable(true);
    } catch (error) {
      console.error("Failed to fetch for delete:", error);
    }
  };

  const handleDeleteRow = async (exp) => {
    try {
      const res = await fetch("http://localhost:8000/delete-expense/", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: exp.Date,
          category: exp.Category,
          subcategory: exp.Subcategory,
          description: exp.Description,
          amount: parseFloat(exp.Amount)
        })
      });
      if (res.ok) {
        setDeleteExpenses(prev => prev.filter(e =>
          !(e.Date === exp.Date &&
            e.Category === exp.Category &&
            e.Subcategory === exp.Subcategory &&
            e.Description === exp.Description &&
            parseFloat(e.Amount) === parseFloat(exp.Amount))
        ));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleBack = () => {
    setViewMode(null);
    setViewFilter(null);
    setStatsVisible(false);
    setDeleteMode(false);
    setShowDeleteTable(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    sessionStorage.removeItem("username");
    navigate("/");
  };
  
  useEffect(() => {
    const username = localStorage.getItem("username") || sessionStorage.getItem("username");
    if (!username) return;

    const start = Date.now();
    const interval = setInterval(() => {
      const minutesSpent = Math.floor((Date.now() - start) / 60000);
      if (minutesSpent > 0) {
        fetch("http://localhost:5000/track-usage-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, minutes: minutesSpent })
        }).catch(console.error);
      }
    }, 1000 * 60 * 5); // every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <div className="logo-container">
        <img src={TrackMyLogo} alt="Track My Logo" className="logo-image" />
      </div>
      <div className="profile-icon">
        <NotificationsBell
          alertThreshold={alertThreshold}
          setAlertThreshold={setAlertThreshold}
          categoriesData={categories}
          userData={userData}
        />
        <div className="profile-avatar-hover" onClick={() => setShowProfileMenu(true)}>👤</div>
      </div>

      {showProfileMenu && (
        <ProfileMenu
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          setDeleteMode={setDeleteMode}
          setShowSettingsMenu={setShowSettingsMenu}
          navigate={navigate}
          handleLogout={handleLogout}
        />
      )}

      <ActionButtons {...{ viewMode, statsVisible, handleClick: (mode) => { setViewMode(mode); setStatsVisible(false); } }} />

      {viewMode === 'add' && (
          <AddExpenseForm
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onAdd={handleAddExpense}
            handleBack={handleBack}
            currency={currency}
          />
      )}

      {viewMode === 'view' && (
          <ViewExpenseForm
            formData={formData}
            setFormData={setFormData}
            viewFilter={viewFilter}
            setViewFilter={setViewFilter}
            filterType={filterType}
            setFilterType={setFilterType}
            handleView={handleViewExpense}
            handleBack={handleBack}
          />
      )}

      {statsVisible && (
        <ExpenseStats
          currentItems={
            // Give stats the original rows; it already accepts convertAmount
            expenses.slice(indexOfFirstItem, indexOfLastItem).map((row) => ({
              ...row,
              // keep raw, and the stats component will call convertAmount(row.Amount, ...)
            }))
          }
          totalSpent={totalSpent}
          topCategory={topCategory}
          topCategoryAmount={topCategoryAmount}
          paginate={paginate}
          currentPage={currentPage}
          totalPages={Math.ceil(expenses.length / itemsPerPage)}
          viewFilter={viewFilter}
          filterType={filterType}
          formData={formData}
          handleClick={null}
          handleBack={handleBack}
          currency={currency} 
          convertAmount={(amt, src = "$") => convertFromTo(amt, src, currency)}
        />
      )}

      {deleteMode && (
        <DeleteExpenseTable
          formData={formData}
          setFormData={setFormData}
          filterType={filterType}
          setFilterType={setFilterType}
          deleteExpenses={deleteExpenses}
          setDeleteExpenses={setDeleteExpenses}
          handleBack={handleBack}
          onFetch={handleDeleteExpense}
          onDelete={handleDeleteRow}
          showDeleteMenu
          setShowDeleteMenu
        />
      )}

      {showSettingsMenu && (
        <SettingsMenu
          userData={userData}
          setUserData={setUserData}
          setShowSettingsMenu={setShowSettingsMenu}
        />
      )}
      <ChatBotWidget />
    </div>
  );
}

export default Home;
