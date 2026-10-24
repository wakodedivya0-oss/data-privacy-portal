const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Helper function to find index.html in Public or _Public
function getPublicIndexPath() {
    const publicPath = path.join(__dirname, 'Public', 'index.html');
    const underscorePublicPath = path.join(__dirname, '_Public', 'index.html');
    if (fs.existsSync(publicPath)) return publicPath;
    if (fs.existsSync(underscorePublicPath)) return underscorePublicPath;
    return null;
}

const server = http.createServer((req, res) => {
    // 1. Serve HTML Frontend Page
    if (req.url === '/' || req.url === '/index.html') {
        const indexPath = getPublicIndexPath();
        if (!indexPath) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error: index.html not found!');
            return;
        }
        fs.readFile(indexPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading file');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    // 2. GET: Get all tips from database
    else if (req.url === '/api/data' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'database', 'data.json'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error loading data' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    }
    // 3. POST: Add a new tip
    else if (req.url === '/api/data' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newTip = JSON.parse(body);
                const dataFilePath = path.join(__dirname, 'database', 'data.json');
                const fileData = fs.readFileSync(dataFilePath, 'utf8');
                const tips = JSON.parse(fileData);

                newTip.id = tips.length > 0 ? tips[tips.length - 1].id + 1 : 1;
                tips.push(newTip);

                fs.writeFileSync(dataFilePath, JSON.stringify(tips, null, 2), 'utf8');

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Tip added successfully!' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid data' }));
            }
        });
    }
    // 4. PUT: Update an existing tip
    else if (req.url.startsWith('/api/data/') && req.method === 'PUT') {
        const id = parseInt(req.url.split('/')[3]);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const updatedData = JSON.parse(body);
                const dataFilePath = path.join(__dirname, 'database', 'data.json');
                const fileData = fs.readFileSync(dataFilePath, 'utf8');
                let tips = JSON.parse(fileData);

                tips = tips.map(tip => {
                    if (tip.id === id) {
                        return { ...tip, title: updatedData.title, tip: updatedData.tip };
                    }
                    return tip;
                });

                fs.writeFileSync(dataFilePath, JSON.stringify(tips, null, 2), 'utf8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Tip updated successfully!' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid data' }));
            }
        });
    }
    // 5. DELETE: Remove a tip by ID
    else if (req.url.startsWith('/api/data/') && req.method === 'DELETE') {
        const id = parseInt(req.url.split('/')[3]);
        const dataFilePath = path.join(__dirname, 'database', 'data.json');
        try {
            const fileData = fs.readFileSync(dataFilePath, 'utf8');
            let tips = JSON.parse(fileData);

            tips = tips.filter(tip => tip.id !== id);

            fs.writeFileSync(dataFilePath, JSON.stringify(tips, null, 2), 'utf8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Tip deleted successfully!' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Error deleting tip' }));
        }
    }
    // 6. 404 Not Found
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});