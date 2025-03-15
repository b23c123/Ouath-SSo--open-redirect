const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // For generating random passwords

const app = express();
app.use(express.urlencoded({ extended: true }));

// Function to generate a random password
function generateRandomPassword() {
    return crypto.randomBytes(8).toString('hex'); // Generates a 16-character password
}

// User data (password changes on every refresh)
let userData = {
    email: "victim@example.com",
    password: generateRandomPassword()
};

// ✅ Homepage with a randomly generated password that changes on refresh
app.get('/', (req, res) => {
    userData.password = generateRandomPassword(); // Update password on each request

    const redirectUrl = req.query.redirect || 'https://google.com'; // Default redirect URL

    res.send(`
        <h1>Welcome to My Website</h1>
        <p>Your Email: <strong>${userData.email}</strong></p>
        <p>Your Password: <strong>${userData.password}</strong></p>
        
        <h2>🔓 Vulnerable CSRF Form</h2>
        <form action="/change-password" method="POST">
            <input type="hidden" name="newPassword" value="hacked123">
            <button type="submit">Change Password (Vulnerable!)</button>
        </form>

        <h2>🔗 Open Redirect Link</h2>
        <p>Click the link below to be redirected:</p>
        <a href="/open-redirect?redirect=${encodeURIComponent(redirectUrl)}" 
           style="font-size:20px; color:blue;">
            🔄 Go to ${redirectUrl}
        </a>

        <br><br>

        <a href="/login?code=fake_auth_12345&state=xyz123&redirect=https://accounts.google.com/o/oauth2/auth"
           style="font-size:20px; color:red;">⚠️ Login with Open Redirect</a>
    `);
});

// 🚨 Open Redirect Vulnerability
app.get('/open-redirect', (req, res) => {
    const { redirect } = req.query;
    if (!redirect) return res.status(400).send("❌ No redirect URL provided!");
    console.log(`⚠️ Open Redirect triggered! Redirecting to: ${redirect}`);
    res.redirect(redirect);
});

// 🚨 Open Redirect in Login
app.get('/login', (req, res) => {
    const { redirect, code, state } = req.query;
    if (!redirect) return res.status(400).send("❌ No redirect URL provided!");
    console.log(`⚠️ Open Redirect: Redirecting user to ${redirect} with code and state`);
    res.redirect(`${redirect}?code=${code || 'fake_auth_00000'}&state=${state || 'default_state'}`);
});

// 🚨 Vulnerable Password Change (Without CSRF Token)
app.post('/change-password', (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).send("❌ New password required!");
    
    userData.password = newPassword; // Update user's password
    console.log(`⚠️ Password changed to: ${newPassword}`);
    res.send(`
        ✅ Password changed successfully! <br>
        Your new password: <strong>${newPassword}</strong>
    `);
});

// 🔗 New Route for Dynamic Redirect
app.get('/redirect', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("❌ No URL provided!");

    res.send(`
        <h2>🔗 Redirect Link</h2>
        <p>Click the link below to be redirected:</p>
        <a href="${url}" style="font-size:20px; color:blue;">Go to ${url}</a>
    `);
});

// 🚨 SSRF Vulnerability
app.get('/fetch-data', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("❌ URL parameter required!");

    try {
        const response = await axios.get(url);
        res.send(response.data);
    } catch (error) {
        res.status(500).send("❌ Error fetching data.");
    }
});

// 🚨 CSRF Attack Proof of Concept (PoC)
app.get('/csrf-attack', (req, res) => {
    res.send(`
        <html>
        <body>
            <h2>⚠️ CSRF Attack PoC</h2>
            <p>If the victim is logged in, their password will be changed!</p>
            <form action="http://localhost:4000/change-password" method="POST">
                <input type="hidden" name="newPassword" value="hacked123" />
                <input type="submit" value="Submit request" />
            </form>
            <script>
                history.pushState('', '', '/');
                document.forms[0].submit();
            </script>
        </body>
        </html>
    `);
});

// ✅ Start the server on port 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🟢 Server running on port ${PORT}`));
