# 🧪 Security Testing Guide

Quick guide to test the newly implemented security features.

---

## 1️⃣ Test Rate Limiting

### **Test Auth Rate Limit (5 attempts per 15 minutes)**

**Windows PowerShell:**
```powershell
# Try 10 login attempts (should block after 5)
1..10 | ForEach-Object {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"test@test.com","password":"wrong"}' `
        -UseBasicParsing
    Write-Host "Attempt $_: Status $($response.StatusCode)"
}
```

**Expected Result:**
- Attempts 1-5: `401 Unauthorized` (invalid credentials)
- Attempts 6-10: `429 Too Many Requests` (rate limited)

**Error Message:**
```json
{
  "error": "Too many login attempts from this IP. Please try again in 15 minutes."
}
```

---

### **Test AI Rate Limit (50 requests per hour)**

```powershell
# Requires authentication token
$token = "your-jwt-token-here"

1..60 | ForEach-Object {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ai/chat" `
            -Method POST `
            -Headers @{"Authorization"="Bearer $token"} `
            -ContentType "application/json" `
            -Body '{"message":"test"}' `
            -UseBasicParsing
        Write-Host "Request $_: Status $($response.StatusCode)"
    } catch {
        Write-Host "Request $_: BLOCKED (429)"
    }
}
```

**Expected Result:**
- Requests 1-50: `200 OK`
- Requests 51-60: `429 Too Many Requests`

---

## 2️⃣ Test Security Headers

### **Check Headers with curl**

```bash
curl -I http://localhost:3000/api/health
```

**Expected Headers:**
```
HTTP/1.1 200 OK
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'; ...
```

### **Test CSP in Browser**

1. Open browser DevTools (F12)
2. Navigate to `http://localhost:3000`
3. Check Console for CSP violations
4. Should see no errors if properly configured

---

## 3️⃣ Test Secure Logging

### **Check Masked Data in Logs**

1. **Start server in production mode:**
```bash
cd server
set NODE_ENV=production
node index.js
```

2. **Attempt login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'
```

3. **Check server logs:**

**Expected Output (Production):**
```
🔐 LOGIN ATTEMPT: { email: 'te***@***', companyEmail: undefined, timestamp: '...' }
```

**Notice:**
- ✅ Email is masked: `te***@***`
- ✅ Password is not logged at all
- ✅ Sensitive data is redacted

4. **Compare with development mode:**
```bash
set NODE_ENV=development
node index.js
```

**Expected Output (Development):**
```
🔐 LOGIN ATTEMPT: { email: 'test@example.com', companyEmail: undefined, timestamp: '...' }
```

**Notice:**
- ✅ Full email shown in development
- ✅ Helps with debugging

---

## 4️⃣ Test HTTPS Enforcement (Production Only)

### **Prerequisites:**
- Deploy to production (Railway/Vercel)
- Or use ngrok for local testing

### **Test HTTP Redirect:**

```bash
# Should redirect to HTTPS
curl -I http://your-app.railway.app/api/health
```

**Expected Response:**
```
HTTP/1.1 301 Moved Permanently
Location: https://your-app.railway.app/api/health
```

---

## 5️⃣ Integration Tests

### **Test Full Login Flow with Rate Limiting**

```javascript
// test-rate-limit.js
const axios = require('axios');

async function testRateLimit() {
  const url = 'http://localhost:3000/api/auth/login';
  const data = { email: 'test@test.com', password: 'wrong' };

  console.log('Testing rate limit...\n');

  for (let i = 1; i <= 10; i++) {
    try {
      const response = await axios.post(url, data);
      console.log(`Attempt ${i}: ${response.status} - ${response.data.message}`);
    } catch (error) {
      if (error.response) {
        console.log(`Attempt ${i}: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`Attempt ${i}: Error - ${error.message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

testRateLimit();
```

**Run:**
```bash
node test-rate-limit.js
```

**Expected Output:**
```
Attempt 1: 401 - Invalid credentials
Attempt 2: 401 - Invalid credentials
Attempt 3: 401 - Invalid credentials
Attempt 4: 401 - Invalid credentials
Attempt 5: 401 - Invalid credentials
Attempt 6: 429 - Too many login attempts from this IP. Please try again in 15 minutes.
Attempt 7: 429 - Too many login attempts from this IP. Please try again in 15 minutes.
...
```

---

## 6️⃣ Browser Testing

### **Test CSP Violations**

1. Open browser DevTools (F12)
2. Navigate to your app
3. Try to execute inline script in console:
```javascript
eval('alert("XSS")')
```

**Expected:**
- ❌ Script blocked by CSP
- Console shows: `Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source`

### **Test Clickjacking Protection**

1. Create test HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Clickjacking Test</h1>
  <iframe src="http://localhost:3000"></iframe>
</body>
</html>
```

2. Open in browser

**Expected:**
- ❌ iframe blocked
- Console shows: `Refused to display 'http://localhost:3000' in a frame because it set 'X-Frame-Options' to 'SAMEORIGIN'`

---

## 7️⃣ Monitoring Rate Limits

### **Check Rate Limit Headers**

```bash
curl -I http://localhost:3000/api/health
```

**Look for:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1704477600
```

These headers tell you:
- **Limit**: Maximum requests allowed
- **Remaining**: Requests left in current window
- **Reset**: When the limit resets (Unix timestamp)

---

## 🚨 Troubleshooting

### **Rate Limit Not Working**

**Check:**
1. ✅ Server restarted after changes
2. ✅ `express-rate-limit` installed
3. ✅ Middleware loaded in correct order
4. ✅ Using same IP for all requests

**Debug:**
```javascript
// Add to rateLimiter.js
console.log('Rate limiter triggered for:', req.ip);
```

### **Security Headers Missing**

**Check:**
1. ✅ `helmet` installed
2. ✅ `app.use(helmet())` called before routes
3. ✅ No conflicting middleware

**Debug:**
```bash
curl -I http://localhost:3000/api/health | grep -i "x-"
```

### **Logs Still Showing Sensitive Data**

**Check:**
1. ✅ `NODE_ENV=production` set
2. ✅ Using `secureLogger` instead of `console.log`
3. ✅ Server restarted

**Debug:**
```javascript
console.log('NODE_ENV:', process.env.NODE_ENV);
```

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Rate limiting blocks after max attempts
- [ ] Security headers present in responses
- [ ] Sensitive data masked in production logs
- [ ] Full data visible in development logs
- [ ] HTTPS enforced in production
- [ ] CSP blocks inline scripts
- [ ] X-Frame-Options prevents clickjacking
- [ ] Rate limit headers present
- [ ] Error messages are user-friendly
- [ ] No breaking changes to existing functionality

---

## 📊 Expected Results Summary

| Test | Expected Behavior | Status |
|------|-------------------|--------|
| Auth rate limit | Block after 5 attempts | ✅ |
| AI rate limit | Block after 50 requests | ✅ |
| Security headers | 7+ headers present | ✅ |
| Log masking (prod) | Emails/IDs masked | ✅ |
| Log masking (dev) | Full data visible | ✅ |
| HTTPS redirect | HTTP → HTTPS | ✅ |
| CSP protection | Inline scripts blocked | ✅ |
| Clickjacking | iframes blocked | ✅ |

---

## 🎯 Next Steps

After successful testing:

1. ✅ Deploy to production
2. ✅ Monitor logs for rate limit warnings
3. ✅ Adjust limits based on real usage
4. ✅ Set up alerts for security events
5. ✅ Document any custom configurations

---

**Happy Testing! 🧪🔒**
