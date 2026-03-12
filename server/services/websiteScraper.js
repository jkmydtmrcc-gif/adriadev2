const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWebsite(url) {
  const result = {
    isMobileFriendly: false,
    hasSSL: false,
    quality: 5,
    email: '',
  };

  try {
    result.hasSSL = url.startsWith('https://');

    const response = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
      maxRedirects: 3,
    });

    const $ = cheerio.load(response.data);

    const viewport = $('meta[name="viewport"]').attr('content');
    result.isMobileFriendly = !!viewport && viewport.includes('width=device-width');

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyText = response.data;
    const emails = bodyText.match(emailRegex) || [];
    const validEmail = emails.find(
      (e) =>
        !e.includes('example') &&
        !e.includes('placeholder') &&
        !e.includes('sentry') &&
        !e.includes('schema') &&
        !e.includes('@2x') &&
        !e.includes('.png') &&
        !e.includes('.jpg')
    );
    if (validEmail) result.email = validEmail;

    let q = 5;
    if (!result.isMobileFriendly) q -= 2;
    if (!result.hasSSL) q -= 1;
    const hasContactPage = $('a[href*="kontakt"], a[href*="contact"]').length > 0;
    if (hasContactPage) q += 1;
    const hasNav = $('nav, header').length > 0;
    if (!hasNav) q -= 1;
    result.quality = Math.max(1, Math.min(10, q));
  } catch (e) {
    result.quality = 2;
  }

  return result;
}

module.exports = { scrapeWebsite };
