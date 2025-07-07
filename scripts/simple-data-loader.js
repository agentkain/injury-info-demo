#!/usr/bin/env node

/**
 * Simple Sample Data Loader for HubSpot Injury Info Setup
 * 
 * This script loads basic sample data into HubSpot without problematic
 * checkbox fields to get the MCP server working.
 * 
 * Usage: node scripts/simple-data-loader.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};

async function apiRequest(method, endpoint, data = null) {
    const url = `${HUBSPOT_API_BASE}${endpoint}`;
    const options = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} - ${result.message}`);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Request failed: ${error.message}`);
        return null;
    }
}

// Simple Law Firms (basic fields only)
const sampleLawFirms = [
    {
        name: 'Smith & Associates Personal Injury Law',
        domain: 'smithinjurylaw.com',
        phone: '(555) 123-4567',
        city: 'Los Angeles',
        state: 'California',
        country: 'United States',
        success_rate: 92,
        years_experience: 15,
        contingency_fee: 33
    },
    {
        name: 'Johnson Medical Malpractice Attorneys',
        domain: 'johnsonmedlaw.com',
        phone: '(555) 234-5678',
        city: 'New York',
        state: 'New York',
        country: 'United States',
        success_rate: 88,
        years_experience: 22,
        contingency_fee: 35
    },
    {
        name: 'Davis Product Liability Group',
        domain: 'davisproductlaw.com',
        phone: '(555) 345-6789',
        city: 'Chicago',
        state: 'Illinois',
        country: 'United States',
        success_rate: 85,
        years_experience: 18,
        contingency_fee: 30
    },
    {
        name: 'Wilson Workers Compensation Law',
        domain: 'wilsonworkerscomp.com',
        phone: '(555) 456-7890',
        city: 'Houston',
        state: 'Texas',
        country: 'United States',
        success_rate: 94,
        years_experience: 12,
        contingency_fee: 25
    },
    {
        name: 'Martinez Mass Tort Specialists',
        domain: 'martinezmasstort.com',
        phone: '(555) 567-8901',
        city: 'Miami',
        state: 'Florida',
        country: 'United States',
        success_rate: 89,
        years_experience: 20,
        contingency_fee: 32
    }
];

async function createCompany(companyData) {
    const properties = Object.keys(companyData).reduce((acc, key) => {
        acc[key] = companyData[key];
        return acc;
    }, {});

    const result = await apiRequest('POST', '/crm/v3/objects/companies', {
        properties
    });

    if (result) {
        console.log(`✅ Created law firm: ${companyData.name}`);
        return result;
    } else {
        console.log(`⚠️  Failed to create law firm: ${companyData.name}`);
        return null;
    }
}

async function loadSampleData() {
    console.log('🚀 Loading Simple Sample Data for Injury Info HubSpot Setup...\n');

    if (!ACCESS_TOKEN) {
        console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in environment variables');
        process.exit(1);
    }

    // Test API connection
    console.log('🔄 Testing HubSpot API connection...');
    const testResult = await apiRequest('GET', '/crm/v3/objects/contacts?limit=1');
    if (!testResult) {
        console.error('❌ Failed to connect to HubSpot API. Please check your access token.');
        process.exit(1);
    }
    console.log('✅ HubSpot API connection successful\n');

    // Create sample law firms
    console.log('🏢 Creating Sample Law Firms...');
    let firmsCreated = 0;
    for (const firmData of sampleLawFirms) {
        const result = await createCompany(firmData);
        if (result) firmsCreated++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    console.log('');

    console.log('🎉 Sample Data Loading Complete!');
    console.log('\n📋 Summary of Created Data:');
    console.log(`✅ ${firmsCreated}/${sampleLawFirms.length} Law Firms`);
    console.log('\n💡 Your HubSpot portal now has basic sample data!');
    console.log('Next: Test the MCP server with: npm run test:hubspot');
    console.log('\n📝 Note: You can manually add specialties and languages in HubSpot later.');
}

loadSampleData().catch(error => {
    console.error('❌ Sample data loading failed:', error);
    process.exit(1);
}); 