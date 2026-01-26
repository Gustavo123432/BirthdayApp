const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
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
    const userRole = user.role || 'USER'; // Default to user if not set
    req.user = { ...user, role: userRole };
    next();
  });
};

const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

const checkCompany = async (req, res, next) => {
  const companyId = parseInt(req.headers['x-company-id']);
  if (!companyId) return res.status(400).json({ error: 'Company ID required' });

  // Check if user has access to this company
  // For admins/setup, we might skip this, but we'll assume strict checks for now.
  // We need to query the database to see if user is linked to company.
  // Note: req.user.id comes from authenticateToken.

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { companies: true }
    });

    if (!user) return res.sendStatus(403);

    const hasAccess = user.companies.some(c => c.id === companyId);
    if (!hasAccess) return res.status(403).json({ error: 'Access denied to this company' });

    req.companyId = companyId;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (await bcrypt.compare(password, user.passwordHash)) {
      const payload = {
        username: user.username,
        id: user.id,
        role: user.role
      };
      const accessToken = jwt.sign(payload, JWT_SECRET);
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
// --- Company Routes ---

// Get User's Companies
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { companies: true }
    });
    res.json(user.companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Company (Admin Only)
app.post('/api/companies', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const company = await prisma.company.create({
      data: {
        name,
        users: { connect: { id: req.user.id } } // Connect creator
      }
    });

    // Create default config for this company
    await prisma.config.create({
      data: {
        companyId: company.id
      }
    });

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export People (XLS)
app.get('/api/companies/:id/export/people', authenticateToken, checkCompany, async (req, res) => {
  // Note: checkCompany looks at header, but here we might want to use param matching.
  // Actually checkCompany uses header x-company-id. The URL param is redundant if we use header, 
  // but for a download link, it's easier to use a GET param or path and have the middleware check it.
  // Let's rely on the middleware using the Header for consistency in API calls, 
  // BUT for browser downloads, setting headers is hard.
  // So we will modify checkCompany to fallback to query param or route param if header is missing? 
  // Or just implement specific check here.

  const companyId = parseInt(req.params.id);
  // Verify access manually since browser download might not send header easily unless via blob.
  // We'll trust verifyToken + Manual Check here.

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { companies: true }
    });
    if (!user.companies.some(c => c.id === companyId)) return res.sendStatus(403);

    const people = await prisma.person.findMany({
      where: { companyId }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('People');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Data de Nascimento', key: 'birthdate', width: 20 },
    ];

    people.forEach(p => {
      worksheet.addRow({
        id: p.id,
        name: p.name,
        email: p.email,
        birthdate: p.birthdate.toISOString().split('T')[0]
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=people-${companyId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export Config (TXT)
app.get('/api/companies/:id/export/config', authenticateToken, async (req, res) => {
  const companyId = parseInt(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { companies: true }
    });
    if (!user.companies.some(c => c.id === companyId)) return res.sendStatus(403);

    const config = await prisma.config.findUnique({ where: { companyId } });

    let content = 'No configuration found.';
    if (config) {
      content = `SMTP Host: ${config.smtpHost}\n` +
        `SMTP Port: ${config.smtpPort}\n` +
        `SMTP User: ${config.smtpUser}\n` +
        `Template: \n${config.emailTemplate}`;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=config-${companyId}.txt`);
    res.send(content);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Note: We can add tagging routes here

// --- Tag Routes ---
app.get('/api/tags', authenticateToken, checkCompany, async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { companyId: req.companyId }
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tags', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await prisma.tag.create({
      data: { name, companyId: req.companyId }
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tags/:id', authenticateToken, checkCompany, async (req, res) => {
  try {
    // verify tag belongs to company
    const tag = await prisma.tag.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.companyId }
    });
    if (!tag) return res.sendStatus(404);

    await prisma.tag.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Template Routes ---
app.get('/api/templates', authenticateToken, checkCompany, async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { companyId: req.companyId },
      include: { tag: true }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { tagId, subject, body } = req.body;
    const data = {
      companyId: req.companyId,
      subject,
      body
    };
    if (tagId) data.tagId = parseInt(tagId);

    // Upsert logic: if exists for this tag/company, update it
    // Prisma upsert requires unique constraint. We added @@unique([companyId, tagId])
    // But tagId can be null, and some DBs struggle with unique index on nulls. 
    // Let's use simpler findFirst + update/create logic or try upsert if Prisma handles nulls well in unique (it does usually).
    // Actually, let's use explicit check.

    let template = await prisma.emailTemplate.findFirst({
      where: {
        companyId: req.companyId,
        tagId: tagId ? parseInt(tagId) : null
      }
    });

    if (template) {
      template = await prisma.emailTemplate.update({
        where: { id: template.id },
        data: { subject, body }
      });
    } else {
      template = await prisma.emailTemplate.create({ data });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all people
app.get('/api/people', authenticateToken, checkCompany, async (req, res) => {
  try {
    const people = await prisma.person.findMany({
      where: { companyId: req.companyId },
      include: { tags: true }
    });
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a person
app.post('/api/people', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { name, email, birthdate, role, tagIds } = req.body;

    let tagsConnect = [];
    if (Array.isArray(tagIds)) {
      tagsConnect = tagIds.map(id => ({ id: parseInt(id) }));
    }

    const person = await prisma.person.create({
      data: {
        name,
        email,
        birthdate: new Date(birthdate),
        role,
        companyId: req.companyId,
        tags: { connect: tagsConnect }
      },
      include: { tags: true }
    });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a person
app.put('/api/people/:id', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, birthdate, role, tagIds } = req.body;

    // Verify person belongs to company
    const existing = await prisma.person.findFirst({
      where: { id: parseInt(id), companyId: req.companyId }
    });
    if (!existing) return res.status(404).json({ error: 'Person not found' });

    const data = {
      name,
      email,
      birthdate: new Date(birthdate),
      role,
    };

    if (Array.isArray(tagIds)) {
      data.tags = {
        set: tagIds.map(id => ({ id: parseInt(id) }))
      };
    }

    const person = await prisma.person.update({
      where: { id: parseInt(id) },
      data,
      include: { tags: true }
    });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a person
app.delete('/api/people/:id', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { id } = req.params;
    // Verify person belongs to company
    const existing = await prisma.person.findFirst({
      where: { id: parseInt(id), companyId: req.companyId }
    });
    if (!existing) return res.status(404).json({ error: 'Person not found' });

    await prisma.person.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Person deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk insert people (for Excel import)
app.post('/api/people/bulk', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { people } = req.body;

    if (!Array.isArray(people) || people.length === 0) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Process using a transaction to ensure tags are handled correctly
    const results = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const p of people) {
        let tagConnect = [];

        // If explicit tagName is provided from Excel
        if (p.tagName) {
          // Find or create the tag for this company
          let tag = await tx.tag.findFirst({
            where: {
              companyId: req.companyId,
              name: p.tagName
            }
          });

          if (!tag) {
            tag = await tx.tag.create({
              data: {
                name: p.tagName,
                companyId: req.companyId
              }
            });
          }
          tagConnect.push({ id: tag.id });
        }

        // Create person and connect tag if exists
        await tx.person.create({
          data: {
            name: p.name,
            email: p.email,
            birthdate: new Date(p.birthdate),
            role: p.role,
            companyId: req.companyId,
            tags: {
              connect: tagConnect
            }
          }
        });
        count++;
      }
      return count;
    });

    res.json({ message: `${results} people imported successfully`, count: results });
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint violation (email)
      // For a better UX, we might want to skip duplicates or return specific error
      // But the requirement implies bulk import.
      // Let's rely on simple error for now or fallback to standard createMany if loop fails? 
      // Actually, transaction ensures all or nothing.
      return res.status(400).json({ error: 'Failed to import. Some emails may already exist.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get Config
app.get('/api/config', authenticateToken, checkCompany, async (req, res) => {
  try {
    let config = await prisma.config.findUnique({
      where: { companyId: req.companyId }
    });

    if (!config) {
      config = await prisma.config.create({ data: { companyId: req.companyId } });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Config
app.post('/api/config', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, emailTemplate } = req.body;
    let config = await prisma.config.findUnique({
      where: { companyId: req.companyId }
    });

    const data = {
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      emailTemplate,
      companyId: req.companyId
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
app.post('/api/config/test-email', authenticateToken, checkCompany, async (req, res) => {
  try {
    const { email, subject, body } = req.body;
    const config = await prisma.config.findUnique({
      where: { companyId: req.companyId }
    });

    if (!config || !config.smtpUser || !config.smtpPass) {
      return res.status(400).json({ error: 'SMTP not configured for this company' });
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

    // Use passed subject/body or fallback to config default
    const emailSubject = subject || 'Teste - Felicitações de Aniversário';
    let messageBody = body || config.emailTemplate;

    // Replace placeholders
    messageBody = messageBody.replace(/{name}/g, 'Test User');

    await transporter.sendMail({
      from: config.smtpUser,
      to: email,
      subject: emailSubject,
      html: messageBody, // Sending as HTML directly
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- User Management ---

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
        companies: { select: { id: true, name: true } }
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { username, password, companyIds } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build connect query
    let companiesConnect = [];
    if (Array.isArray(companyIds)) {
      companiesConnect = companyIds.map(id => ({ id: parseInt(id) }));
    }

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        companies: {
          connect: companiesConnect
        }
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        companies: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user companies
app.put('/api/users/:id/companies', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyIds } = req.body;

    if (!Array.isArray(companyIds)) return res.status(400).json({ error: 'Invalid companies list' });

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        companies: {
          set: companyIds.map(cid => ({ id: parseInt(cid) }))
        }
      },
      include: { companies: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user password
app.put('/api/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        passwordHash: hashedPassword,
      },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;

    if (parseInt(id) === requestingUserId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
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
    // 1. Get all companies
    const companies = await prisma.company.findMany({
      include: { config: true }
    });

    for (const company of companies) {
      if (!company.config || !company.config.smtpUser || !company.config.smtpPass) {
        console.log(`Skipping company ${company.name}: SMTP not configured.`);
        continue;
      }

      // 2. Get birthdays for this company
      const people = await prisma.person.findMany({
        where: { companyId: company.id },
        include: { tags: true }
      });

      const birthdays = people.filter(p => {
        const d = new Date(p.birthdate);
        return d.getUTCMonth() + 1 === month && d.getUTCDate() === day;
      });

      if (birthdays.length === 0) continue;

      // Fetch company templates
      const templates = await prisma.emailTemplate.findMany({
        where: { companyId: company.id }
      });

      // Helper to find template
      const getTemplate = (personTags) => {
        // Priority: Tag Match > Default (tagId: null)
        // If person has multiple tags, pick first matching template? Or highest priority?
        // Simple logic: Iterating tags.
        for (const t of personTags) {
          const match = templates.find(tpl => tpl.tagId === t.id);
          if (match) return match;
        }
        // Fallback to default template (tagId null)
        const def = templates.find(tpl => tpl.tagId === null);
        if (def) return def;

        // Fallback to Config.emailTemplate (Legacy)
        return {
          subject: 'Felicitações de Aniversário',
          body: config.emailTemplate
        };
      };

      const config = company.config;
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
        tls: { ciphers: 'SSLv3' }
      });

      for (const person of birthdays) {
        const template = getTemplate(person.tags);
        const messageBody = template.body.replace(/{name}/g, person.name);
        const subject = template.subject || 'Felicitações de Aniversário';

        await transporter.sendMail({
          from: config.smtpUser,
          to: person.email,
          subject: subject,
          text: messageBody.replace(/<[^>]*>/g, ''),
          html: messageBody.replace(/\n/g, '<br>')
        });
        console.log(`Email sent to ${person.name} (${company.name}) using template: ${template.tagId ? 'Tag' : 'Default'}`);
      }
    }

  } catch (error) {
    console.error('Error sending emails:', error);
  }
};

cron.schedule('0 8 * * *', sendBirthdayEmails);



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
