const axios = require('axios');
const { scrapeWebsite } = require('./websiteScraper');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeGoogleMaps(target, db) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY nije postavljen');

  const leads = [];
  const seenPlaceIds = new Set();
  let nextPageToken = null;
  let page = 0;

  do {
    const params = {
      query: `${target.industryQuery} ${target.city} Croatia`,
      key: apiKey,
      language: 'hr',
    };
    if (nextPageToken) {
      params.pagetoken = nextPageToken;
      await sleep(2000);
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      { params }
    );

    if (response.data.status === 'REQUEST_DENIED') {
      throw new Error('Google Maps API key nije valjan');
    }
    if (response.data.status === 'ZERO_RESULTS') {
      break;
    }

    const results = response.data.results || [];

    for (const place of results) {
      if (seenPlaceIds.has(place.place_id)) continue;
      seenPlaceIds.add(place.place_id);

      const existing = db.prepare('SELECT id FROM leads WHERE google_place_id = ?').get(place.place_id);
      if (existing) continue;

      const lead = {
        business_name: place.name,
        city: target.city,
        industry: target.industry,
        address: place.formatted_address || '',
        phone: '',
        email: '',
        website: place.website || '',
        has_website: !!place.website,
        website_quality: 0,
        is_mobile_friendly: false,
        has_ssl: false,
        google_rating: place.rating || 0,
        google_reviews: place.user_ratings_total || 0,
        google_place_id: place.place_id,
      };

      try {
        const detailsResp = await axios.get(
          'https://maps.googleapis.com/maps/api/place/details/json',
          {
            params: {
              place_id: place.place_id,
              fields: 'formatted_phone_number,website',
              key: apiKey,
            },
          }
        );
        const det = detailsResp.data.result || {};
        if (det.formatted_phone_number) lead.phone = det.formatted_phone_number;
        if (det.website && !lead.website) {
          lead.website = det.website;
          lead.has_website = true;
        }
      } catch (e) {
        // skip details
      }

      if (lead.website) {
        try {
          const siteInfo = await scrapeWebsite(lead.website);
          lead.is_mobile_friendly = siteInfo.isMobileFriendly;
          lead.has_ssl = siteInfo.hasSSL;
          lead.website_quality = siteInfo.quality;
          if (siteInfo.email) lead.email = siteInfo.email;
        } catch (e) {
          // skip
        }
      }

      leads.push(lead);
      await sleep(200);
    }

    nextPageToken = response.data.next_page_token;
    page++;
  } while (nextPageToken && page < 3 && leads.length < (target.expectedLeads || 100));

  return leads;
}

module.exports = { scrapeGoogleMaps };
