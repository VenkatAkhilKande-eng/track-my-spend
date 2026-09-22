import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csvParser from 'csv-parser';
import http from 'http';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// ---- Paths & FS setup -------------------------------------------------------
const DB_DIR = path.resolve(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const USERS_DB = path.resolve(DB_DIR, 'User.db');
console.log('Using DB at:', USERS_DB);

const EXPENSES_CSV = path.join(__dirname, 'expenses.csv');
if (!fs.existsSync(EXPENSES_CSV)) {
  fs.writeFileSync(EXPENSES_CSV, 'Date,Category,Subcategory,Description,Amount\n', 'utf-8');
}

// ---- Express middleware -----------------------------------------------------
app.use(cors()); // tighten origin later if needed
app.use(express.json({ limit: '5mb' }));

// ---- SQLite helpers ---------------------------------------------------------
sqlite3.verbose();

function openDb() {
  const db = new sqlite3.Database(USERS_DB);
  // Enforce FK and use WAL for fewer locks
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;');
    db.run('PRAGMA journal_mode = WAL;');
  });
  return db;
}

function ensureSchema() {
  const db = openDb();
  db.serialize(() => {
    // USERS table (compatible with your schema)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        username            TEXT NOT NULL UNIQUE,
        email               TEXT,
        password            TEXT NOT NULL,
        passcode            TEXT,
        avatar              TEXT,
        expenses_added      INTEGER DEFAULT 0,
        reports_downloaded  INTEGER DEFAULT 0,
        total_minutes_spent INTEGER DEFAULT 0,
        login_count         INTEGER DEFAULT 0,
        last_login          TEXT,
        active              INTEGER DEFAULT 1,
        last_name           TEXT,
        first_name          TEXT
      )
    `);

    // ALERTS table (used by /set-alert, /get-alerts, /delete-alert)
    db.run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        username   TEXT NOT NULL,
        category   TEXT NOT NULL,
        subcategory TEXT,
        threshold  REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(username)`);

    // DISMISSED NOTIFICATIONS table (used by /dismiss-notification & /get-notifications)
    db.run(`
      CREATE TABLE IF NOT EXISTS dismissed_notifications (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        username  TEXT NOT NULL,
        message   TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_dismiss_user ON dismissed_notifications(username)`);

    // SCHEDULED ALERTS table (you already created inside endpoint, keep here too)
    db.run(`
      CREATE TABLE IF NOT EXISTS scheduled_alerts (
        username        TEXT PRIMARY KEY,
        weekly_enabled  INTEGER DEFAULT 0,
        weekly_day      TEXT DEFAULT 'Sunday',
        monthly_enabled INTEGER DEFAULT 0,
        monthly_day     INTEGER DEFAULT 1,
        yearly_enabled  INTEGER DEFAULT 0,
        yearly_month    TEXT DEFAULT 'January',
        yearly_day      INTEGER DEFAULT 1,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);
  });
  db.close();
}
ensureSchema();

// ---- Auth & profile ---------------------------------------------------------
app.post('/register', (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const passcode = Math.floor(1000 + Math.random() * 9000).toString();
  const db = openDb();

  const q = `
    INSERT INTO users (username, email, password, passcode, first_name, last_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(q, [username, email, password, passcode, firstName, lastName], function (err) {
    db.close();
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(500).json({ message: 'Error saving user' });
    }
    res.status(200).json({ message: 'User registered successfully', passcode, username });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = openDb();
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Server error' });
      }
      if (!row) {
        db.close();
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (row.active === 0) {
        db.close();
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      const now = new Date().toISOString();
      db.run(
        'UPDATE users SET last_login = ?, login_count = login_count + 1 WHERE username = ?',
        [now, username],
        function (err2) {
          db.close();
          if (err2) return res.status(500).json({ message: 'Update failed' });
          res.status(200).json({ message: 'Login successful', username });
        }
      );
    }
  );
});

app.post('/reactivate', (req, res) => {
  const { username, password, passcode } = req.body;
  const db = openDb();
  const q = 'SELECT * FROM users WHERE username = ? AND password = ? AND passcode = ?';
  db.get(q, [username, password, passcode], (err, row) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }
    if (!row) {
      db.close();
      return res.status(401).json({ message: 'Invalid credentials or passcode' });
    }
    if (row.active === 1) {
      db.close();
      return res.status(200).json({ message: 'Account already active' });
    }
    db.run('UPDATE users SET active = 1 WHERE username = ?', [username], function (err2) {
      db.close();
      if (err2) return res.status(500).json({ message: 'Reactivation failed' });
      res.json({ message: 'Account reactivated successfully' });
    });
  });
});

app.post('/reset-password', (req, res) => {
  const { username, passcode, newPassword } = req.body;
  const db = openDb();
  db.get(
    'SELECT * FROM users WHERE username = ? AND passcode = ?',
    [username, passcode],
    (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      if (!row) {
        db.close();
        return res.status(404).json({ message: 'User not found or passcode mismatch' });
      }
      db.run('UPDATE users SET password = ? WHERE username = ?', [newPassword, username], function (err2) {
        db.close();
        if (err2) return res.status(500).json({ message: 'Error updating password' });
        res.status(200).json({ message: 'Password reset successfully' });
      });
    }
  );
});

app.post('/verify-passcode', (req, res) => {
  const { username, passcode } = req.body;
  const db = openDb();
  db.get('SELECT 1 FROM users WHERE username = ? AND passcode = ?', [username, passcode], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ message: 'Database error' });
    if (row) return res.status(200).json({ message: 'Verification successful' });
    return res.status(404).json({ message: 'Invalid username or passcode' });
  });
});

app.post('/upload-avatar', (req, res) => {
  const { username, avatar } = req.body;
  const db = openDb();
  db.run('UPDATE users SET avatar = ? WHERE username = ?', [avatar, username], function (err) {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to save avatar' });
    return res.json({ message: 'Avatar saved' });
  });
});

app.get('/get-avatar', (req, res) => {
  const { username } = req.query;
  const db = openDb();
  db.get('SELECT avatar FROM users WHERE username = ?', [username], (err, row) => {
    db.close();
    if (err || !row) return res.status(404).json({ message: 'Not found' });
    return res.json({ avatar: row.avatar });
  });
});

// ---- Usage metrics ----------------------------------------------------------
app.post('/track-usage-time', (req, res) => {
  const { username, minutes } = req.body;
  const db = openDb();
  db.run(
    'UPDATE users SET total_minutes_spent = total_minutes_spent + ? WHERE username = ?',
    [Number(minutes) || 0, username],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ message: 'Failed to track time' });
      res.json({ message: 'Time tracked' });
    }
  );
});

app.get('/get-usage-summary', (req, res) => {
  const { username } = req.query;
  const db = openDb();
  const q = `
    SELECT last_login, login_count, total_minutes_spent, reports_downloaded, expenses_added
    FROM users WHERE username = ?`;
  db.get(q, [username], (err, row) => {
    db.close();
    if (err || !row) return res.status(404).json({ message: 'Not found' });
    res.json({
      last_login: row.last_login || '',
      login_count: row.login_count || 0,
      total_minutes_spent: row.total_minutes_spent || 0,
      reports_downloaded: row.reports_downloaded || 0,
      expenses_added: row.expenses_added || 0
    });
  });
});

app.post('/increment-report', (req, res) => {
  const { username } = req.body;
  const db = openDb();
  db.run('UPDATE users SET reports_downloaded = reports_downloaded + 1 WHERE username = ?', [username], function (err) {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to update report count' });
    res.json({ message: 'Report count updated' });
  });
});

app.post('/logout-all', (req, res) => {
  const { username } = req.body;
  console.log(`Simulated logout from all devices for ${username}`);
  res.json({ message: 'Logged out from all devices (simulated)' });
});

app.post('/deactivate', (req, res) => {
  const { username } = req.body;
  const db = openDb();
  db.run('UPDATE users SET active = 0 WHERE username = ?', [username], function (err) {
    db.close();
    if (err) return res.status(500).json({ message: 'Deactivation failed' });
    res.json({ message: 'Account deactivated (soft delete)' });
  });
});

// ---- Scheduled Alerts (create-or-update) ------------------------------------
app.post('/set-scheduled-alerts', (req, res) => {
  const {
    username,
    weekly_enabled,
    weekly_day,
    monthly_enabled,
    monthly_day,
    yearly_enabled,
    yearly_month,
    yearly_day
  } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Missing username' });
  }

  const db = openDb();
  db.get('SELECT 1 FROM users WHERE username = ?', [username], (err, u) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Failed to read user' });
    }
    if (!u) {
      db.close();
      return res.status(404).json({ message: 'User not found' });
    }

    db.get('SELECT * FROM scheduled_alerts WHERE username = ?', [username], (err2, row) => {
      if (err2) {
        db.close();
        return res.status(500).json({ message: 'Failed to query table' });
      }

      const params = [
        weekly_enabled ? 1 : 0, weekly_day || 'Sunday',
        monthly_enabled ? 1 : 0, monthly_day || 1,
        yearly_enabled ? 1 : 0, yearly_month || 'January', yearly_day || 1,
        username
      ];

      const query = row
        ? `UPDATE scheduled_alerts
             SET weekly_enabled=?, weekly_day=?,
                 monthly_enabled=?, monthly_day=?,
                 yearly_enabled=?, yearly_month=?, yearly_day=?
           WHERE username=?`
        : `INSERT INTO scheduled_alerts
             (weekly_enabled, weekly_day, monthly_enabled, monthly_day, yearly_enabled, yearly_month, yearly_day, username)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      db.run(query, params, function (err3) {
        db.close();
        if (err3) return res.status(500).json({ message: 'Failed to save settings' });
        res.status(200).json({ message: 'Scheduled alert preferences saved' });
      });
    });
  });
});

// ---- Scheduled Alerts (read) -----------------------------------------------
app.get('/get-scheduled-alerts', (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: 'Missing username' });

  const db = openDb();
  db.get('SELECT * FROM scheduled_alerts WHERE username = ?', [username], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to read settings' });

    // If no row yet, return sensible defaults (mirrors your component’s defaults)
    if (!row) {
      return res.json({
        weekly_enabled: 0,
        weekly_day: 'Sunday',
        monthly_enabled: 0,
        monthly_day: 1,
        yearly_enabled: 0,
        yearly_month: 'January',
        yearly_day: 1
      });
    }

    res.json({
      weekly_enabled: row.weekly_enabled,
      weekly_day: row.weekly_day,
      monthly_enabled: row.monthly_enabled,
      monthly_day: row.monthly_day,
      yearly_enabled: row.yearly_enabled,
      yearly_month: row.yearly_month,
      yearly_day: row.yearly_day
    });
  });
});


// ---- Budget Alerts CRUD -----------------------------------------------------
app.post('/set-alert', (req, res) => {
  const { username, category, subcategory, threshold } = req.body;
  if (!username || !category || threshold == null) {
    return res.status(400).json({ message: 'username, category, threshold are required' });
  }
  const db = openDb();
  const q = `INSERT INTO alerts (username, category, subcategory, threshold) VALUES (?, ?, ?, ?)`;
  db.run(q, [username, category, subcategory || 'NULL', Number(threshold)], function (err) {
    db.close();
    if (err) {
      console.error('Insert alert error:', err.message);
      return res.status(500).json({ message: 'Failed to save alert', error: err.message });
    }
    res.json({ message: 'Alert saved', id: this.lastID });
  });
});

app.get('/get-alerts', (req, res) => {
  const { username } = req.query;
  const db = openDb();
  db.all('SELECT * FROM alerts WHERE username = ?', [username], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to fetch alerts' });
    res.json(rows);
  });
});

app.post('/delete-alert', (req, res) => {
  const { id } = req.body;
  const db = openDb();
  db.run('DELETE FROM alerts WHERE id = ?', [id], function (err) {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to delete alert' });
    res.json({ message: 'Alert deleted' });
  });
});

// ---- Notifications (spend + scheduled) --------------------------------------
app.get('/get-notifications', (req, res) => {
  const { username } = req.query;
  const db = openDb();

  db.all('SELECT * FROM alerts WHERE username = ?', [username], (err, alerts) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Failed to fetch alerts' });
    }

    db.all('SELECT message FROM dismissed_notifications WHERE username = ?', [username], (err2, dismissed) => {
      if (err2) {
        db.close();
        return res.status(500).json({ message: 'Failed to fetch dismissed alerts' });
      }

      const dismissedMessages = new Set(dismissed.map(d => d.message));
      const totals = {};

      fs.createReadStream(EXPENSES_CSV)
        .pipe(csvParser())
        .on('data', (row) => {
          const category = row.Category?.trim();
          const subcategory = row.Subcategory?.trim() || 'NULL';
          const amount = parseFloat(row.Amount || 0);
          if (!category || Number.isNaN(amount)) return;
          const key = `${category}|||${subcategory}`;
          totals[key] = (totals[key] || 0) + amount;
        })
        .on('end', () => {
          const notifications = [];

          // Budget threshold notifications
          alerts.forEach(alert => {
            const key = `${alert.category}|||${alert.subcategory || 'NULL'}`;
            const spent = totals[key] || 0;
            const threshold = Number(alert.threshold) || 0;
            if (threshold <= 0) return;

            const percent = (spent / threshold) * 100;

            if (percent >= 80) {
              let severity = 'info';
              if (percent > 150) severity = 'critical';
              else if (percent >= 100) severity = 'warning';

              const diff = (spent - threshold).toFixed(2);
              const label = alert.subcategory
                ? `${alert.category} → ${alert.subcategory}`
                : alert.category;

              const message =
                percent >= 100
                  ? `⚠️ ${label} exceeded by $${diff}`
                  : `⚠️ ${label} is nearing its threshold (${Math.round(percent)}%)`;

              if (!dismissedMessages.has(message)) {
                notifications.push({ message, severity });
              }
            }
          });

          // Scheduled summaries (always try, but don't fail the whole call)
          const today = new Date();
          const currentWeekday = today.toLocaleDateString('en-US', { weekday: 'long' });
          const dom = today.getDate();
          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const monthName = monthNames[today.getMonth()];
          const lastDayOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

          const pushInfo = (msg) => {
            if (!dismissedMessages.has(msg)) {
              notifications.push({ message: msg, severity: 'info' });
            }
          };

          db.get('SELECT * FROM scheduled_alerts WHERE username = ?', [username], (err3, sched) => {
            // Even if sched read fails, still return spend notifications
            if (!err3 && sched) {
              const totalSpent = Object.values(totals).reduce((sum, val) => sum + val, 0);
              const topCategoryKey = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
              const topCategory = topCategoryKey?.split('|||')[0];

              // Weekly summary
              if (sched.weekly_enabled === 1 && sched.weekly_day === currentWeekday) {
                pushInfo(`🗓️ Weekly summary: $${totalSpent.toFixed(2)} spent. Top: ${topCategory || 'N/A'}.`);
              }

              // Monthly report (clamp chosen day to last day of month)
              if (sched.monthly_enabled === 1) {
                const targetDay = Math.min(Number(sched.monthly_day || 1), lastDayOfThisMonth);
                if (dom === targetDay) {
                  pushInfo(`📅 Monthly report for ${today.toISOString().slice(0, 7)}: total $${totalSpent.toFixed(2)}.`);
                }
              }

              // Yearly report (match month name + clamped day)
              if (sched.yearly_enabled === 1 && sched.yearly_month === monthName) {
                const targetDay = Math.min(Number(sched.yearly_day || 1), lastDayOfThisMonth);
                if (dom === targetDay) {
                  pushInfo(`📈 Yearly report for ${today.getFullYear()}: total $${totalSpent.toFixed(2)}.`);
                }
              }
            }

            db.close();
            return res.json(notifications);
          });
        })
        .on('error', errCsv => {
          console.error('CSV read error:', errCsv);
          db.close();
          res.status(500).json({ message: 'Failed to read expenses' });
        });
    });
  });
});

app.post('/dismiss-notification', (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) return res.status(400).json({ message: 'username and message are required' });
  const db = openDb();
  db.run('INSERT INTO dismissed_notifications (username, message) VALUES (?, ?)', [username, message], function (err) {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to dismiss notification' });
    res.json({ message: 'Notification dismissed' });
  });
});

// ---- Chatbot (top spending, month totals, alert NLP, Ollama fallback) -------
app.post('/chatbot', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // 1) Top spending
  if (/top spending/i.test(message)) {
    const totals = {};
    fs.createReadStream(EXPENSES_CSV)
      .pipe(csvParser())
      .on('data', (row) => {
        const cat = row.Category?.trim();
        const amt = parseFloat(row.Amount || 0);
        if (!cat || Number.isNaN(amt)) return;
        totals[cat] = (totals[cat] || 0) + amt;
      })
      .on('end', () => {
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const [topCategory, topAmount] = sorted[0];
          return res.json({ reply: `📊 Your top spending category is *${topCategory}* with a total of $${topAmount.toFixed(2)}.` });
        } else {
          return res.json({ reply: 'You have no expense data yet.' });
        }
      })
      .on('error', (err) => {
        console.error('CSV read error:', err);
        return res.status(500).json({ error: 'Failed to read expenses.' });
      });
    return;
  }

  // 2) Month parsing (YYYY-MM, "last month", or month name)
  const monthMatch = message.match(/(?:in\s+)?(\d{4})[-/](\d{2})|(?:(january|february|march|april|may|june|july|august|september|october|november|december))/i);
  const now = new Date();
  let targetMonth = null;

  if (/last month/i.test(message)) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    targetMonth = lastMonth.toISOString().slice(0, 7);
  } else if (monthMatch) {
    if (monthMatch[1] && monthMatch[2]) {
      targetMonth = `${monthMatch[1]}-${monthMatch[2]}`;
    } else if (monthMatch[3]) {
      const monthNames = {
        january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
        july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
      };
      const monthNum = monthNames[monthMatch[3].toLowerCase()];
      targetMonth = `${now.getFullYear()}-${monthNum}`;
    }
  }

  if (targetMonth) {
    let total = 0;
    fs.createReadStream(EXPENSES_CSV)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.Date?.startsWith(targetMonth)) {
          const amt = parseFloat(row.Amount || 0);
          if (!Number.isNaN(amt)) total += amt;
        }
      })
      .on('end', () => {
        res.json({ reply: `📅 Your total spending for ${targetMonth} is $${total.toFixed(2)}.` });
      })
      .on('error', (err) => {
        console.error('CSV read error:', err);
        res.status(500).json({ error: 'Failed to calculate monthly expenses.' });
      });
    return;
  }

  // 3) NLP: "set alert for Food, Restaurants over $200"
  const alertMatch = message.match(/set alert for ([a-z\s]+)(?:,\s*([a-z\s]+))?\s+over\s+\$?(\d+)/i);
  if (alertMatch) {
    const category = alertMatch[1].trim();
    const subcategory = alertMatch[2]?.trim() || 'NULL';
    const threshold = parseFloat(alertMatch[3]);

    const username = req.headers['username'] || req.headers['x-username'];
    if (!username) {
      return res.json({ reply: `⚠️ Please log in first to save alerts.` });
    }

    const db = openDb();
    const q = `INSERT INTO alerts (username, category, subcategory, threshold) VALUES (?, ?, ?, ?)`;
    db.run(q, [username, category, subcategory, threshold], function (err) {
      db.close();
      if (err) {
        console.error('Alert insert failed:', err.message);
        return res.json({ reply: `❌ Failed to set alert for ${category}.` });
      }
      return res.json({ reply: `✅ Alert set for ${category}${subcategory && subcategory !== 'NULL' ? ` → ${subcategory}` : ''} over $${threshold}.` });
    });
    return;
  }

  if (/help me set an alert|set alert/i.test(message)) {
    return res.json({
      reply: '💡 Example: *Set alert for Food & Dining, Restaurants over $200* or type *set alert* to set the alert by pressing buttons'
    });
  }

  // 4) Default → Ollama
  const ollamaReq = http.request(
    {
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    (ollamaRes) => {
      let data = '';
      ollamaRes.on('data', (chunk) => (data += chunk.toString()));
      ollamaRes.on('end', () => {
        try {
          const lines = data.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const json = JSON.parse(lastLine);
          res.json({ reply: json.response.trim() });
        } catch (err) {
          console.error('Parsing error:', err);
          res.status(500).json({ error: 'Failed to parse Ollama response.' });
        }
      });
    }
  );

  ollamaReq.on('error', (err) => {
    console.error('Ollama request error:', err);
    res.status(500).json({ error: 'Ollama server unreachable' });
  });

  const body = JSON.stringify({
    model: 'llama3',
    prompt: `You are ExpenseBot. Help the user reduce their expenses. Message: "${message}"`,
    stream: false
  });

  Readable.from([body]).pipe(ollamaReq);
});

// ---- Dismiss notification ----------------------------------------------------
app.post('/dismiss-notification', (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) return res.status(400).json({ message: 'username and message are required' });
  const db = openDb();
  db.run('INSERT INTO dismissed_notifications (username, message) VALUES (?, ?)', [username, message], function (err) {
    db.close();
    if (err) return res.status(500).json({ message: 'Failed to dismiss notification' });
    res.json({ message: 'Notification dismissed' });
  });
});

// ---- Server -----------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
