/**
 * Local admin GUI — reset any user's password by email.
 *
 * SECURITY:
 * - Binds to 127.0.0.1 only (not reachable from other machines).
 * - Requires ADMIN_PASSWORD_GUI_SECRET in server/.env — every request must send this secret.
 * - For production DBs, use only on trusted machines; rotate secrets after use.
 *
 * Usage (from the `server` directory):
 *   Set in .env:
 *     ADMIN_PASSWORD_GUI_SECRET=your-long-random-string
 *     ADMIN_PASSWORD_GUI_PORT=34567   (optional, default 34567)
 *   Then:
 *     node scripts/admin-password-gui.js
 *
 * Open http://127.0.0.1:34567 in your browser (or the port you set).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const PORT = parseInt(process.env.ADMIN_PASSWORD_GUI_PORT || '34567', 10);
const SECRET = process.env.ADMIN_PASSWORD_GUI_SECRET;

if (!SECRET || SECRET.length < 8) {
  console.error(
    '[admin-password-gui] Set ADMIN_PASSWORD_GUI_SECRET in .env (at least 8 characters).'
  );
  process.exit(1);
}

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function checkSecret(req) {
  const body = req.body || {};
  const header = req.headers['x-admin-secret'];
  const s = body.secret || header;
  return typeof s === 'string' && s === SECRET;
}

const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — reset password by email</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #6366f1;
      --error: #f87171;
      --ok: #4ade80;
    }
    * { box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: var(--card);
      border-radius: 12px;
      padding: 1.75rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.45);
    }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p.sub { color: var(--muted); font-size: 0.875rem; margin: 0 0 1.25rem; }
    label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin-bottom: 0.35rem; }
    input, select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #0f172a;
      color: var(--text);
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    input:focus, select:focus { outline: 2px solid var(--accent); border-color: transparent; }
    button {
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      background: var(--accent);
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { filter: brightness(1.08); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .msg { margin-top: 1rem; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; display: none; }
    .msg.ok { display: block; background: rgba(74,222,128,.15); color: var(--ok); }
    .msg.err { display: block; background: rgba(248,113,113,.15); color: var(--error); }
    .warn { font-size: 0.75rem; color: var(--muted); margin-top: 1rem; line-height: 1.4; }
    #userPick { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Reset user password</h1>
    <p class="sub">Local tool · same DB as <code>DATABASE_URL</code></p>

    <form id="form">
      <label for="secret">Admin secret</label>
      <input type="password" id="secret" name="secret" autocomplete="off" required placeholder="Matches ADMIN_PASSWORD_GUI_SECRET" />

      <label for="email">User email</label>
      <input type="email" id="email" name="email" required autocomplete="off" />

      <div id="userPick">
        <label for="userId">Account (email exists in multiple companies)</label>
        <select id="userId" name="userId"></select>
      </div>

      <label for="newPassword">New password</label>
      <input type="password" id="newPassword" name="newPassword" required minlength="6" autocomplete="new-password" />

      <label for="confirmPassword">Confirm password</label>
      <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" autocomplete="new-password" />

      <button type="submit" id="btn">Update password</button>
    </form>
    <div id="msg" class="msg"></div>
    <p class="warn">Emails are unique per company. If several accounts share the same email, pick the correct row.</p>
  </div>
  <script>
    const form = document.getElementById('form');
    const msg = document.getElementById('msg');
    const userPick = document.getElementById('userPick');
    const userIdSelect = document.getElementById('userId');
    const emailInput = document.getElementById('email');
    let lookupUsers = [];

    function showMessage(text, ok) {
      msg.textContent = text;
      msg.className = 'msg ' + (ok ? 'ok' : 'err');
    }

    async function lookup() {
      const secret = document.getElementById('secret').value;
      const email = emailInput.value.trim();
      if (!secret || !email) return;
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ email, secret })
      });
      const data = await res.json();
      if (!res.ok) {
        userPick.style.display = 'none';
        lookupUsers = [];
        return;
      }
      lookupUsers = data.users || [];
      if (lookupUsers.length > 1) {
        userIdSelect.innerHTML = lookupUsers.map(u =>
          '<option value="' + u.id + '">' + u.name + ' — company #' + u.companyId + ' (' + (u.companyName || 'n/a') + ') · ' + u.role + '</option>'
        ).join('');
        userPick.style.display = 'block';
      } else {
        userPick.style.display = 'none';
        userIdSelect.innerHTML = '';
      }
    }

    emailInput.addEventListener('blur', lookup);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.className = 'msg';
      const secret = document.getElementById('secret').value;
      const email = document.getElementById('email').value.trim();
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match.', false);
        return;
      }
      let userId = null;
      if (userPick.style.display === 'block' && userIdSelect.value) {
        userId = parseInt(userIdSelect.value, 10);
      }
      const btn = document.getElementById('btn');
      btn.disabled = true;
      try {
        const res = await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
          body: JSON.stringify({ email, newPassword, confirmPassword, secret, userId })
        });
        const data = await res.json();
        if (!res.ok) {
          showMessage(data.error || 'Request failed', false);
          return;
        }
        showMessage('Password updated for ' + data.email + ' (id ' + data.id + ').', true);
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } catch (err) {
        showMessage(err.message || 'Network error', false);
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.type('html').send(pageHtml);
});

app.post('/api/lookup', async (req, res) => {
  if (!checkSecret(req)) {
    return res.status(403).json({ error: 'Invalid or missing secret' });
  }
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const users = await prisma.user.findMany({
      where: {
        email: { equals: email, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: { select: { name: true } }
      },
      orderBy: { id: 'asc' }
    });
    const list = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      companyName: u.company?.name
    }));
    return res.json({ users: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/reset', async (req, res) => {
  if (!checkSecret(req)) {
    return res.status(403).json({ error: 'Invalid or missing secret' });
  }
  const emailRaw = (req.body.email || '').trim();
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;
  const userIdRaw = req.body.userId;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const matches = await prisma.user.findMany({
      where: {
        email: { equals: emailRaw, mode: 'insensitive' }
      },
      select: { id: true, email: true, name: true, role: true, companyId: true }
    });

    if (matches.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    let target;
    if (matches.length === 1) {
      target = matches[0];
    } else {
      const uid = userIdRaw != null ? parseInt(userIdRaw, 10) : NaN;
      if (!uid || Number.isNaN(uid)) {
        return res.status(400).json({
          error: 'Multiple accounts use this email. Run lookup and pass userId.',
          users: matches
        });
      }
      target = matches.find((u) => u.id === uid);
      if (!target) {
        return res.status(400).json({ error: 'userId does not match this email' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        accountLockedUntil: null
      },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log(
      `[admin-password-gui] Password reset for user id=${updated.id} email=${updated.email}`
    );

    return res.json({
      success: true,
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Database error' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[admin-password-gui] http://127.0.0.1:${PORT}`);
  console.log('[admin-password-gui] Press Ctrl+C to stop.');
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec(`start http://127.0.0.1:${PORT}`);
  }
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
