#!/usr/bin/env node

/**
 * HubSpot Automated Setup Script for Injury Info MCP Server
 * 
 * This script automatically creates all required custom objects,
 * properties, and configurations via the HubSpot API.
 * 
 * Usage: node scripts/hubspot-setup.js
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

// Custom Object Schemas
const customObjects = {
    manufacturer_cases: {
        name: 'manufacturer_cases',
        labels: {
            singular: 'Manufacturer Case',
            plural: 'Manufacturer Cases'
        },
        primaryDisplayProperty: 'case_name',
        description: 'Legal cases involving manufacturer negligence and product liability',
        properties: [
            {
                name: 'case_name',
                label: 'Case Name',
                type: 'string',
                fieldType: 'text',
                description: 'Name or title of the legal case'
            },
            {
                name: 'manufacturer',
                label: 'Manufacturer',
                type: 'string',
                fieldType: 'text',
                description: 'Company or manufacturer involved'
            },
            {
                name: 'product_type',
                label: 'Product Type',
                type: 'string',
                fieldType: 'text',
                description: 'Type of product involved in the case'
            },
            {
                name: 'injury_type',
                label: 'Injury Type',
                type: 'string',
                fieldType: 'textarea',
                description: 'Types of injuries caused'
            },
            {
                name: 'case_status',
                label: 'Case Status',
                type: 'enumeration',
                fieldType: 'select',
                description: 'Current status of the case',
                options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Settled', value: 'settled' },
                    { label: 'Dismissed', value: 'dismissed' },
                    { label: 'Pending', value: 'pending' }
                ]
            },
            {
                name: 'settlement_amount',
                label: 'Settlement Amount',
                type: 'string',
                fieldType: 'text',
                description: 'Settlement amount if applicable'
            },
            {
                name: 'case_year',
                label: 'Case Year',
                type: 'number',
                fieldType: 'number',
                description: 'Year the case was filed or resolved'
            },
            {
                name: 'severity_level',
                label: 'Severity Level',
                type: 'enumeration',
                fieldType: 'select',
                description: 'Severity level of injuries/damages',
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Catastrophic', value: 'catastrophic' }
                ]
            }
        ]
    },

    settlement_data: {
        name: 'settlement_data',
        labels: {
            singular: 'Settlement Record',
            plural: 'Settlement Records'
        },
        primaryDisplayProperty: 'case_reference',
        description: 'Settlement amounts and calculation data for injury cases',
        properties: [
            {
                name: 'case_reference',
                label: 'Case Reference',
                type: 'string',
                fieldType: 'text',
                description: 'Reference ID for the settlement case'
            },
            {
                name: 'injury_type',
                label: 'Injury Type',
                type: 'string',
                fieldType: 'text',
                description: 'Primary injury type'
            },
            {
                name: 'base_amount',
                label: 'Base Settlement Amount',
                type: 'number',
                fieldType: 'number',
                description: 'Base settlement amount before adjustments'
            },
            {
                name: 'severity_multiplier',
                label: 'Severity Multiplier',
                type: 'number',
                fieldType: 'number',
                description: 'Multiplier based on injury severity'
            },
            {
                name: 'exposure_multiplier',
                label: 'Exposure Multiplier',
                type: 'number',
                fieldType: 'number',
                description: 'Multiplier based on exposure level'
            },
            {
                name: 'state_adjustment',
                label: 'State Adjustment',
                type: 'number',
                fieldType: 'number',
                description: 'State-specific adjustment factor'
            },
            {
                name: 'final_estimate',
                label: 'Final Settlement Estimate',
                type: 'number',
                fieldType: 'number',
                description: 'Calculated final settlement estimate'
            },
            {
                name: 'state',
                label: 'State',
                type: 'string',
                fieldType: 'text',
                description: 'State where the case occurred'
            }
        ]
    }
};

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

async function createCustomObject(objectName, objectData) {
    console.log(`🔄 Creating custom object: ${objectData.labels.singular}...`);
    
    const result = await apiRequest('POST', '/crm/v3/schemas', objectData);
    
    if (result) {
        console.log(`✅ Created custom object: ${objectData.labels.singular}`);
        return result;
    } else {
        console.log(`⚠️  Failed to create custom object: ${objectData.labels.singular}`);
        return null;
    }
}

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

async function setupHubSpot() {
    console.log('🚀 Starting HubSpot Injury Info Setup...\n');
    
    // Test API connection
    console.log('🔄 Testing HubSpot API connection...');
    const testResult = await apiRequest('GET', '/crm/v3/objects/contacts?limit=1');
    if (!testResult) {
        console.error('❌ Failed to connect to HubSpot API. Please check your access token.');
        process.exit(1);
    }
    console.log('✅ HubSpot API connection successful\n');

    // Create custom objects
    console.log('📋 Creating Custom Objects...');
    for (const [objectName, objectData] of Object.entries(customObjects)) {
        await createCustomObject(objectName, objectData);
    }
    console.log('');

    // Wait a moment for objects to be created
    console.log('⏳ Waiting for custom objects to be fully initialized...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');

    // Create custom properties for companies (law firms)
    console.log('🏢 Creating Custom Properties for Companies (Law Firms)...');
    for (const propertyData of customProperties.companies) {
        await createCustomProperty('companies', propertyData);
    }
    console.log('');

    // Create custom properties for contacts (leads)
    console.log('👥 Creating Custom Properties for Contacts (Leads)...');
    for (const propertyData of customProperties.contacts) {
        await createCustomProperty('contacts', propertyData);
    }
    console.log('');

    console.log('🎉 HubSpot Injury Info Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Verify all objects and properties in your HubSpot portal');
    console.log('2. Add some sample data to test the MCP server');
    console.log('3. Update your .env file with any additional configuration');
    console.log('4. Run: node test-hubspot-injury-info-server.js');
    console.log('\n💡 You can now use the Injury Info MCP server with full HubSpot integration!');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});

// Run the setup
setupHubSpot().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
}); 