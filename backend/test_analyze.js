const fs = require('fs');

async function test() {
    console.log("1. Logging in...");
    const loginRes = await fetch('http://localhost:8000/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9876543210', password: 'test123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) {
        console.error("Login failed:", loginData);
        return;
    }
    console.log("Token:", loginData.token.substring(0, 20) + "...");

    console.log("2. Creating dummy image...");
    const imgBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9]);
    fs.writeFileSync('test_img.jpg', imgBuffer);

    console.log("3. Sending to /api/analyze...");
    const formData = new FormData();
    formData.append('image', new Blob([imgBuffer], { type: 'image/jpeg' }), 'test_img.jpg');

    const analyzeRes = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${loginData.token}`
        },
        body: formData
    });

    console.log("Status:", analyzeRes.status);
    const data = await analyzeRes.json();
    console.log("Response:", data);
}

test().catch(console.error);
