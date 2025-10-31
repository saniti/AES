# Quick Start Guide

Get the Alerte Equine Science application running in 5 minutes!

## Prerequisites

- Node.js installed (version 14+)
- Terminal/Command Prompt access
- Git installed

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/saniti/AES.git
cd AES
git checkout develop

# Install dependencies
npm install
```

## Step 2: Generate SSL Certificates (1 minute)

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-key.pem -out localhost-cert.pem -days 365
```

## Step 3: Start the Server (30 seconds)

```bash
npm start
```

You should see:

```
========================================
Alerte Equine Science
========================================
Server running on https://localhost:3000
Demo Mode: DISABLED
HTTPS: ENABLED
========================================
```

## Step 4: Access the Application (1 minute)

1. Open your browser to: **https://localhost:3000**

2. Accept the security warning:
   - Click **"Advanced"**
   - Click **"Proceed to localhost"** (or similar)

3. Click **"Login"** or **"Get Started"**

4. Sign in with your Azure credentials

5. You're in! 🎉

## Troubleshooting

### "Command not found: openssl"

**Windows**: Install [Git for Windows](https://git-scm.com/download/win) which includes OpenSSL

**Mac**: OpenSSL is pre-installed

**Linux**: `sudo apt-get install openssl` (Ubuntu/Debian) or `sudo yum install openssl` (CentOS/RHEL)

### "Port already in use"

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port
# Edit .env and change PORT=3000 to PORT=3001
```

### "OAuth authentication fails"

Try **Demo Mode** to test without OAuth:

1. Edit `.env`
2. Change `DEMO_MODE=false` to `DEMO_MODE=true`
3. Restart the server
4. You'll be automatically logged in

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [USER_GUIDE.md](USER_GUIDE.md) for usage instructions
- See [HTTPS_SETUP.md](HTTPS_SETUP.md) for HTTPS details
- Review [OAUTH_TROUBLESHOOTING.md](OAUTH_TROUBLESHOOTING.md) for OAuth issues

## Demo Mode (No OAuth Required)

Want to test without Azure authentication?

1. Edit `.env`:
   ```
   DEMO_MODE=true
   ```

2. Restart server:
   ```bash
   npm start
   ```

3. Visit `https://localhost:3000` and click Login

4. You'll be automatically logged in as "Demo User"

## Need Help?

- Check the [README.md](README.md) troubleshooting section
- Review the [USER_GUIDE.md](USER_GUIDE.md)
- Open an issue on [GitHub](https://github.com/saniti/AES)

---

**That's it!** You should now have the application running locally with HTTPS and OAuth authentication.
