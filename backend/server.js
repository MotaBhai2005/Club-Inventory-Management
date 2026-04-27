const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let db;

async function initDB() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cat TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      desc TEXT,
      cond TEXT
    );

    CREATE TABLE IF NOT EXISTS lendings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      club TEXT NOT NULL,
      theirMember TEXT NOT NULL,
      ourMember TEXT NOT NULL,
      lentOn TEXT NOT NULL,
      duration INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY(itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      club TEXT NOT NULL,
      theirMember TEXT NOT NULL,
      ourMember TEXT NOT NULL,
      lentOn TEXT NOT NULL,
      returnedOn TEXT NOT NULL,
      duration INTEGER NOT NULL,
      FOREIGN KEY(itemId) REFERENCES items(id)
    );
  `);
  console.log('Connected to SQLite database.');
  
  // Seed initial data if items table is empty
  const count = await db.get('SELECT COUNT(*) as count FROM items');
  if (count.count === 0) {
    console.log('Seeding initial data...');
    const items = [
      ['Arduino Uno R3', 'Electronics', 5, 'Microcontroller boards', 'Good'],
      ['Raspberry Pi 4 (4GB)', 'Electronics', 3, 'SBCs for projects', 'Good'],
      ['Servo Motor SG90', 'Electronics', 12, 'Mini servo motors', 'Good'],
      ['Breadboard (830 ties)', 'Accessories', 8, 'Standard breadboards', 'Good'],
      ['Jumper Wire Set', 'Cables & Connectors', 10, 'M-M, M-F, F-F sets', 'Good'],
      ['Soldering Iron Station', 'Tools', 2, 'Hakko FX-888D', 'Good'],
      ['Ultrasonic Sensor HC-SR04', 'Sensors', 15, 'Distance sensors', 'Good'],
      ['Motor Driver L298N', 'Electronics', 6, 'Dual H-bridge drivers', 'Fair']
    ];
    const stmt = await db.prepare('INSERT INTO items (name, cat, qty, desc, cond) VALUES (?, ?, ?, ?, ?)');
    for (const item of items) {
      await stmt.run(item);
    }
    await stmt.finalize();

    await db.run('INSERT INTO lendings (itemId, qty, club, theirMember, ourMember, lentOn, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [1, 2, 'IEEE Student Branch', 'Ananya Sharma', 'Rajan Patel', '2025-04-10', 14, 'For their robotics project']);
    await db.run('INSERT INTO lendings (itemId, qty, club, theirMember, ourMember, lentOn, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [4, 3, 'CSE Department Lab', 'Prof. Kumar', 'Sneha Das', '2025-04-15', 7, 'Practical lab use']);

    await db.run('INSERT INTO history (itemId, qty, club, theirMember, ourMember, lentOn, returnedOn, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [7, 5, 'Mechanical Club', 'Rohan Verma', 'Priya Nair', '2025-03-20', '2025-03-27', 7]);
    await db.run('INSERT INTO history (itemId, qty, club, theirMember, ourMember, lentOn, returnedOn, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [5, 2, 'Electronics Society', 'Kiran Rao', 'Amit Singh', '2025-03-01', '2025-03-08', 7]);
  }
}

initDB().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Helper to get lent quantity
async function getLentQty(itemId) {
  const row = await db.get('SELECT SUM(qty) as total FROM lendings WHERE itemId = ?', [itemId]);
  return row.total || 0;
}

// API Endpoints

// GET all active inventory with computed availability
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await db.all('SELECT * FROM items');
    for (let item of items) {
      const lentQty = await getLentQty(item.id);
      item.availQty = item.qty - lentQty;
      item.lentQty = lentQty;
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new item
app.post('/api/inventory', async (req, res) => {
  const { name, cat, qty, desc, cond } = req.body;
  if (!name || !cat) return res.status(400).json({ error: 'Name and Category are required' });
  
  try {
    const result = await db.run(
      'INSERT INTO items (name, cat, qty, desc, cond) VALUES (?, ?, ?, ?, ?)',
      [name, cat, qty || 1, desc || '', cond || 'Good']
    );
    res.json({ id: result.lastID, name, cat, qty, desc, cond });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit item
app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { name, cat, qty, desc, cond } = req.body;
  try {
    await db.run(
      'UPDATE items SET name = ?, cat = ?, qty = ?, desc = ?, cond = ? WHERE id = ?',
      [name, cat, qty, desc, cond, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const lent = await getLentQty(id);
    if (lent > 0) return res.status(400).json({ error: 'Cannot delete item currently lent out' });
    
    await db.run('DELETE FROM items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all lendings with item joining
app.get('/api/lendings', async (req, res) => {
  try {
    const lendings = await db.all(`
      SELECT l.*, i.name as itemName 
      FROM lendings l 
      JOIN items i ON l.itemId = i.id
    `);
    res.json(lendings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new lending
app.post('/api/lendings', async (req, res) => {
  const { itemId, qty, club, theirMember, ourMember, lentOn, duration, notes } = req.body;
  try {
    const item = await db.get('SELECT qty FROM items WHERE id = ?', [itemId]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    const currentlyLent = await getLentQty(itemId);
    if (item.qty - currentlyLent < qty) {
      return res.status(400).json({ error: 'Not enough availability' });
    }

    const result = await db.run(
      'INSERT INTO lendings (itemId, qty, club, theirMember, ourMember, lentOn, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [itemId, qty, club, theirMember, ourMember, lentOn, duration, notes]
    );
    res.json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark as returned
app.post('/api/lendings/:id/return', async (req, res) => {
  const { id } = req.params;
  try {
    const lending = await db.get('SELECT * FROM lendings WHERE id = ?', [id]);
    if (!lending) return res.status(404).json({ error: 'Lending record not found' });
    
    const returnedOn = new Date().toISOString().split('T')[0];
    
    // Insert into history
    await db.run(
      'INSERT INTO history (itemId, qty, club, theirMember, ourMember, lentOn, returnedOn, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [lending.itemId, lending.qty, lending.club, lending.theirMember, lending.ourMember, lending.lentOn, returnedOn, lending.duration]
    );

    // Delete from lendings
    await db.run('DELETE FROM lendings WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET history
app.get('/api/history', async (req, res) => {
  try {
    const historyData = await db.all(`
      SELECT h.*, i.name as itemName 
      FROM history h 
      JOIN items i ON h.itemId = i.id
      ORDER BY id DESC
    `);
    res.json(historyData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const items = await db.all('SELECT * FROM items');
    const lendings = await db.all('SELECT * FROM lendings');
    
    const uniqueItems = items.length;
    const totalUnits = items.reduce((sum, item) => sum + item.qty, 0);
    const activeLendings = lendings.length;
    
    let overdue = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (const l of lendings) {
      const retDate = new Date(l.lentOn + 'T00:00:00');
      retDate.setDate(retDate.getDate() + l.duration);
      if (retDate < today) {
        overdue++;
      }
    }

    res.json({ uniqueItems, totalUnits, activeLendings, overdue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
