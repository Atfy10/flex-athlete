import express from 'express';
const app = express();
const port = 8081;

app.use(express.json());

app.post('/auth/register', (req, res) => {
  const { userName, email, password, phoneNumber, emailConfirmed } = req.body;
  const errors = {};
  if (!userName) errors.userName = ['Full name is required'];
  if (!email) errors.email = ['Email is required'];
  if (!password) errors.password = ['Password is required'];

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Simulate creating user
  const created = {
    id: Math.floor(Math.random() * 100000),
    userName,
    email,
    phoneNumber: phoneNumber || '',
    emailConfirmed: typeof emailConfirmed === 'boolean' ? emailConfirmed : true,
  };

  return res.status(201).json({ success: true, user: created });
});

app.listen(port, () => {
  console.log(`Mock backend listening at http://localhost:${port}`);
});
