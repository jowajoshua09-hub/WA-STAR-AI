const fs = require('fs');

let isRequestingCode = false;

const UI = `
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Star AI Pairing</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gradient-to-br from-green-500 to-emerald-700 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
    <div class="text-center mb-6"><h1 class="text-3xl font-bold text-gray-800">⭐ Star AI Bot</h1>
    <p class="text-gray-500 mt-2">Link your bot number in 10 seconds</p></div>
    <form method="POST" action="/pair" class="space-y-4"><div>
    <label class="block text-sm font-medium text-gray-700 mb-2">Bot Number with Country Code</label>
    <input name="number" type="text" placeholder="Ex: 14155552671" required
    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition"/>
    <p class="text-xs text-gray-400 mt-1">No + or spaces. Example: 919876543210</p></div>
    <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">Get Pairing Code</button></form>
    <div class="mt-6 pt-6 border-t border-gray-200"><a href="/reset" class="w-full block text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition">🔄 Reset & Logout</a></div>
    <p class="text-xs text-gray-400 text-center mt-6">WhatsApp > Settings > Linked Devices > Link with phone number</p></div></body></html>`;

const CODE_UI = (code) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Pairing Code</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gradient-to-br from-green-500 to-emerald-700 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">✅ Code Generated</h1>
    <div class="bg-gray-100 rounded-xl p-6 mb-4"><p class="text-sm text-gray-500">Your Pairing Code</p>
    <h2 class="text-4xl font-mono font-bold text-green-600 tracking-widest">${code}</h2></div>
    <p class="text-gray-600 mb-6">Open WhatsApp > Settings > Linked Devices > <b>Link with phone number</b> > Enter this code</p>
    <a href="/" class="text-green-600 font-semibold">← Get Another Code</a></div></body></html>`;

function setupPairRoutes(app, getSock) {
    app.get('/', (req, res) => res.send(UI));

    app.post('/pair', async (req, res) => {
        if(isRequestingCode) return res.send("Already generating a code, wait 10s");
        isRequestingCode = true;
        const sock = getSock();
        const number = req.body.number.replace(/[^0-9]/g, '');
        if(!sock) return res.send("Bot not ready yet. Refresh in 10s");
        try {
            const code = await sock.requestPairingCode(number);
            res.send(CODE_UI(code));
        } catch(e) {
            res.send(`<p style="color:red">Error: ${e.message}</p><a href="/">Back</a>`);
        }
        setTimeout(() => isRequestingCode = false, 10000);
    });

    app.get('/reset', async (req,res) => {
        if(fs.existsSync('./session')) fs.rmSync('./session', { recursive: true, force: true });
        res.send(`<h2>Logged out ✅</h2><p>Deploy again and come back to / to get new code</p>`);
    });
}

module.exports = { setupPairRoutes };