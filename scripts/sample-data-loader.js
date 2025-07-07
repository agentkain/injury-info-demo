#!/usr/bin/env node

/**
 * Sample Data Loader for HubSpot Injury Info Setup
 * 
 * This script loads sample data into HubSpot to test the MCP server
 * with realistic injury, legal, and manufacturer case data.
 * 
 * Usage: node scripts/sample-data-loader.js
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

// Sample Law Firms
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
        domain: 'martinezmass tort.com',
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

// Sample Manufacturer Cases
const sampleManufacturerCases = [
    {
        case_name: 'Johnson & Johnson Talcum Powder Lawsuit',
        manufacturer: 'Johnson & Johnson',
        product_type: 'Talcum Powder',
        injury_type: 'Ovarian cancer, mesothelioma',
        case_status: 'settled',
        settlement_amount: '$2.1 billion',
        case_year: 2020,
        severity_level: 'catastrophic'
    },
    {
        case_name: 'Ford Pinto Fuel System Defect',
        manufacturer: 'Ford Motor Company',
        product_type: 'Automobile',
        injury_type: 'Burns, wrongful death',
        case_status: 'settled',
        settlement_amount: '$125 million',
        case_year: 1978,
        severity_level: 'catastrophic'
    },
    {
        case_name: 'Roundup Weed Killer Cancer Claims',
        manufacturer: 'Bayer/Monsanto',
        product_type: 'Herbicide',
        injury_type: 'Non-Hodgkin lymphoma',
        case_status: 'active',
        settlement_amount: '$10 billion settlement fund',
        case_year: 2019,
        severity_level: 'high'
    },
    {
        case_name: 'Takata Airbag Recall',
        manufacturer: 'Takata Corporation',
        product_type: 'Automotive Airbags',
        injury_type: 'Lacerations, wrongful death',
        case_status: 'settled',
        settlement_amount: '$1.6 billion',
        case_year: 2017,
        severity_level: 'high'
    },
    {
        case_name: 'Zantac Cancer Lawsuit',
        manufacturer: 'Multiple Pharmaceutical Companies',
        product_type: 'Heartburn Medication',
        injury_type: 'Various cancers',
        case_status: 'pending',
        settlement_amount: 'TBD',
        case_year: 2022,
        severity_level: 'high'
    }
];

// Sample Settlement Data
const sampleSettlementData = [
    {
        case_reference: 'CA-PI-2023-001',
        injury_type: 'Car Accident - Severe',
        base_amount: 150000,
        severity_multiplier: 2.5,
        exposure_multiplier: 1.0,
        state_adjustment: 1.2,
        final_estimate: 450000,
        state: 'California'
    },
    {
        case_reference: 'NY-MM-2023-002',
        injury_type: 'Medical Malpractice',
        base_amount: 500000,
        severity_multiplier: 1.8,
        exposure_multiplier: 1.0,
        state_adjustment: 1.1,
        final_estimate: 990000,
        state: 'New York'
    },
    {
        case_reference: 'TX-WC-2023-003',
        injury_type: 'Workers Compensation',
        base_amount: 75000,
        severity_multiplier: 1.5,
        exposure_multiplier: 1.0,
        state_adjustment: 0.9,
        final_estimate: 101250,
        state: 'Texas'
    },
    {
        case_reference: 'FL-PL-2023-004',
        injury_type: 'Product Liability',
        base_amount: 200000,
        severity_multiplier: 3.0,
        exposure_multiplier: 2.0,
        state_adjustment: 1.0,
        final_estimate: 1200000,
        state: 'Florida'
    }
];

// Sample Blog Posts/Content (for CMS)
const sampleBlogPosts = [
    {
        name: 'Understanding Car Accident Injuries and Your Rights',
        slug: 'car-accident-injuries-rights',
        post_body: `<h2>Common Car Accident Injuries</h2>
        <p>Car accidents can result in various types of injuries, from minor cuts and bruises to severe, life-threatening conditions. Understanding these injuries and your legal rights is crucial for getting the compensation you deserve.</p>
        
        <h3>Types of Injuries:</h3>
        <ul>
        <li>Whiplash and neck injuries</li>
        <li>Back and spinal cord injuries</li>
        <li>Traumatic brain injuries</li>
        <li>Broken bones and fractures</li>
        <li>Internal organ damage</li>
        </ul>
        
        <p>If you've been injured in a car accident, it's important to seek medical attention immediately and consult with an experienced personal injury attorney.</p>`,
        meta_description: 'Learn about common car accident injuries and your legal rights. Get help from experienced personal injury attorneys.',
        publish_date: new Date().toISOString()
    },
    {
        name: 'Medical Malpractice: When Healthcare Goes Wrong',
        slug: 'medical-malpractice-guide',
        post_body: `<h2>What is Medical Malpractice?</h2>
        <p>Medical malpractice occurs when a healthcare provider fails to provide the standard of care that a reasonable healthcare provider would have provided in similar circumstances.</p>
        
        <h3>Common Types of Medical Malpractice:</h3>
        <ul>
        <li>Misdiagnosis or delayed diagnosis</li>
        <li>Surgical errors</li>
        <li>Medication errors</li>
        <li>Birth injuries</li>
        <li>Failure to obtain informed consent</li>
        </ul>
        
        <p>If you believe you've been a victim of medical malpractice, contact our experienced medical malpractice attorneys for a free consultation.</p>`,
        meta_description: 'Understanding medical malpractice cases and how to get legal help when healthcare providers fail to meet standards of care.',
        publish_date: new Date().toISOString()
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

async function createCustomObject(objectType, objectData) {
    const properties = Object.keys(objectData).reduce((acc, key) => {
        acc[key] = objectData[key];
        return acc;
    }, {});

    const result = await apiRequest('POST', `/crm/v3/objects/${objectType}`, {
        properties
    });

    if (result) {
        console.log(`✅ Created ${objectType}: ${objectData.case_name || objectData.case_reference}`);
        return result;
    } else {
        console.log(`⚠️  Failed to create ${objectType}: ${objectData.case_name || objectData.case_reference}`);
        return null;
    }
}

async function createBlogPost(postData) {
    // Note: This would require HubSpot Marketing Hub API access
    // For now, we'll just log what would be created
    console.log(`📝 Would create blog post: ${postData.name}`);
    console.log(`   Slug: ${postData.slug}`);
    console.log(`   Content preview: ${postData.post_body.substring(0, 100)}...`);
    return { id: Math.random().toString(36).substr(2, 9) };
}

async function loadSampleData() {
    console.log('🚀 Loading Sample Data for Injury Info HubSpot Setup...\n');

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
    for (const firmData of sampleLawFirms) {
        await createCompany(firmData);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    console.log('');

    // Create sample manufacturer cases
    console.log('⚖️  Creating Sample Manufacturer Cases...');
    for (const caseData of sampleManufacturerCases) {
        await createCustomObject('manufacturer_cases', caseData);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');

    // Create sample settlement data
    console.log('💰 Creating Sample Settlement Data...');
    for (const settlementData of sampleSettlementData) {
        await createCustomObject('settlement_data', settlementData);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');

    // Create sample blog posts (simulated)
    console.log('📝 Creating Sample Blog Posts...');
    for (const postData of sampleBlogPosts) {
        await createBlogPost(postData);
    }
    console.log('');

    console.log('🎉 Sample Data Loading Complete!');
    console.log('\n📋 Summary of Created Data:');
    console.log(`- ${sampleLawFirms.length} Law Firms`);
    console.log(`- ${sampleManufacturerCases.length} Manufacturer Cases`);
    console.log(`- ${sampleSettlementData.length} Settlement Records`);
    console.log(`- ${sampleBlogPosts.length} Blog Posts (simulated)`);
    console.log('\n💡 Your HubSpot portal now has sample data to test the MCP server!');
    console.log('Next: Run node test-hubspot-injury-info-server.js to test the AI tools');
}

loadSampleData().catch(error => {
    console.error('❌ Sample data loading failed:', error);
    process.exit(1);
}); 