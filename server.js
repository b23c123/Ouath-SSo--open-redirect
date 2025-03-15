const express = require('express');
const app = express();

const DEFAULT_REDIRECT = "https://accounts.google.com/o/oauth2/auth";

app.get('/', (req, res) => {
    res.send(`
        <h1>Welcome to My Website</h1>
        <p>Click below to login:</p>
        <a href="/login?code=fake_auth_12345&state=xyz123&redirect=https://accounts.google.com/o/oauth2/auth" 
           style="font-size:20px; color:blue;">Login with Google</a>
    `);
});

app.get('/login', (req, res) => {
    const { redirect, code, state } = req.query;

    if (!redirect) {
        return res.status(400).send("❌ No redirect URL provided!");
    }

    console.log(`⚠️ Open Redirect: Redirecting user to ${redirect} with code and state`);

    res.redirect(`${redirect}?code=${code || 'fake_auth_00000'}&state=${state || 'default_state'}`);
});

// Use the PORT environment variable required by Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🟢 Server running on port ${PORT}`));
