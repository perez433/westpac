const isbot = require('isbot');
const ipRangeCheck = require('ip-range-check');
const { getClientIp } = require('request-ip');
const { botUAList } = require('../config/botUA');
const { botIPList, botIPRangeList, botIPCIDRRangeList, botIPWildcardRangeList } = require('../config/botIP');
const { botRefList } = require('../config//botRef');

function isBotUA(userAgent) {
	if (!userAgent) {
		userAgent = '';
	}

	if (isbot(userAgent)) {
		return true;
	}

	for (let i = 0; i < botUAList.length; i++) {
		if (userAgent.toLowerCase().indexOf(botUAList[i]) > '-1') {
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
		if (ipAddress.indexOf(botIPList[i]) > '-1') {
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
		if (referer.toLowerCase().indexOf(botRefList[i]) > '-1') {
			return true;
		}
	}

	return false;
}

module.exports = (req, res, next) => {
	const clientUA = req.headers['user-agent'] || req.get('user-agent');
	const clientIP = getClientIp(req);
	const clientRef = req.headers.referer || req.headers.origin;

	if (isBotUA(clientUA) || isBotIP(clientIP) || isBotRef(clientRef)) {
		return res.status(404).type('html').end(`<title>404 Not Found</title><div><h2>Not Found</h2><p>The requested URL ${req.url} was not found on this server.</p></div>`);
	}

	next();
};