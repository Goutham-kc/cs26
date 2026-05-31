# Starting the OAQ System

## Prerequisites

- Node.js installed
- MongoDB running locally or connection string available
- Project dependencies installed (`npm run install:all` from root)

---

## Quick Start (Single Command)

From the project root directory (`C:\Users\bit\OneDrive\Desktop\oaq-system`):

```powershell
# Kill any existing node processes to clear ports
taskkill /F /IM node.exe 2>$null

# Start both servers using Start-Job (background execution)
Start-Job -ScriptBlock { cd C:\Users\bit\OneDrive\Desktop\oaq-system\server; node index.js }
Start-Job -ScriptBlock { cd C:\Users\bit\OneDrive\Desktop\oaq-system\client; npm run dev -- --host }

# Wait for servers to initialize
Start-Sleep 5

# Verify servers are running
netstat -ano | Select-String ":5001|:5173"
```

---

## Step by Step Process

### Step 1: Clear Existing Processes

If there are existing processes blocking ports 5001 or 5173, kill them:

```powershell
taskkill /F /IM node.exe
```

Verify ports are freed:
```powershell
netstat -ano | Select-String ":5001|:5173"
```
Should show no LISTENING entries.

### Step 2: Start the Server (Backend API)

```powershell
cd server
node index.js
```

Expected output:
```
[DB] MongoDB connected
[SERVER] running on port 5001
```

Leave this terminal open. The server runs on **http://localhost:5001**

### Step 3: Start the Client (Frontend)

Open a new terminal:

```powershell
cd client
npm run dev -- --host
```

Expected output:
```
VITE v5.4.21 ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.X.X:5173/  (your LAN IP)
➜  Network: http://172.26.X.X:5173/   (virtual adapter)
```

The client runs on **http://localhost:5173**

---

## Understanding the Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    http://localhost:5173                     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Vite Dev Server (Client)          Port 5173                │
│  React + React Router                                       │
└────────────────────────────┬────────────────────────────────┘
                             │ Proxy (Vite config)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Express Server (Backend)          Port 5001                │
│  API Routes + Socket.io                                   │
└────────────────────────────┬────────────────────────────────┘
                             │ MongoDB
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  MongoDB                          Port 27017 (default)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Can't connect to server at localhost:5173"

1. Check if Vite is actually running:
   ```powershell
   netstat -ano | Select-String ":5173"
   ```
   Should show `LISTENING` on 0.0.0.0:5173 or 127.0.0.1:5173

2. If not running, restart client:
   ```powershell
   cd client
   npm run dev -- --host
   ```

3. If port is in TIME_WAIT, wait a moment or kill the process using:
   ```powershell
   taskkill /F /PID <PID>
   ```

### "MongoDB connected" but API calls fail

Check if Express server is running:
```powershell
netstat -ano | Select-String ":5001"
```

Should show UDP or TCP listening on port 5001.

### Common Port Issues

| Port | Service | Fix |
|------|---------|-----|
| 5001 | Server API | `taskkill /F /IM node.exe` then restart |
| 5173 | Vite Client | `taskkill /F /IM node.exe` then restart |
| 27017 | MongoDB | Restart MongoDB service |

---

## Environment Variables

Ensure these are set in `server/.env` or environment:

```
MONGODB_URI=mongodb://localhost:27017/oaq
PORT=5001
JWT_SECRET=your_secret_here
```

---

## Accessing the Application

After both servers are running:

1. Open browser to **http://localhost:5173**
2. Login with credentials (or use seeded test accounts)
3. Navigate using the Topbar: OAQ, Threads, Tracker, SP Wallet, Admin

---

## For Development with Concurrent Start

From the project root, you can also use the `concurrently` package (already configured):

```powershell
npm run dev
```

This starts both server and client together using concurrently.

---

## Stopping the Servers

```powershell
taskkill /F /IM node.exe
```

Or individually find and kill the process by PID from `netstat -ano`.