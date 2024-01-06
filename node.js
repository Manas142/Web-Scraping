const axios = require("axios");
const cheerio = require("cheerio");
const url = require("url");

// Function to make HTTP request
async function fetchData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching data from ${url}: ${error.message}`);
  }
}

// Function to extract meta description from the webpage
function extractMetaDescription(html) {
  const $ = cheerio.load(html);
  const metaDescription = $('meta[name="description"]').attr("content");
  console.log("Meta Description:", metaDescription);
}

// Function to extract heading tags from the webpage
function extractHeadingTags(html) {
  const $ = cheerio.load(html);
  const headingTags = [];
  $("h1, h2, h3, h4, h5, h6").each((index, element) => {
    headingTags.push($(element).text());
  });
  console.log("Heading Tags:", headingTags);
}

// Function to extract internal and external links from the webpage
function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const internalLinks = [];
  const externalLinks = [];

  $("a").each((index, element) => {
    const href = $(element).attr("href");
    if (href) {
      const absoluteUrl = url.resolve(baseUrl, href);
      if (absoluteUrl.startsWith(baseUrl)) {
        internalLinks.push(absoluteUrl);
      } else {
        externalLinks.push(absoluteUrl);
      }
    }
  });

  console.log("Internal Links:", internalLinks);
  console.log("External Links:", externalLinks);
}

// Function to identify broken links on the webpage
async function identifyBrokenLinks(html) {
  const $ = cheerio.load(html);
  const allLinks = $("a");

  for (const element of allLinks) {
    const href = $(element).attr("href");
    try {
      await axios.head(href);
      console.log("Link is functional:", href);
    } catch (error) {
      console.log("Broken Link:", href);
    }
  }
}

// Function to retrieve image URLs from the webpage
function extractImageURLs(html) {
  const $ = cheerio.load(html);
  const imageUrls = [];

  $("img").each((index, element) => {
    const imageUrl = $(element).attr("src");
    imageUrls.push(imageUrl);
  });

  console.log("Image URLs:", imageUrls);
}

// Example usage
async function main() {
  const targetUrl = "https://stldigital.tech/";
  const html = await fetchData(targetUrl);

  extractMetaDescription(html);
  extractHeadingTags(html);
  const baseUrl = "https://stldigital.tech/";
  extractLinks(html, baseUrl);
  await identifyBrokenLinks(html);
  extractImageURLs(html);
}

main(); // Calling the main function
