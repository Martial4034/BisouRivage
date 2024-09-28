/** @type {import('next-sitemap').IConfig} */

const config = {
    siteUrl: process.env.SITE_URL || 'https://bisourivage.fr', // Replace with your actual site URL
    generateRobotsTxt: true, // Generate a robots.txt file as well
    sitemapSize: 7000, // Maximum URLs per sitemap file
    generateIndexSitemap: true, // Generate index sitemap
    changefreq: 'daily', // How often the pages change
    priority: 0.8, // Default priority of each page
    exclude: ['/admin/*'], // Exclude certain paths
    robotsTxtOptions: {
      policies: [
        { userAgent: '*', allow: '/' }, // Allow all bots to access the site
        { userAgent: '*', disallow: '/admin/' }, // Disallow admin pages
      ],
    },
  };
  
  module.exports = config;
  