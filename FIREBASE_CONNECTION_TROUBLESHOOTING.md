# Firebase Connection Error - Troubleshooting Guide

## Error Details
```
Error: 14 UNAVAILABLE: No connection established. 
Last error: Error: connect ENETUNREACH 142.250.186.234:443
```

## What This Means
- **ENETUNREACH**: Network is unreachable - your computer cannot connect to Firebase servers (Google Cloud)
- **IP 142.250.186.234:443**: This is a Google server IP address on port 443 (HTTPS)

## Possible Causes & Solutions

### 1. Internet Connection Issues
**Check:**
- Is your internet connection working?
- Can you access other websites like google.com?

**Solution:**
- Restart your router/modem
- Check if other devices can connect to the internet
- Try switching between WiFi and mobile hotspot

### 2. Firewall or Antivirus Blocking
**Check:**
- Is Windows Firewall or antivirus software blocking Node.js or the connection?

**Solution:**
```powershell
# Run as Administrator - Allow Node.js through Windows Firewall
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```

### 3. VPN or Proxy Issues
**Check:**
- Are you using a VPN that might be blocking Google services?
- Is there a corporate proxy?

**Solution:**
- Temporarily disable VPN
- Configure proxy settings if needed

### 4. DNS Issues
**Check:**
- Can your computer resolve Google domains?

**Solution:**
```powershell
# Test DNS resolution
nslookup firestore.googleapis.com

# If it fails, try changing DNS to Google DNS
# Go to Network Settings > Change Adapter Options > 
# Right-click your network > Properties > IPv4 > 
# Use these DNS servers:
# Preferred: 8.8.8.8
# Alternate: 8.8.4.4
```

### 5. Regional Restrictions
**Check:**
- Are you in a region where Google services might be restricted?

**Solution:**
- Use a VPN to connect through a different region
- Check Firebase service status: https://status.firebase.google.com/

### 6. Firebase Emulator (Development Workaround)
If you can't connect to Firebase, use the Firebase Emulator for local development:

```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

Then update your Firebase config to use emulators in development.

## Quick Diagnostic Steps

1. **Test Google connectivity:**
   ```powershell
   ping 8.8.8.8
   ping google.com
   ```

2. **Test Firebase connectivity:**
   ```powershell
   curl https://firestore.googleapis.com
   ```

3. **Check if port 443 is blocked:**
   ```powershell
   Test-NetConnection -ComputerName firestore.googleapis.com -Port 443
   ```

4. **Restart the dev server:**
   ```powershell
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Temporary Workaround

If you need to continue development while troubleshooting, you can:

1. **Use mock data** - Comment out Firebase calls and use local state
2. **Use Firebase Emulator** - Run Firebase locally
3. **Check your network** - Try from a different network (mobile hotspot)

## Most Likely Solution

Based on the error, the most common causes are:
1. ✅ **Firewall blocking** - Add Node.js exception
2. ✅ **VPN interference** - Disable temporarily
3. ✅ **DNS issues** - Switch to Google DNS (8.8.8.8)

Try these three solutions first!
