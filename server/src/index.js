const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// --- Middleware ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

// Register (Public - for initial setup)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
      },
    });

    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (await bcrypt.compare(password, user.passwordHash)) {
      const accessToken = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
      res.json({ accessToken });
    } else {
      res.status(403).json({ error: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if any user exists (to show register on first run)
app.get('/api/auth/setup-check', async (req, res) => {
  const count = await prisma.user.count();
  res.json({ hasUsers: count > 0 });
});

// --- Protected Routes ---

// Get all people
app.get('/api/people', authenticateToken, async (req, res) => {
  try {
    const people = await prisma.person.findMany();
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a person
app.post('/api/people', authenticateToken, async (req, res) => {
  try {
    const { name, email, birthdate } = req.body;
    const person = await prisma.person.create({
      data: {
        name,
        email,
        birthdate: new Date(birthdate),
      },
    });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a person
app.put('/api/people/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, birthdate } = req.body;
    const person = await prisma.person.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        birthdate: new Date(birthdate),
      },
    });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a person
app.delete('/api/people/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.person.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Person deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk insert people (for Excel import)
app.post('/api/people/bulk', authenticateToken, async (req, res) => {
  try {
    const { people } = req.body;

    if (!Array.isArray(people) || people.length === 0) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const created = await prisma.person.createMany({
      data: people.map(p => ({
        name: p.name,
        email: p.email,
        birthdate: new Date(p.birthdate),
      })),
      skipDuplicates: true,
    });

    res.json({ message: `${created.count} people imported successfully`, count: created.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Config
app.get('/api/config', authenticateToken, async (req, res) => {
  try {
    let config = await prisma.config.findFirst();
    if (!config) {
      config = await prisma.config.create({ data: {} });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Config
app.post('/api/config', authenticateToken, async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, emailTemplate } = req.body;
    let config = await prisma.config.findFirst();

    const data = {
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      emailTemplate
    };

    if (smtpPass) {
      data.smtpPass = smtpPass;
    }

    if (config) {
      config = await prisma.config.update({
        where: { id: config.id },
        data,
      });
    } else {
      config = await prisma.config.create({
        data: { ...data, smtpPass: smtpPass || '' },
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Email
app.post('/api/config/test-email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const config = await prisma.config.findFirst();

    if (!config || !config.smtpUser || !config.smtpPass) {
      return res.status(400).json({ error: 'SMTP not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    await transporter.sendMail({
      from: config.smtpUser,
      to: email,
      subject: 'Test Email - Birthday App',
      text: 'This is a test email from your Birthday App configuration.',
      html: '<p>This is a test email from your <strong>Birthday App</strong> configuration.</p>'
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Email Service & Scheduler ---

const sendBirthdayEmails = async () => {
  console.log('Checking for birthdays...');
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  try {
    const people = await prisma.person.findMany();
    const birthdays = people.filter(p => {
      const d = new Date(p.birthdate);
      return d.getUTCMonth() + 1 === month && d.getUTCDate() === day;
    });

    if (birthdays.length === 0) {
      console.log('No birthdays today.');
      return;
    }

    const config = await prisma.config.findFirst();
    if (!config || !config.smtpUser || !config.smtpPass) {
      console.log('SMTP not configured.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    for (const person of birthdays) {
      const message = config.emailTemplate.replace('{name}', person.name);

      await transporter.sendMail({
        from: config.smtpUser,
        to: person.email,
        subject: 'Happy Birthday!',
        text: message,
        html: `<p>${message}</p>`
      });
      console.log(`Email sent to ${person.name}`);
    }
  } catch (error) {
    console.error('Error sending emails:', error);
  }
};

cron.schedule('0 9 * * *', sendBirthdayEmails);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
