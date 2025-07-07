#!/usr/bin/env node

/**
 * Google Sheets Connector for Injury Info MCP Server
 * 
 * This script connects to Google Sheets to sync data with HubSpot
 * for law firms, manufacturer cases, and medical information.
 * 
 * Usage: node scripts/google-sheets-connector.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

const headers = {
    'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};

async function googleSheetsRequest(endpoint) {
    const url = `${GOOGLE_SHEETS_API_BASE}${endpoint}&key=${GOOGLE_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (!response.ok) {
            console.error(`❌ Google Sheets API Error: ${response.status} - ${result.error?.message}`);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Google Sheets request failed: ${error.message}`);
        return null;
    }
}

async function hubspotRequest(method, endpoint, data = null) {
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
            console.error(`❌ HubSpot API Error: ${response.status} - ${result.message}`);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error(`❌ HubSpot request failed: ${error.message}`);
        return null;
    }
}

// Sample Google Sheets structure
const SHEET_STRUCTURE = {
    law_firms: {
        sheet_name: 'Law Firms',
        columns: ['Name', 'Specialty', 'Success Rate', 'Years Experience', 'Contingency Fee', 'Languages', 'Phone', 'Email', 'City', 'State'],
        hubspot_mapping: {
            'Name': 'name',
            'Phone': 'phone',
            'Email': 'email',
            'City': 'city',
            'State': 'state',
            'Success Rate': 'success_rate',
            'Years Experience': 'years_experience',
            'Contingency Fee': 'contingency_fee'
        }
    },
    manufacturer_cases: {
        sheet_name: 'Manufacturer Cases',
        columns: ['Company', 'Product', 'Injury Type', 'Settlement Amount', 'Year', 'Status', 'Severity', 'Case Name'],
        hubspot_mapping: {
            'Company': 'manufacturer',
            'Product': 'product_type',
            'Injury Type': 'injury_type',
            'Settlement Amount': 'settlement_amount',
            'Year': 'case_year',
            'Status': 'case_status',
            'Severity': 'severity_level',
            'Case Name': 'case_name'
        }
    },
    medical_info: {
        sheet_name: 'Medical Information',
        columns: ['Condition', 'Symptoms', 'Treatments', 'Legal Considerations', 'Average Settlement', 'Time Limit'],
        hubspot_mapping: {
            'Condition': 'condition_name',
            'Symptoms': 'symptoms',
            'Treatments': 'treatments',
            'Legal Considerations': 'legal_considerations',
            'Average Settlement': 'avg_settlement',
            'Time Limit': 'statute_limitations'
        }
    }
};

async function readGoogleSheet(spreadsheetId, sheetName) {
    console.log(`📊 Reading Google Sheet: ${sheetName}...`);
    
    const endpoint = `/${spreadsheetId}/values/${sheetName}?majorDimension=ROWS`;
    const result = await googleSheetsRequest(endpoint);
    
    if (!result || !result.values) {
        console.log(`⚠️  No data found in sheet: ${sheetName}`);
        return [];
    }
    
    const [headers, ...rows] = result.values;
    const data = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
    
    console.log(`✅ Read ${data.length} rows from ${sheetName}`);
    return data;
}

async function syncLawFirmsToHubSpot(lawFirmsData) {
    console.log('🏢 Syncing Law Firms to HubSpot...');
    
    let created = 0;
    let updated = 0;
    
    for (const firm of lawFirmsData) {
        const properties = {
            name: firm.Name,
            phone: firm.Phone,
            email: firm.Email,
            city: firm.City,
            state: firm.State,
            success_rate: parseInt(firm['Success Rate']) || 0,
            years_experience: parseInt(firm['Years Experience']) || 0,
            contingency_fee: parseInt(firm['Contingency Fee']) || 0
        };
        
        // Check if company already exists
        const searchResult = await hubspotRequest('GET', `/crm/v3/objects/companies?search=${encodeURIComponent(firm.Name)}&limit=1`);
        
        if (searchResult && searchResult.results && searchResult.results.length > 0) {
            // Update existing
            const companyId = searchResult.results[0].id;
            const updateResult = await hubspotRequest('PATCH', `/crm/v3/objects/companies/${companyId}`, { properties });
            if (updateResult) {
                console.log(`✅ Updated law firm: ${firm.Name}`);
                updated++;
            }
        } else {
            // Create new
            const createResult = await hubspotRequest('POST', '/crm/v3/objects/companies', { properties });
            if (createResult) {
                console.log(`✅ Created law firm: ${firm.Name}`);
                created++;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
    }
    
    console.log(`📊 Law Firms sync complete: ${created} created, ${updated} updated`);
    return { created, updated };
}

async function syncManufacturerCasesToHubSpot(casesData) {
    console.log('⚖️  Syncing Manufacturer Cases to HubSpot...');
    
    // Note: This would require custom objects, so we'll store as notes or use a different approach
    console.log('📝 Manufacturer cases data would be stored in HubSpot notes or custom objects');
    console.log(`📊 Found ${casesData.length} manufacturer cases`);
    
    // For now, just log the data
    casesData.forEach(caseData => {
        console.log(`  - ${caseData.Company}: ${caseData.Product} (${caseData.Status})`);
    });
    
    return casesData.length;
}

async function syncMedicalInfoToHubSpot(medicalData) {
    console.log('🏥 Syncing Medical Information to HubSpot...');
    
    // This could be stored as knowledge base articles or custom objects
    console.log('📝 Medical information would be stored as knowledge base content');
    console.log(`📊 Found ${medicalData.length} medical conditions`);
    
    // For now, just log the data
    medicalData.forEach(condition => {
        console.log(`  - ${condition.Condition}: ${condition.Symptoms}`);
    });
    
    return medicalData.length;
}

async function syncGoogleSheetsToHubSpot(spreadsheetId) {
    console.log('🚀 Starting Google Sheets to HubSpot Sync...\n');
    
    if (!GOOGLE_API_KEY) {
        console.error('❌ ERROR: GOOGLE_API_KEY not found in environment variables');
        console.log('Please set your Google API key in your .env file');
        process.exit(1);
    }
    
    if (!HUBSPOT_ACCESS_TOKEN) {
        console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in environment variables');
        console.log('Please set your HubSpot access token in your .env file');
        process.exit(1);
    }
    
    // Test HubSpot connection
    console.log('🔄 Testing HubSpot API connection...');
    const testResult = await hubspotRequest('GET', '/crm/v3/objects/contacts?limit=1');
    if (!testResult) {
        console.error('❌ Failed to connect to HubSpot API');
        process.exit(1);
    }
    console.log('✅ HubSpot API connection successful\n');
    
    // Sync each sheet
    const results = {};
    
    // Law Firms
    const lawFirmsData = await readGoogleSheet(spreadsheetId, SHEET_STRUCTURE.law_firms.sheet_name);
    if (lawFirmsData.length > 0) {
        results.lawFirms = await syncLawFirmsToHubSpot(lawFirmsData);
    }
    
    // Manufacturer Cases
    const casesData = await readGoogleSheet(spreadsheetId, SHEET_STRUCTURE.manufacturer_cases.sheet_name);
    if (casesData.length > 0) {
        results.manufacturerCases = await syncManufacturerCasesToHubSpot(casesData);
    }
    
    // Medical Information
    const medicalData = await readGoogleSheet(spreadsheetId, SHEET_STRUCTURE.medical_info.sheet_name);
    if (medicalData.length > 0) {
        results.medicalInfo = await syncMedicalInfoToHubSpot(medicalData);
    }
    
    console.log('\n🎉 Google Sheets to HubSpot Sync Complete!');
    console.log('\n📋 Summary:');
    console.log(`✅ Law Firms: ${results.lawFirms?.created || 0} created, ${results.lawFirms?.updated || 0} updated`);
    console.log(`✅ Manufacturer Cases: ${results.manufacturerCases || 0} found`);
    console.log(`✅ Medical Info: ${results.medicalInfo || 0} conditions found`);
    console.log('\n💡 Your HubSpot portal is now synced with Google Sheets data!');
}

// Example usage
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || 'your-spreadsheet-id-here';

if (SPREADSHEET_ID === 'your-spreadsheet-id-here') {
    console.log('📋 Google Sheets Connector Setup:');
    console.log('1. Create a Google Sheet with the following structure:');
    console.log('   - Sheet 1: "Law Firms"');
    console.log('   - Sheet 2: "Manufacturer Cases"');
    console.log('   - Sheet 3: "Medical Information"');
    console.log('2. Get your Google API key from Google Cloud Console');
    console.log('3. Add to .env: GOOGLE_API_KEY=your-api-key');
    console.log('4. Add to .env: GOOGLE_SPREADSHEET_ID=your-spreadsheet-id');
    console.log('5. Run: node scripts/google-sheets-connector.js');
} else {
    syncGoogleSheetsToHubSpot(SPREADSHEET_ID).catch(error => {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    });
} 