const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// 測試 bcrypt
const testPassword = async () => {
  const password = 'myPassword123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('bcrypt test:', isMatch); // 應該打印 true
};

// 測試 jsonwebtoken
const testJWT = () => {
  const token = jwt.sign({ id: 123 }, 'your_jwt_secret', { expiresIn: 3600 });
  const decoded = jwt.verify(token, 'your_jwt_secret');
  console.log('jsonwebtoken test:', decoded); // 應該打印 { id: 123, iat: ..., exp: ... }
};

// 測試 express-validator
const testExpressValidator = () => {
  const req = {
    body: {
      username: 'user',
      password: 'password'
    }
  };

  const validations = [
    check('username').isLength({ min: 1 }).withMessage('Username is required'),
    check('password').isLength({ min: 1 }).withMessage('Password is required')
  ];

  const result = validationResult(req);
  if (!result.isEmpty()) {
    console.log('express-validator test:', result.array());
  } else {
    console.log('express-validator test: validation passed');
  }
};

// 運行測試
testPassword();
testJWT();
testExpressValidator();
