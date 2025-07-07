#!/usr/bin/env node

/**
 * Final Sample Data Loader for HubSpot Injury Info Setup
 * 
 * This script loads sample data into HubSpot with proper array formatting
 * for checkbox fields.
 * 
 * Usage: node scripts/sample-data-loader-final.js
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

// Sample Law Firms (with proper array format for checkboxes)
const sampleLawFirms = [
    {
        name: 'Smith & Associates Personal Injury Law',
        domain: 'smithinjurylaw.com',
        phone: '(555) 123-4567',
        city: 'Los Angeles',
        state: 'California',
        country: 'United States',
        law_firm_specialty: ['personal_injury', 'car_accidents', 'slip_fall'],
        success_rate: 92,
        years_experience: 15,
        contingency_fee: 33,
        languages_spoken: ['english', 'spanish']
    },
    {
        name: 'Johnson Medical Malpractice Attorneys',
        domain: 'johnsonmedlaw.com',
        phone: '(555) 234-5678',
        city: 'New York',
        state: 'New York',
        country: 'United States',
        law_firm_specialty: ['medical_malpractice', 'personal_injury', 'wrongful_death'],
        success_rate: 88,
        years_experience: 22,
        contingency_fee: 35,
        languages_spoken: ['english', 'french']
    },
    {
        name: 'Davis Product Liability Group',
        domain: 'davisproductlaw.com',
        phone: '(555) 345-6789',
        city: 'Chicago',
        state: 'Illinois',
        country: 'United States',
        law_firm_specialty: ['product_liability', 'mass_tort', 'personal_injury'],
        success_rate: 85,
        years_experience: 18,
        contingency_fee: 30,
        languages_spoken: ['english', 'german']
    },
    {
        name: 'Wilson Workers Compensation Law',
        domain: 'wilsonworkerscomp.com',
        phone: '(555) 456-7890',
        city: 'Houston',
        state: 'Texas',
        country: 'United States',
        law_firm_specialty: ['workers_comp', 'personal_injury'],
        success_rate: 94,
        years_experience: 12,
        contingency_fee: 25,
        languages_spoken: ['english', 'spanish']
    },
    {
        name: 'Martinez Mass Tort Specialists',
        domain: 'martinezmasstort.com',
        phone: '(555) 567-8901',
        city: 'Miami',
        state: 'Florida',
        country: 'United States',
        law_firm_specialty: ['mass_tort', 'product_liability', 'medical_malpractice'],
        success_rate: 89,
        years_experience: 20,
        contingency_fee: 32,
        languages_spoken: ['english', 'spanish']
    }
];

// Sample Contacts (Leads) with injury interests
const sampleContacts = [
    {
        firstname: 'John',
        lastname: 'Smith',
        email: 'john.smith@email.com',
        phone: '(555) 111-2222',
        injury_interest: 'Car accident resulting in whiplash and back injuries. Looking for personal injury attorney.',
        case_urgency: 'high',
        preferred_contact_method: 'phone',
        ai_interaction_count: 3,
        last_ai_query: 'What is the average settlement for car accident whiplash?'
    },
    {
        firstname: 'Maria',
        lastname: 'Garcia',
        email: 'maria.garcia@email.com',
        phone: '(555) 222-3333',
        injury_interest: 'Medical malpractice case - surgical error during appendectomy. Need medical malpractice attorney.',
        case_urgency: 'critical',
        preferred_contact_method: 'email',
        ai_interaction_count: 5,
        last_ai_query: 'How do I prove medical malpractice in a surgical error case?'
    },
    {
        firstname: 'Robert',
        lastname: 'Johnson',
        email: 'robert.johnson@email.com',
        phone: '(555) 333-4444',
        injury_interest: 'Product liability - defective ladder caused fall and broken leg. Seeking product liability attorney.',
        case_urgency: 'medium',
        preferred_contact_method: 'text',
        ai_interaction_count: 2,
        last_ai_query: 'What companies have had ladder recall lawsuits?'
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

async function createContact(contactData) {
    const properties = Object.keys(contactData).reduce((acc, key) => {
        acc[key] = contactData[key];
        return acc;
    }, {});

    const result = await apiRequest('POST', '/crm/v3/objects/contacts', {
        properties
    });

    if (result) {
        console.log(`✅ Created contact: ${contactData.firstname} ${contactData.lastname}`);
        return result;
    } else {
        console.log(`⚠️  Failed to create contact: ${contactData.firstname} ${contactData.lastname}`);
        return null;
    }
}

async function loadSampleData() {
    console.log('🚀 Loading Final Sample Data for Injury Info HubSpot Setup...\n');

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

    // Create sample contacts (leads)
    console.log('👥 Creating Sample Contacts (Leads)...');
    let contactsCreated = 0;
    for (const contactData of sampleContacts) {
        const result = await createContact(contactData);
        if (result) contactsCreated++;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');

    console.log('🎉 Sample Data Loading Complete!');
    console.log('\n📋 Summary of Created Data:');
    console.log(`✅ ${firmsCreated}/${sampleLawFirms.length} Law Firms`);
    console.log(`✅ ${contactsCreated}/${sampleContacts.length} Contacts (Leads)`);
    console.log('\n💡 Your HubSpot portal now has realistic sample data!');
    console.log('Next: Test the MCP server with: npm run test:hubspot');
}

loadSampleData().catch(error => {
    console.error('❌ Sample data loading failed:', error);
    process.exit(1);
}); 