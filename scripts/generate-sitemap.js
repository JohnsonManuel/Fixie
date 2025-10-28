#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for Fixie
 * Run this script to automatically generate sitemap.xml
 * Usage: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://fixiechat.ai';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Define all pages with their properties
const pages = [
  {
    url: '/',
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/servicenow-alternative',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/enterprise-itsm',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/servicenow-migration',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/fortune-500-itsm',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/#features',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/#how-it-works',
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/#integrations',
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/#pricing',
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/demo',
    changefreq: 'monthly',
    priority: '0.6',
    lastmod: new Date().toISOString().split('T')[0]
  }
];

// Generate XML sitemap
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  pages.forEach(page => {
    xml += `  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;

    if (page.url === '/') {
      xml += `
    <image:image>
      <image:loc>${DOMAIN}/Fixie Product Flow.png</image:loc>
      <image:title>Fixie AI-Powered IT Support Platform</image:title>
      <image:caption>Enterprise-grade AI IT Support dashboard and workflow</image:caption>
    </image:image>`;
    }

    xml += `
  </url>
`;
  });

  xml += `</urlset>`;
  return xml;
}

// Write sitemap to file
function writeSitemap() {
  try {
    const sitemapXML = generateSitemap();
    fs.writeFileSync(OUTPUT_PATH, sitemapXML, 'utf8');
    console.log('✅ Sitemap generated successfully');
    console.log('📊 Total pages:', pages.length);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  writeSitemap();
}