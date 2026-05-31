# Server Starting & Connection Issues

## Issues Encountered

### Issue 1: Vite Server Ports Not Binding / Process dying after timeout

**Problem**: When running `npm run dev` for the Vite client, the server would start but after the command timed out (120000ms), the process would die. Even when running with a longer timeout, accessing `http://localhost:5173` or `http://localhost:5174` resulted in "Unable to connect" errors.

**Symptoms**:
- Vite would start and show "ready in XXX ms" with Local: http://localhost:5173
- But netstat would show ports in TIME_WAIT state rather than LISTENING
- When navigating to localhost:5173 in Firefox, error: "Firefox can't connect to the server at localhost:5173"

**Root Cause**: When running in PowerShell with the default bash tool, background processes are killed when the shell command completes. The `&` (ampersand) operator for background execution is not supported in PowerShell 5.1.

**Resolution**:
1. Used `Start-Job` cmdlet to run server processes in background:
   ```powershell
   Start-Job -ScriptBlock { cd C:\Users\bit\OneDrive\Desktop\oaq-system\server; node index.js }
   Start-Job -ScriptBlock { cd C:\Users\bit\OneDrive\Desktop\oaq-system\client; npm run dev -- --host }
   ```
2. Waited 5 seconds for ports to bind using `Start-Sleep 5`
3. Verified with `netstat -ano | Select-String ":5001|:5173"`

---

### Issue 2: Ampersand `&` Not Supported in PowerShell

**Problem**: Using `&` to run commands in background resulted in:
```
The ampersand (&) character is not allowed. The & operator is reserved for future use
```

**Resolution**: Used PowerShell `Start-Job` cmdlet instead of `&` background operator.

---

### Issue 3: Port Already in Use (EADDRINUSE)

**Problem**: When starting the server, error:
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Resolution**:
```powershell
# Find and kill process using the port
taskkill /F /IM node.exe
# Or specifically kill by PID from netstat -ano | Select-String ":5001"
```

---

### Issue 4: Vite Default Port Conflicts

**Problem**: If port 5173 is in use, Vite automatically tries 5174. But the "Local" URL displayed might not match what the user expects.

**Resolution**: Use `--host` flag to expose on all interfaces:
```bash
npm run dev -- --host
```
This shows both Local and Network URLs.

---

## Quick Fix Commands

```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Start server in background
Start-Job -ScriptBlock { cd C:\Users\bit\OneDrive\Desktop\oaq-system\server; node index.js }

# Start client in background
Start-Job -ScriptBlock { cd C:\Users\bit\OneDrive\Desktop\oaq-system\client; npm run dev -- --host }

# Wait for startup
Start-Sleep 5

# Verify servers are running
netstat -ano | Select-String ":5001|:5173"
```