#!/usr/bin/env node

/**
 * HubSpot Properties-Only Setup Script for Injury Info MCP Server
 * 
 * This script creates only custom properties (not custom objects)
 * for companies and contacts in HubSpot.
 * 
 * Usage: node scripts/hubspot-properties-only.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in environment variables');
    console.log('Please set your HubSpot Private App access token in your .env file');
    process.exit(1);
}

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
            console.error(`❌ API Error: ${response.status} - ${result.message || JSON.stringify(result)}`);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Request failed: ${error.message}`);
        return null;
    }
}

// Custom Properties for existing objects
const customProperties = {
    companies: [
        {
            name: 'law_firm_specialty',
            label: 'Law Firm Specialty',
            type: 'enumeration',
            fieldType: 'checkbox',
            groupName: 'companyinformation',
            description: 'Areas of legal specialization',
            options: [
                { label: 'Personal Injury', value: 'personal_injury' },
                { label: 'Medical Malpractice', value: 'medical_malpractice' },
                { label: 'Product Liability', value: 'product_liability' },
                { label: 'Workers Compensation', value: 'workers_comp' },
                { label: 'Car Accidents', value: 'car_accidents' },
                { label: 'Slip and Fall', value: 'slip_fall' },
                { label: 'Wrongful Death', value: 'wrongful_death' },
                { label: 'Mass Tort', value: 'mass_tort' }
            ]
        },
        {
            name: 'success_rate',
            label: 'Success Rate (%)',
            type: 'number',
            fieldType: 'number',
            groupName: 'companyinformation',
            description: 'Success rate percentage for cases won'
        },
        {
            name: 'years_experience',
            label: 'Years of Experience',
            type: 'number',
            fieldType: 'number',
            groupName: 'companyinformation',
            description: 'Number of years practicing law'
        },
        {
            name: 'contingency_fee',
            label: 'Contingency Fee (%)',
            type: 'number',
            fieldType: 'number',
            groupName: 'companyinformation',
            description: 'Contingency fee percentage'
        },
        {
            name: 'languages_spoken',
            label: 'Languages Spoken',
            type: 'enumeration',
            fieldType: 'checkbox',
            groupName: 'companyinformation',
            description: 'Languages spoken by the firm',
            options: [
                { label: 'English', value: 'english' },
                { label: 'Spanish', value: 'spanish' },
                { label: 'French', value: 'french' },
                { label: 'German', value: 'german' },
                { label: 'Mandarin', value: 'mandarin' },
                { label: 'Other', value: 'other' }
            ]
        }
    ],
    
    contacts: [
        {
            name: 'injury_interest',
            label: 'Injury/Legal Interest',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'contactinformation',
            description: 'Description of injury or legal interest'
        },
        {
            name: 'case_urgency',
            label: 'Case Urgency',
            type: 'enumeration',
            fieldType: 'select',
            groupName: 'contactinformation',
            description: 'Urgency level of the legal case',
            options: [
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Critical', value: 'critical' }
            ]
        },
        {
            name: 'preferred_contact_method',
            label: 'Preferred Contact Method',
            type: 'enumeration',
            fieldType: 'select',
            groupName: 'contactinformation',
            description: 'How the contact prefers to be reached',
            options: [
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'phone' },
                { label: 'Text', value: 'text' },
                { label: 'Mail', value: 'mail' }
            ]
        },
        {
            name: 'ai_interaction_count',
            label: 'AI Interaction Count',
            type: 'number',
            fieldType: 'number',
            groupName: 'contactinformation',
            description: 'Number of times contacted AI assistant'
        },
        {
            name: 'last_ai_query',
            label: 'Last AI Query',
            type: 'string',
            fieldType: 'textarea',
            groupName: 'contactinformation',
            description: 'Last query made to AI assistant'
        }
    ]
};

async function createCustomProperty(objectType, propertyData) {
    console.log(`🔄 Creating property: ${propertyData.label} for ${objectType}...`);
    
    const result = await apiRequest('POST', `/crm/v3/properties/${objectType}`, propertyData);
    
    if (result) {
        console.log(`✅ Created property: ${propertyData.label}`);
        return result;
    } else {
        console.log(`⚠️  Failed to create property: ${propertyData.label}`);
        return null;
    }
}

async function setupHubSpotProperties() {
    console.log('🚀 Starting HubSpot Injury Info Properties Setup...\n');
    
    // Test API connection
    console.log('🔄 Testing HubSpot API connection...');
    const testResult = await apiRequest('GET', '/crm/v3/objects/contacts?limit=1');
    if (!testResult) {
        console.error('❌ Failed to connect to HubSpot API. Please check your access token.');
        process.exit(1);
    }
    console.log('✅ HubSpot API connection successful\n');

    // Create custom properties for companies (law firms)
    console.log('🏢 Creating Custom Properties for Companies (Law Firms)...');
    let companyPropsCreated = 0;
    for (const propertyData of customProperties.companies) {
        const result = await createCustomProperty('companies', propertyData);
        if (result) companyPropsCreated++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    console.log('');

    // Create custom properties for contacts (leads)
    console.log('👥 Creating Custom Properties for Contacts (Leads)...');
    let contactPropsCreated = 0;
    for (const propertyData of customProperties.contacts) {
        const result = await createCustomProperty('contacts', propertyData);
        if (result) contactPropsCreated++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    console.log('');

    console.log('🎉 HubSpot Properties Setup Complete!');
    console.log('\n📋 Summary:');
    console.log(`✅ Created ${companyPropsCreated}/${customProperties.companies.length} Company Properties`);
    console.log(`✅ Created ${contactPropsCreated}/${customProperties.contacts.length} Contact Properties`);
    console.log('\n📋 Next Steps:');
    console.log('1. Check your HubSpot portal to verify the properties were created');
    console.log('2. Add some sample law firms to test the properties');
    console.log('3. Run: npm run load:sample-data to add test data');
    console.log('4. Test the MCP server integration');
    console.log('\n💡 Your HubSpot portal now has custom properties for the Injury Info MCP server!');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});

// Run the setup
setupHubSpotProperties().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
}); 