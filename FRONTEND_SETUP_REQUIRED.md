# ⚠️ FRONTEND SETUP REQUIRED

## Issue
The application fails to start with error:
```
Unable to connect to the SPA development server at 'http://localhost:44447'
```

## Root Cause
The npm packages have NOT been installed in the `ClientApp` folder. The Vite development server cannot start without the node_modules directory.

## Solution

### Option 1: Quick Fix (Recommended)
Run this command from the **root directory** of the solution:

```bash
cd ClientApp
npm install
```

Then start the application again.

---

### Option 2: Let Visual Studio Install (Automatic)
If you're using Visual Studio:

1. **Clean the solution** - Build > Clean Solution
2. **Rebuild the solution** - Build > Rebuild Solution
3. Visual Studio will automatically run `npm install` during the build process

---

### Option 3: Command Line Build
From the root directory:

```bash
# Install frontend dependencies
cd ClientApp
npm install
cd ..

# Run the application
dotnet run
```

---

## Verification

After running `npm install`, you should see:
- A `ClientApp/node_modules` folder created
- The application starts successfully
- Vite dev server runs on `http://localhost:44448`
- Backend runs on `https://localhost:44447`

---

## Port Configuration Summary

The application uses the following ports:

| Service | Port | Protocol |
|---------|------|----------|
| **Frontend (Vite)** | 44448 | HTTP |
| **Backend (ASP.NET)** | 44447 | HTTPS |
| **Backend (ASP.NET)** | 32214 | HTTP |

---

## How It Works

1. When you start the application, ASP.NET tries to launch the Vite dev server
2. Vite is started via the command `npm run dev` (configured in .csproj)
3. Vite runs on port 44448 and proxies API requests to the backend on port 44447
4. The SPA proxy in ASP.NET forwards requests from 44447 to the Vite server on 44448

**If npm packages aren't installed, Vite can't start, and the SPA proxy connection fails.**

---

## Next Steps

1. **Install npm packages**: `cd ClientApp && npm install`
2. **Start the application**: Run from Visual Studio or `dotnet run`
3. **Access the app**: Navigate to `https://localhost:44447`
4. **Login**: Use default credentials from the database seed data

---

**Status:** This is a one-time setup. Once npm packages are installed, you won't need to do this again unless you delete the `node_modules` folder.
