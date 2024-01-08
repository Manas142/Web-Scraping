const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Parse JSON in the request body
app.use(bodyParser.json());

// Define a route for handling web scraping requests
app.post('/scrape', async (req, res) => {
  const targetUrl = req.body.url; 

  try {
    // Fetch HTML content from the target URL
    const html = await fetchData(targetUrl);

    // Extract meta description, heading tags, links, broken links, and image URLs
    const metaDescription = extractMetaDescription(html);
    const headingTags = extractHeadingTags(html);
    const baseUrl = targetUrl;
    const { internalLinks, externalLinks } = extractLinks(html, baseUrl);
    const brokenLinks = await identifyBrokenLinks(internalLinks.concat(externalLinks));
    const imageUrls = extractImageURLs(html);

    // Respond with the extracted data in JSON format
    res.json({
      metaDescription,
      headingTags,
      internalLinks,
      externalLinks,
      brokenLinks,
      imageUrls,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Function to fetch HTML content from a given URL
async function fetchData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching data from ${url}: ${error.message}`);
  }
}

// Function to extract meta description from HTML
function extractMetaDescription(html) {
  const $ = cheerio.load(html);
  return $('meta[name="description"]').attr('content');
}

// Function to extract heading tags from HTML
function extractHeadingTags(html) {
  const $ = cheerio.load(html);
  const headingTags = [];
  $('h1, h2, h3, h4, h5, h6').each((index, element) => {
    headingTags.push($(element).text());
  });
  return headingTags;
}

// Function to extract internal and external links from HTML
function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const internalLinks = [];
  const externalLinks = [];

  $('a').each((index, element) => {
    const href = $(element).attr('href');
    if (href) {
      const absoluteUrl = url.resolve(baseUrl, href);
      if (absoluteUrl.startsWith(baseUrl)) {
        internalLinks.push(absoluteUrl);
      } else {
        externalLinks.push(absoluteUrl);
      }
    }
  });

  return { internalLinks, externalLinks };
}

// Function to identify broken links
async function identifyBrokenLinks(links) {
  const brokenLinks = [];

  for (const link of links) {
    try {
      // Attempt to make a HEAD request to each link
      await axios.head(link);
    } catch (error) {
      // If an error occurs, the link is considered broken
      brokenLinks.push(link);
    }
  }

  return brokenLinks;
}

// Function to extract image URLs from HTML
function extractImageURLs(html) {
  const $ = cheerio.load(html);
  const imageUrls = [];

  $('img').each((index, element) => {
    const imageUrl = $(element).attr('src');
    imageUrls.push(imageUrl);
  });

  return imageUrls;
}

// Start the Express server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
