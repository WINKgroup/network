import express from 'express';
import Network from '.';
import http from 'http';
import axios from 'axios';

const app = express();
app.use('/network', Network.getRouter());
const server = http.createServer(app);
server.listen('8080', () => {
    console.info('web service started');
});

// waiting for web service start
setTimeout(async () => {
    try {
        const response = await axios.get('http://127.0.0.1:8080/network/info');
        console.log(response.data);
        process.exit();
    } catch (e) {
        console.error('test failed', e);
    }
}, 2000);
