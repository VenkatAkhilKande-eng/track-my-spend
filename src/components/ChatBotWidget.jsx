import { useState, useEffect } from 'react';
import '../styles/ChatBotWidget.css';

const ChatBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(false);
  const [username, setUsername] = useState("");
  const [chatInitialized, setChatInitialized] = useState(false);
  const [alertStage, setAlertStage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [tempThreshold, setTempThreshold] = useState("");
  const [pendingFlowComplete, setPendingFlowComplete] = useState(false);
  const [justCancelledAlert, setJustCancelledAlert] = useState(false);


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

  useEffect(() => {
    const wasJustLoggedIn = localStorage.getItem("justLoggedIn") === "true";
    const name = localStorage.getItem("username") || sessionStorage.getItem("username");
    setUsername(name);

    if (wasJustLoggedIn) {
      localStorage.removeItem("justLoggedIn");
      setShowGreetingBubble(true);
      setTimeout(() => setShowGreetingBubble(false), 4000);
    }
  }, []);

  const handleSend = async () => {
    setJustCancelledAlert(false);
    if (!userInput.trim()) return;

    if (/^(good bye|nah|i'm good|bye)$/i.test(userInput.trim())) {
      setChat([
        { sender: "user", text: userInput },
        { sender: "bot", text: "Alright, goodbye! 👋" }
      ]);
      setUserInput("");
      setChatInitialized(false); // Mark that bot can restart greeting
      setTimeout(() => {
        setChat([
          { sender: "bot", text: `👋 Welcome back, ${username}! How can I assist you with your expenses today?` }
        ]);
        setChatInitialized(true);
      }, 2000); // restart greeting after delay
      return;
    }

    const userMessage = { sender: "user", text: userInput };
    setChat(prev => [...prev, userMessage, { sender: "bot", text: "..." }]);
    setUserInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "username": username
        },
        body: JSON.stringify({ message: userInput })
      });

      const data = await response.json();

      setChat(prev => {
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          sender: "bot",
          text: data.reply || "Sorry, I couldn't understand that."
        };
        const replyText = (data.reply || "").toLowerCase();
        if (/no|no thanks|nope/.test(replyText) && !alertStage && pendingFlowComplete) {
          newChat.push({ sender: "bot", text: "🤖 Can I help you with anything else?" });
          setPendingFlowComplete(false);
        }
        return newChat;
      });

    } catch (err) {
      console.error("Chat error:", err);
      setChat(prev => {
        const newChat = [...prev];
        newChat[newChat.length - 1] = { sender: "bot", text: "Server error. Please try again later." };
        return newChat;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMessage = async (text) => {
    setJustCancelledAlert(false);
    const userMessage = { sender: "user", text };
    setChat(prev => [...prev, userMessage, { sender: "bot", text: "..." }]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "username": username
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      setChat(prev => {
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          sender: "bot",
          text: data.reply || "Sorry, I couldn't understand that."
        };
        const replyText = (data.reply || "").toLowerCase();
        if (/no|no thanks|nope/.test(replyText) && !alertStage && pendingFlowComplete) {
          newChat.push({ sender: "bot", text: "🤖 Can I help you with anything else?" });
          setPendingFlowComplete(false);
        }
        return newChat;
      });

    } catch (err) {
      console.error("Chat error:", err);
      setChat(prev => {
        const newChat = [...prev];
        newChat[newChat.length - 1] = { sender: "bot", text: "Server error. Please try again later." };
        return newChat;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showGreetingBubble && (
        <div className="greeting-bubble">👋 Welcome back, {username}!</div>
      )}
      <div className={`chatbot-container ${showGreetingBubble ? 'greeting-shift' : ''}`}>
        <div className="chatbot-toggle" onClick={() => {
          setIsOpen(prev => {
            const next = !prev;
            if (next && !chatInitialized) {
              setChat([{ sender: "bot", text: `👋 Welcome back, ${username}! How can I assist you with your expenses today?` }]);
              setChatInitialized(true);
            }
            return next;
          });
        }}>💬</div>

        {isOpen && (
          <div className="chatbot-box">
            <div className="chatbot-header">💡 ExpenseBot</div>
            <div className="chatbot-body">
              {chat.map((msg, idx) => (
                <div key={idx} className={`chat-msg ${msg.sender}`}>
                  {msg.text === "..." ? <span className="typing-loader"><span></span><span></span><span></span></span> : msg.text}
                </div>
              ))}

              {chat.length === 1 && (
                <div className="chat-options">
                  <button onClick={() => handleQuickMessage("Give me tips to reduce expenses")}>💡 Tips</button>
                  <button onClick={() => handleQuickMessage("What is my top spending category?")}>📊 Top Spending</button>
                  <button onClick={() => handleQuickMessage("Show my monthly summary")}>📅 Summary</button>
                  <button onClick={() => handleQuickMessage("Help me set an alert")}>🛠 Set Alert</button>
                </div>
              )}

              {chat.length >= 2 && chat.at(-2)?.sender === "user" && (() => {
                const last = chat.at(-2).text.toLowerCase();
                if (/tips/.test(last)) {
                  return (
                    <div className="chat-options follow-up-options">
                      <button onClick={() => handleQuickMessage("Give me food saving tips")}>🍱 Food Tips</button>
                      <button onClick={() => handleQuickMessage("Give me transport saving tips")}>🚗 Transport Tips</button>
                      <button onClick={() => handleQuickMessage("How to reduce entertainment expenses?")}>🎮 Entertainment Tips</button>
                      <button onClick={() => handleQuickMessage("Tips for groceries")}>🛒 Grocery Tips</button>
                    </div>
                  );
                }
                if (/top spending/.test(last)) {
                  return (
                    <div className="chat-options follow-up-options">
                      <button onClick={() => handleQuickMessage("Top spending this month")}>📅 This Month</button>
                      <button onClick={() => handleQuickMessage("Top spending last month")}>📆 Last Month</button>
                      <button onClick={() => handleQuickMessage("Top spending by category")}>📊 By Category</button>
                      <button onClick={() => handleQuickMessage("Top spending by date")}>📈 By Date</button>
                    </div>
                  );
                }
                if (/summary/.test(last)) {
                  return (
                    <div className="chat-options follow-up-options">
                      <button onClick={() => handleQuickMessage("Show my monthly summary")}>📅 This Month</button>
                      <button onClick={() => handleQuickMessage("Show my yearly summary")}>📆 This Year</button>
                      <button onClick={() => handleQuickMessage("Show summary for July")}>📊 July Summary</button>
                      <button onClick={() => handleQuickMessage("Summary by category")}>📂 By Category</button>
                    </div>
                  );
                }
                if (/set alert|Help me set an alert/.test(last) && !alertStage && !justCancelledAlert) {
                  setAlertStage("category");
                  return null;
                }
                return null;
              })()}

              {alertStage && (() => {
                if (alertStage === "category") {
                  return (
                    <div className="chat-options follow-up-options">
                      <div>Select a category:</div>
                      {Object.keys(categories).map(cat => (
                        <button key={cat} onClick={() => {
                          setSelectedCategory(cat);
                          setAlertStage("subcategory");
                        }}>{cat}</button>
                      ))}
                    </div>
                  );
                }
                if (alertStage === "subcategory") {
                  return (
                    <div className="chat-options follow-up-options">
                      <div>Select a subcategory for {selectedCategory}:</div>
                      {categories[selectedCategory]?.map(sub => (
                        <button key={sub} onClick={() => {
                          setSelectedSubcategory(sub);
                          setAlertStage("threshold");
                        }}>{sub}</button>
                      ))}
                      <button onClick={() => {
                        setSelectedSubcategory("");
                        setAlertStage("threshold");
                      }}>Skip Subcategory</button>
                    </div>
                  );
                }
                if (alertStage === "threshold") {
                  return (
                    <div className="chat-options follow-up-options">
                      <div>
                        Set threshold for {selectedCategory}
                        {selectedSubcategory && `, ${selectedSubcategory}`}:
                      </div>
                      <input
                        type="number"
                        placeholder="Enter threshold (e.g., 200)"
                        value={tempThreshold}
                        onChange={(e) => setTempThreshold(e.target.value)}
                      />
                      <button onClick={() => {
                        const msg = `Set alert for ${selectedCategory}` +
                          (selectedSubcategory ? `, ${selectedSubcategory}` : '') +
                          ` over $${tempThreshold}`;
                        handleQuickMessage(msg);
                        setPendingFlowComplete(true);
                        setAlertStage(null);
                        setSelectedCategory("");
                        setSelectedSubcategory("");
                        setTempThreshold("");
                      }}>✅ Confirm Alert</button>
                      <button onClick={() => {
                        setAlertStage(null);
                        setPendingFlowComplete(true);
                        setJustCancelledAlert(true);
                        setSelectedCategory("");
                        setSelectedSubcategory("");
                        setTempThreshold("");
                      }}>❌ Cancel</button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="chatbot-input">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask something..."
                disabled={loading}
              />
              <button onClick={handleSend} disabled={loading}>
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatBotWidget;
