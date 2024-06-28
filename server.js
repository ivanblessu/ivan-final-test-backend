const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('./User');
const Case = require('./Case'); // 確保引入 Case 模型
const auth = require('./middleware/auth');

const app = express();
const port = 5002;

const jwtSecret = 'your_jwt_secret'; // 定義密鑰

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/fastlegal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 註冊路由
app.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ username, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 登錄路由
app.post('/login', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: { id: user.id }
    };

    jwt.sign(
      payload,
      jwtSecret, // 使用密鑰簽名
      { expiresIn: "60d" }, // token過期時間
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
    
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 添加案例路由
app.post('/api/cases', auth, async (req, res) => {
  const { title, content } = req.body;
  try {
    const newCase = new Case({ title, content });
    await newCase.save();
    res.json(newCase);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 編輯案例路由
app.put('/api/cases/:id', auth, async (req, res) => {
  const { title, content } = req.body;
  try {
    const updatedCase = await Case.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
    res.json(updatedCase);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 刪除案例路由
app.delete('/api/cases/:id', auth, async (req, res) => {
  try {
    await Case.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 獲取所有案例
app.get('/api/cases', auth, async (req, res) => {
  try {
    const cases = await Case.find();
    res.json(cases);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 獲取單個案例
app.get('/api/cases/:id', auth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ msg: 'Case not found' });
    }
    res.json(caseItem);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

app.put('/user', auth, [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.username = username;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.json({ msg: 'User updated successfully' });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 定義路由來獲取所有用戶
app.get('/api/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // 不返回密码字段
    res.json(users);
  } catch (error) {
    res.status(500).send('Server error');
  }
});



// 獲取用戶數量路由
app.get('/api/users/count', auth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ count: userCount });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 刪除用戶路由
app.delete('/api/users/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send('Server error');
  }
});



app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

