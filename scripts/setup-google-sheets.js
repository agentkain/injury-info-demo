#!/usr/bin/env node

/**
 * Google Sheets Setup Script for Injury Info MCP Server
 * 
 * This script helps you set up Google Sheets integration quickly
 * by creating sample sheets and configuring the environment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Google Sheets Integration Setup for Injury Info MCP Server\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env file...');
  const envTemplate = `# HubSpot Configuration
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token-here
HUBSPOT_API_KEY=your-hubspot-api-key-here
HUBSPOT_PORTAL_ID=your-hubspot-portal-id-here

# Google Sheets Configuration
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here

# MCP Server Configuration
NODE_ENV=development
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file with template configuration');
} else {
  console.log('✅ .env file already exists');
}

// Check if package.json exists and has required dependencies
const packagePath = path.join(__dirname, '..', 'package.json');
const packageExists = fs.existsSync(packagePath);

if (!packageExists) {
  console.log('📦 Creating package.json...');
  const packageJson = {
    "name": "injury-info-mcp-server",
    "version": "1.0.0",
    "type": "module",
    "description": "MCP Server for Injury Info website with HubSpot and Google Sheets integration",
    "main": "hubspot-injury-info-server.js",
    "scripts": {
      "start": "node hubspot-injury-info-server.js",
      "setup": "node scripts/setup-google-sheets.js",
      "sync": "node scripts/google-sheets-connector.js",
      "test": "node scripts/simple-data-loader.js"
    },
    "dependencies": {
      "@modelcontextprotocol/sdk": "^0.4.0",
      "node-fetch": "^3.3.2",
      "dotenv": "^16.3.1"
    },
    "keywords": [
      "mcp",
      "hubspot",
      "google-sheets",
      "injury-info",
      "legal",
      "medical"
    ],
    "author": "Your Name",
    "license": "MIT"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Created package.json with required dependencies');
} else {
  console.log('✅ package.json already exists');
}

console.log('\n📋 Setup Instructions:\n');

console.log('1. 🔑 Get Google API Key:');
console.log('   • Go to https://console.cloud.google.com/');
console.log('   • Create a new project or select existing');
console.log('   • Enable Google Sheets API');
console.log('   • Create API key credentials');
console.log('   • Add to .env: GOOGLE_API_KEY=your-key-here\n');

console.log('2. 📊 Create Google Sheet:');
console.log('   • Create new Google Sheet');
console.log('   • Add 3 tabs: "Law Firms", "Manufacturer Cases", "Medical Information"');
console.log('   • Use CSV templates in scripts/sample-data-templates/');
console.log('   • Copy spreadsheet ID from URL');
console.log('   • Add to .env: GOOGLE_SPREADSHEET_ID=your-id-here\n');

console.log('3. 🔧 Install Dependencies:');
console.log('   npm install\n');

console.log('4. 🧪 Test Setup:');
console.log('   node scripts/google-sheets-connector.js\n');

console.log('5. 🚀 Start MCP Server:');
console.log('   node hubspot-injury-info-server.js\n');

console.log('📁 Available Scripts:');
console.log('   • scripts/google-sheets-connector.js - Sync data to HubSpot');
console.log('   • scripts/setup-google-sheets.js - This setup script');
console.log('   • scripts/simple-data-loader.js - Load sample data to HubSpot');
console.log('   • scripts/hubspot-setup.js - Set up HubSpot properties\n');

console.log('📖 Documentation:');
console.log('   • scripts/google-sheets-setup-guide.md - Detailed setup guide');
console.log('   • scripts/sample-data-templates/ - CSV templates for import\n');

console.log('🎯 Next Steps:');
console.log('   1. Follow the setup instructions above');
console.log('   2. Test with sample data');
console.log('   3. Customize your Google Sheets structure');
console.log('   4. Set up automated syncing');
console.log('   5. Integrate with your Injury Info website\n');

console.log('💡 Pro Tips:');
console.log('   • Start with sandbox/testing environment');
console.log('   • Use data validation in Google Sheets');
console.log('   • Set up regular backups');
console.log('   • Monitor API usage limits');
console.log('   • Test thoroughly before production use\n');

console.log('✅ Setup script completed! Follow the instructions above to get started.'); 