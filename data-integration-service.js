/**
 * Data Integration Service
 * Fetches data from Google Sheets and HubSpot through MCP connectors
 * Provides centralized data access for the injury info website
 */

import { HubSpotInjuryInfoConnector } from './hubspot-connector.js';
import { GoogleSheetsConnector } from './google-sheets-connector.js';

export class DataIntegrationService {
    constructor() {
        // Initialize connectors with error handling
        try {
            this.hubspot = new HubSpotInjuryInfoConnector({
                hubspotApiKey: process.env.HUBSPOT_ACCESS_TOKEN,
                hubspotPortalId: process.env.HUBSPOT_PORTAL_ID
            });
            console.log('✅ HubSpot connector initialized');
        } catch (error) {
            console.warn('⚠️ HubSpot connector failed to initialize:', error.message);
            this.hubspot = null;
        }
        
        try {
            this.googleSheets = new GoogleSheetsConnector({
                apiKey: process.env.GOOGLE_API_KEY,
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
            });
            console.log('✅ Google Sheets connector initialized');
        } catch (error) {
            console.warn('⚠️ Google Sheets connector failed to initialize:', error.message);
            this.googleSheets = null;
        }

        // Cache for performance
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get all articles from Google Sheets and HubSpot
     */
    async getAllArticles() {
        const cacheKey = 'all_articles';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            console.log('🔄 Fetching articles from data sources...');
            
            const [sheetsArticles, hubspotArticles] = await Promise.all([
                this.getArticlesFromGoogleSheets(),
                this.getArticlesFromHubSpot()
            ]);

            // Merge and deduplicate articles
            const allArticles = this.mergeArticles(sheetsArticles, hubspotArticles);
            
            // If no articles found from connectors, use fallback data
            if (allArticles.length === 0) {
                console.log('📋 Using fallback article data');
                const fallbackArticles = this.getFallbackArticles();
                this.setCache(cacheKey, fallbackArticles);
                return fallbackArticles;
            }
            
            this.setCache(cacheKey, allArticles);
            console.log(`✅ Fetched ${allArticles.length} articles total`);
            
            return allArticles;
        } catch (error) {
            console.error('❌ Error fetching articles:', error);
            console.log('📋 Using fallback article data due to error');
            // Return fallback data if connectors fail
            return this.getFallbackArticles();
        }
    }

    /**
     * Get articles from Google Sheets
     */
    async getArticlesFromGoogleSheets() {
        if (!this.googleSheets) {
            console.log('⚠️ Google Sheets connector not available');
            return [];
        }
        
        try {
            const articles = [];
            
            // Read from different sheets
            const sheets = ['Medical Conditions', 'Legal Cases', 'Manufacturer Cases'];
            
            for (const sheetName of sheets) {
                try {
                    const { data } = await this.googleSheets.readSheet(sheetName);
                    
                    for (const row of data) {
                        const article = this.mapSheetRowToArticle(row, sheetName);
                        if (article) {
                            articles.push(article);
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not read sheet ${sheetName}:`, error.message);
                }
            }
            
            return articles;
        } catch (error) {
            console.error('❌ Error reading Google Sheets:', error);
            return [];
        }
    }

    /**
     * Get articles from HubSpot
     */
    async getArticlesFromHubSpot() {
        if (!this.hubspot) {
            console.log('⚠️ HubSpot connector not available');
            return [];
        }
        
        try {
            // Search for disease/condition content
            const diseases = await this.hubspot.searchDiseases('', null, 50);
            
            return diseases.map(disease => ({
                id: `hubspot_${disease.id}`,
                title: disease.name,
                description: disease.description,
                slug: this.createSlug(disease.name),
                category: disease.category || 'medical',
                date: disease.lastUpdated,
                content: {
                    overview: disease.description,
                    symptoms: disease.symptoms || [],
                    causes: disease.causes || [],
                    treatments: [], // Would need to be populated from content
                    legalOptions: [], // Would need to be populated from content
                    settlements: '' // Would need to be populated from content
                },
                source: 'hubspot'
            }));
        } catch (error) {
            console.error('❌ Error reading HubSpot:', error);
            return [];
        }
    }

    /**
     * Map Google Sheets row to article format
     */
    mapSheetRowToArticle(row, sheetName) {
        try {
            switch (sheetName) {
                case 'Medical Conditions':
                    return {
                        id: `sheets_medical_${row.ID || Math.random()}`,
                        title: row['Condition Name'] || row.Name || '',
                        description: row.Description || row['Medical Description'] || '',
                        slug: this.createSlug(row['Condition Name'] || row.Name || ''),
                        category: 'medical',
                        date: row['Last Updated'] || new Date().toISOString(),
                        content: {
                            overview: row.Description || row['Medical Description'] || '',
                            symptoms: this.parseList(row.Symptoms || row['Common Symptoms'] || ''),
                            causes: this.parseList(row.Causes || row['Risk Factors'] || ''),
                            treatments: this.parseList(row.Treatments || row['Treatment Options'] || ''),
                            legalOptions: this.parseList(row['Legal Options'] || ''),
                            settlements: row.Settlements || row['Settlement Range'] || ''
                        },
                        source: 'google_sheets'
                    };

                case 'Legal Cases':
                    return {
                        id: `sheets_legal_${row.ID || Math.random()}`,
                        title: row['Case Name'] || row.Name || '',
                        description: row.Description || row['Case Summary'] || '',
                        slug: this.createSlug(row['Case Name'] || row.Name || ''),
                        category: 'legal',
                        date: row['Date Filed'] || row['Last Updated'] || new Date().toISOString(),
                        content: {
                            overview: row.Description || row['Case Summary'] || '',
                            symptoms: [],
                            causes: this.parseList(row['Alleged Causes'] || ''),
                            treatments: [],
                            legalOptions: this.parseList(row['Legal Options'] || ''),
                            settlements: row['Settlement Amount'] || row.Settlements || ''
                        },
                        source: 'google_sheets'
                    };

                case 'Manufacturer Cases':
                    return {
                        id: `sheets_manufacturer_${row.ID || Math.random()}`,
                        title: `${row.Manufacturer || row.Company || ''} - ${row.Product || ''}`,
                        description: row.Description || row['Case Summary'] || '',
                        slug: this.createSlug(`${row.Manufacturer || row.Company || ''}-${row.Product || ''}`),
                        category: 'manufacturer',
                        date: row['Date Filed'] || row['Last Updated'] || new Date().toISOString(),
                        content: {
                            overview: row.Description || row['Case Summary'] || '',
                            symptoms: this.parseList(row.Symptoms || ''),
                            causes: this.parseList(row['Alleged Causes'] || ''),
                            treatments: [],
                            legalOptions: this.parseList(row['Legal Options'] || ''),
                            settlements: row['Settlement Amount'] || row.Settlements || ''
                        },
                        source: 'google_sheets'
                    };

                default:
                    return null;
            }
        } catch (error) {
            console.error('❌ Error mapping sheet row:', error);
            return null;
        }
    }

    /**
     * Get law firms from Google Sheets and HubSpot
     */
    async getLawFirms(specialty = null, location = null) {
        const cacheKey = `law_firms_${specialty}_${location}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const [sheetsFirms, hubspotFirms] = await Promise.all([
                this.getLawFirmsFromGoogleSheets(specialty, location),
                this.getLawFirmsFromHubSpot(specialty, location)
            ]);

            const allFirms = [...sheetsFirms, ...hubspotFirms];
            
            // If no firms found from connectors, use fallback data
            if (allFirms.length === 0) {
                console.log('📋 Using fallback law firm data');
                const fallbackFirms = this.getFallbackLawFirms();
                // Filter by specialty if specified
                const filteredFirms = specialty 
                    ? fallbackFirms.filter(firm => 
                        firm.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
                    )
                    : fallbackFirms;
                this.setCache(cacheKey, filteredFirms);
                return filteredFirms;
            }
            
            this.setCache(cacheKey, allFirms);
            return allFirms;
        } catch (error) {
            console.error('❌ Error fetching law firms:', error);
            console.log('📋 Using fallback law firm data due to error');
            const fallbackFirms = this.getFallbackLawFirms();
            const filteredFirms = specialty 
                ? fallbackFirms.filter(firm => 
                    firm.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
                )
                : fallbackFirms;
            return filteredFirms;
        }
    }

    /**
     * Get law firms from Google Sheets
     */
    async getLawFirmsFromGoogleSheets(specialty = null, location = null) {
        if (!this.googleSheets) {
            console.log('⚠️ Google Sheets connector not available');
            return [];
        }
        
        try {
            const { data } = await this.googleSheets.readSheet('Law Firms');
            
            return data
                .filter(firm => {
                    if (specialty && !firm.Specialties?.toLowerCase().includes(specialty.toLowerCase())) {
                        return false;
                    }
                    if (location && !firm.Location?.toLowerCase().includes(location.toLowerCase())) {
                        return false;
                    }
                    return true;
                })
                .map(firm => ({
                    id: `sheets_firm_${firm.ID || Math.random()}`,
                    name: firm.Name || firm['Firm Name'] || '',
                    location: firm.Location || `${firm.City || ''}, ${firm.State || ''}`,
                    phone: firm.Phone || '',
                    website: firm.Website || '',
                    specialties: this.parseList(firm.Specialties || ''),
                    experience: firm['Years Experience'] || firm.Experience || '',
                    successRate: firm['Success Rate'] || '',
                    notableSettlements: this.parseList(firm['Notable Settlements'] || ''),
                    source: 'google_sheets'
                }));
        } catch (error) {
            console.error('❌ Error reading law firms from sheets:', error);
            return [];
        }
    }

    /**
     * Get law firms from HubSpot
     */
    async getLawFirmsFromHubSpot(specialty = null, location = null) {
        if (!this.hubspot) {
            console.log('⚠️ HubSpot connector not available');
            return [];
        }
        
        try {
            const firms = await this.hubspot.findLawFirms(specialty || '', location, 20);
            
            return firms.map(firm => ({
                id: `hubspot_firm_${firm.id}`,
                name: firm.name,
                location: firm.location,
                phone: firm.phone,
                website: firm.website,
                specialties: firm.specialties,
                experience: firm.experience,
                successRate: firm.successRate,
                notableSettlements: firm.notableSettlements,
                source: 'hubspot'
            }));
        } catch (error) {
            console.error('❌ Error reading law firms from HubSpot:', error);
            return [];
        }
    }

    /**
     * Get settlement data for a condition
     */
    async getSettlementData(condition, state = null) {
        const cacheKey = `settlement_${condition}_${state}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const [sheetsData, hubspotData] = await Promise.all([
                this.getSettlementDataFromGoogleSheets(condition, state),
                this.getSettlementDataFromHubSpot(condition, state)
            ]);

            // Merge settlement data
            const mergedData = this.mergeSettlementData(sheetsData, hubspotData);
            
            // If no settlement data found from connectors, use fallback data
            if (mergedData.length === 0) {
                console.log('📋 Using fallback settlement data');
                const fallbackData = this.getDefaultSettlementData(condition);
                this.setCache(cacheKey, fallbackData);
                return fallbackData;
            }
            
            this.setCache(cacheKey, mergedData);
            return mergedData;
        } catch (error) {
            console.error('❌ Error fetching settlement data:', error);
            console.log('📋 Using fallback settlement data due to error');
            const fallbackData = this.getDefaultSettlementData(condition);
            return fallbackData;
        }
    }

    /**
     * Get settlement data from Google Sheets
     */
    async getSettlementDataFromGoogleSheets(condition, state = null) {
        if (!this.googleSheets) {
            console.log('⚠️ Google Sheets connector not available');
            return [];
        }
        
        try {
            const { data } = await this.googleSheets.searchSheet('Settlements', condition, 'Condition', 20);
            
            return data
                .filter(row => !state || row.State?.toLowerCase().includes(state.toLowerCase()))
                .map(row => ({
                    condition: row.Condition || '',
                    state: row.State || '',
                    settlementRange: row['Settlement Range'] || row.Settlements || '',
                    averageSettlement: row['Average Settlement'] || '',
                    totalCases: row['Total Cases'] || '',
                    year: row.Year || '',
                    source: 'google_sheets'
                }));
        } catch (error) {
            console.error('❌ Error reading settlements from sheets:', error);
            return [];
        }
    }

    /**
     * Get settlement data from HubSpot
     */
    async getSettlementDataFromHubSpot(condition, state = null) {
        if (!this.hubspot) {
            console.log('⚠️ HubSpot connector not available');
            return [];
        }
        
        try {
            const data = await this.hubspot.getSettlementData(condition, state);
            return data.map(item => ({
                ...item,
                source: 'hubspot'
            }));
        } catch (error) {
            console.error('❌ Error reading settlements from HubSpot:', error);
            return [];
        }
    }

    /**
     * Search for comprehensive information about a condition
     */
    async searchCondition(condition) {
        const cacheKey = `search_${condition}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const [articles, lawFirms, settlements] = await Promise.all([
                this.searchArticles(condition),
                this.getLawFirms(condition),
                this.getSettlementData(condition)
            ]);

            const result = {
                condition,
                articles,
                lawFirms,
                settlements,
                summary: this.generateSummary(condition, articles, settlements)
            };

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('❌ Error searching condition:', error);
            return {
                condition,
                articles: [],
                lawFirms: [],
                settlements: [],
                summary: `Information about ${condition} is currently being updated.`
            };
        }
    }

    /**
     * Search articles by condition
     */
    async searchArticles(condition) {
        const allArticles = await this.getAllArticles();
        
        return allArticles.filter(article => 
            article.title.toLowerCase().includes(condition.toLowerCase()) ||
            article.description.toLowerCase().includes(condition.toLowerCase()) ||
            article.content.overview.toLowerCase().includes(condition.toLowerCase())
        );
    }

    // Helper methods
    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    parseList(text) {
        if (!text) return [];
        return text.split(/[,;|]/).map(item => item.trim()).filter(item => item);
    }

    mergeArticles(sheetsArticles, hubspotArticles) {
        const merged = [...sheetsArticles, ...hubspotArticles];
        
        // Remove duplicates based on title
        const seen = new Set();
        return merged.filter(article => {
            const key = article.title.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    mergeSettlementData(sheetsData, hubspotData) {
        const merged = [...sheetsData, ...hubspotData];
        
        // Group by condition and state
        const grouped = {};
        merged.forEach(item => {
            const key = `${item.condition}_${item.state || 'all'}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });

        // Return the most comprehensive data for each group
        return Object.values(grouped).map(group => 
            group.reduce((best, current) => 
                (current.settlementRange && !best.settlementRange) ? current : best
            )
        );
    }

    generateSummary(condition, articles, settlements) {
        const article = articles[0];
        const settlement = settlements[0];
        
        let summary = `Information about ${condition}`;
        
        if (article) {
            summary += `. ${article.content.overview.substring(0, 200)}...`;
        }
        
        if (settlement) {
            summary += ` Typical settlements range from ${settlement.settlementRange}.`;
        }
        
        return summary;
    }

    getDefaultSettlementData(condition) {
        const defaults = {
            'mesothelioma': { 
                condition: 'Mesothelioma',
                settlementRange: '$1.2 million to $2.4 million',
                averageSettlement: '$1.8 million',
                totalCases: 'Thousands',
                year: '2024',
                source: 'fallback'
            },
            'lung cancer': { 
                condition: 'Lung Cancer',
                settlementRange: '$500,000 to $1.5 million',
                averageSettlement: '$1 million',
                totalCases: 'Hundreds',
                year: '2024',
                source: 'fallback'
            },
            'ovarian cancer': { 
                condition: 'Ovarian Cancer',
                settlementRange: '$100,000 to $500,000',
                averageSettlement: '$300,000',
                totalCases: 'Thousands',
                year: '2024',
                source: 'fallback'
            },
            'non-hodgkin lymphoma': { 
                condition: 'Non-Hodgkin Lymphoma',
                settlementRange: '$50,000 to $250,000',
                averageSettlement: '$150,000',
                totalCases: 'Hundreds',
                year: '2024',
                source: 'fallback'
            }
        };
        
        return [defaults[condition.toLowerCase()] || { 
            condition: condition,
            settlementRange: 'Varies by case',
            averageSettlement: 'Contact attorney for estimate',
            totalCases: 'Varies',
            year: '2024',
            source: 'fallback'
        }];
    }

    getFallbackLawFirms() {
        return [
            {
                id: 'fallback_firm_1',
                name: 'Saddle Rock Legal Group',
                location: 'Nationwide',
                phone: '(800) 123-4567',
                website: 'https://legalinjuryadvocates.com',
                specialties: ['Mesothelioma', 'Asbestos', 'Product Liability'],
                experience: '20+ years',
                successRate: '95%',
                notableSettlements: ['$2.4M mesothelioma settlement', '$1.8M asbestos case'],
                source: 'fallback'
            },
            {
                id: 'fallback_firm_2',
                name: 'National Injury Law Center',
                location: 'California, Texas, Florida',
                phone: '(800) 987-6543',
                website: 'https://nationalinjury.com',
                specialties: ['Roundup', 'Talcum Powder', 'Medical Devices'],
                experience: '15+ years',
                successRate: '90%',
                notableSettlements: ['$250K Roundup settlement', '$500K talc case'],
                source: 'fallback'
            },
            {
                id: 'fallback_firm_3',
                name: 'Veterans Legal Services',
                location: 'Nationwide',
                phone: '(800) 555-0123',
                website: 'https://veteranslegal.org',
                specialties: ['3M Earplugs', 'Military Injuries', 'VA Benefits'],
                experience: '25+ years',
                successRate: '88%',
                notableSettlements: ['$100K earplug case', '$75K tinnitus claim'],
                source: 'fallback'
            }
        ];
    }

    getFallbackArticles() {
        // Return comprehensive fallback data if connectors fail
        return [
            {
                id: 1,
                title: "Mesothelioma and Asbestos Exposure",
                description: "Comprehensive guide to mesothelioma, its causes, symptoms, and legal options for victims of asbestos exposure.",
                slug: "mesothelioma-asbestos-exposure",
                category: 'medical',
                date: new Date().toISOString(),
                content: {
                    overview: "Mesothelioma is a rare and aggressive cancer that develops in the lining of the lungs, abdomen, or heart. It is primarily caused by exposure to asbestos, a naturally occurring mineral that was widely used in construction, manufacturing, and other industries until the late 1970s.",
                    symptoms: [
                        "Chest pain and shortness of breath",
                        "Persistent cough and fatigue",
                        "Weight loss and loss of appetite",
                        "Fluid buildup around the lungs",
                        "Abdominal pain and swelling (for peritoneal mesothelioma)"
                    ],
                    causes: [
                        "Asbestos exposure in the workplace",
                        "Secondary exposure through family members",
                        "Environmental exposure near asbestos mines or factories",
                        "Exposure during home renovations or demolition"
                    ],
                    treatments: [
                        "Surgery to remove tumors",
                        "Chemotherapy and radiation therapy",
                        "Immunotherapy and targeted therapy",
                        "Palliative care for symptom management"
                    ],
                    legalOptions: [
                        "Personal injury lawsuits against asbestos manufacturers",
                        "Workers' compensation claims",
                        "Asbestos trust fund claims",
                        "Wrongful death lawsuits for family members"
                    ],
                    settlements: "Mesothelioma settlements typically range from $1.2 million to $2.4 million, with some cases reaching $10 million or more. Factors affecting settlement amounts include the severity of the disease, age of the victim, exposure history, and jurisdiction."
                },
                source: 'fallback'
            },
            {
                id: 2,
                title: "Roundup Weedkiller Cancer Lawsuits",
                description: "Information about Roundup lawsuits alleging the weedkiller causes non-Hodgkin lymphoma and other cancers.",
                slug: "roundup-weedkiller-cancer-lawsuits",
                category: 'legal',
                date: new Date().toISOString(),
                content: {
                    overview: "Roundup is a popular weedkiller manufactured by Monsanto (now owned by Bayer). The active ingredient, glyphosate, has been linked to non-Hodgkin lymphoma and other cancers in numerous studies and lawsuits.",
                    symptoms: [
                        "Swollen lymph nodes in neck, armpits, or groin",
                        "Unexplained weight loss and fatigue",
                        "Night sweats and fever",
                        "Chest pain and shortness of breath",
                        "Abdominal pain and swelling"
                    ],
                    causes: [
                        "Direct exposure to Roundup during application",
                        "Exposure to glyphosate in food and water",
                        "Occupational exposure in agriculture and landscaping",
                        "Residential use in gardens and lawns"
                    ],
                    treatments: [
                        "Chemotherapy and radiation therapy",
                        "Immunotherapy and targeted therapy",
                        "Stem cell transplantation",
                        "Clinical trials for new treatments"
                    ],
                    legalOptions: [
                        "Product liability lawsuits against Bayer/Monsanto",
                        "Class action lawsuits",
                        "Wrongful death claims",
                        "Settlement fund claims"
                    ],
                    settlements: "Bayer has agreed to pay $10.9 billion to settle approximately 100,000 Roundup lawsuits. Individual settlements typically range from $5,000 to $250,000, depending on the severity of the cancer and exposure history."
                },
                source: 'fallback'
            },
            {
                id: 3,
                title: "3M Combat Arms Earplug Litigation",
                description: "Details about the 3M earplug lawsuits alleging defective military earplugs caused hearing loss and tinnitus.",
                slug: "3m-combat-arms-earplug-litigation",
                category: 'legal',
                date: new Date().toISOString(),
                content: {
                    overview: "3M Combat Arms earplugs were issued to military personnel between 2003 and 2015. Veterans allege the earplugs were defective and failed to protect their hearing, leading to hearing loss and tinnitus.",
                    symptoms: [
                        "Hearing loss in one or both ears",
                        "Ringing or buzzing in the ears (tinnitus)",
                        "Difficulty understanding speech",
                        "Sensitivity to loud noises",
                        "Balance problems and dizziness"
                    ],
                    causes: [
                        "Defective design of the earplugs",
                        "Failure to properly seal the ear canal",
                        "Inadequate noise reduction",
                        "Manufacturing defects"
                    ],
                    treatments: [
                        "Hearing aids and cochlear implants",
                        "Tinnitus management therapy",
                        "Cognitive behavioral therapy",
                        "Sound therapy and masking devices"
                    ],
                    legalOptions: [
                        "Product liability lawsuits against 3M",
                        "Veterans' disability benefits",
                        "Class action lawsuits",
                        "Settlement fund claims"
                    ],
                    settlements: "3M has agreed to pay $6 billion to settle approximately 260,000 earplug lawsuits. Individual settlements average around $24,000, with some cases reaching $100,000 or more depending on the severity of hearing damage."
                },
                source: 'fallback'
            },
            {
                id: 4,
                title: "Silicosis and Silica Dust Exposure",
                description: "Information about silicosis, a lung disease caused by exposure to silica dust in construction and manufacturing.",
                slug: "silicosis-silica-dust-exposure",
                category: 'medical',
                date: new Date().toISOString(),
                content: {
                    overview: "Silicosis is a progressive lung disease caused by inhaling crystalline silica dust. It commonly affects workers in construction, mining, manufacturing, and other industries where silica dust is present.",
                    symptoms: [
                        "Shortness of breath and chest pain",
                        "Persistent cough and fatigue",
                        "Weight loss and loss of appetite",
                        "Fever and night sweats",
                        "Cyanosis (bluish skin color)"
                    ],
                    causes: [
                        "Exposure to silica dust in construction",
                        "Mining and quarrying operations",
                        "Manufacturing of glass, ceramics, and stone products",
                        "Sandblasting and abrasive blasting",
                        "Tunnel construction and drilling"
                    ],
                    treatments: [
                        "Oxygen therapy and pulmonary rehabilitation",
                        "Medications to reduce inflammation",
                        "Lung transplantation in severe cases",
                        "Prevention of further exposure"
                    ],
                    legalOptions: [
                        "Workers' compensation claims",
                        "Personal injury lawsuits against employers",
                        "Product liability claims against equipment manufacturers",
                        "Class action lawsuits"
                    ],
                    settlements: "Silicosis settlements vary widely based on the severity of the disease and jurisdiction. Typical settlements range from $50,000 to $500,000, with some cases reaching $1 million or more for severe cases."
                },
                source: 'fallback'
            },
            {
                id: 5,
                title: "Talcum Powder Ovarian Cancer Lawsuits",
                description: "Information about talcum powder lawsuits alleging the product causes ovarian cancer in women.",
                slug: "talcum-powder-ovarian-cancer-lawsuits",
                category: 'legal',
                date: new Date().toISOString(),
                content: {
                    overview: "Talcum powder lawsuits allege that Johnson & Johnson's talc-based products, including Baby Powder and Shower to Shower, contain asbestos and cause ovarian cancer in women who used them for feminine hygiene.",
                    symptoms: [
                        "Abdominal bloating and pain",
                        "Pelvic pain and pressure",
                        "Changes in bowel habits",
                        "Frequent urination",
                        "Unexplained weight loss"
                    ],
                    causes: [
                        "Long-term use of talcum powder for feminine hygiene",
                        "Asbestos contamination in talc products",
                        "Inhalation of talc particles",
                        "Application to genital area"
                    ],
                    treatments: [
                        "Surgery to remove ovaries and fallopian tubes",
                        "Chemotherapy and radiation therapy",
                        "Targeted therapy and immunotherapy",
                        "Hormone therapy"
                    ],
                    legalOptions: [
                        "Product liability lawsuits against Johnson & Johnson",
                        "Wrongful death claims",
                        "Class action lawsuits",
                        "Settlement fund claims"
                    ],
                    settlements: "Johnson & Johnson has faced thousands of talcum powder lawsuits. Individual settlements have ranged from $100,000 to $100 million, with some jury verdicts exceeding $4 billion. The company has set aside billions for settlements."
                },
                source: 'fallback'
            },
            {
                id: 6,
                title: "Paraquat Parkinson's Disease Lawsuits",
                description: "Information about Paraquat lawsuits alleging the herbicide causes Parkinson's disease in agricultural workers.",
                slug: "paraquat-parkinsons-disease-lawsuits",
                category: 'legal',
                date: new Date().toISOString(),
                content: {
                    overview: "Paraquat is a highly toxic herbicide used in agriculture. Studies have linked Paraquat exposure to an increased risk of Parkinson's disease, leading to thousands of lawsuits against manufacturers.",
                    symptoms: [
                        "Tremors in hands, arms, legs, or jaw",
                        "Slowed movement and stiffness",
                        "Balance problems and falls",
                        "Speech and swallowing difficulties",
                        "Cognitive changes and depression"
                    ],
                    causes: [
                        "Direct exposure during application",
                        "Inhalation of Paraquat spray",
                        "Skin contact with contaminated surfaces",
                        "Accidental ingestion or exposure"
                    ],
                    treatments: [
                        "Medications to manage symptoms",
                        "Deep brain stimulation",
                        "Physical and occupational therapy",
                        "Speech therapy and dietary changes"
                    ],
                    legalOptions: [
                        "Product liability lawsuits against manufacturers",
                        "Workers' compensation claims",
                        "Class action lawsuits",
                        "Wrongful death claims"
                    ],
                    settlements: "Paraquat lawsuits are still in early stages, but settlements are expected to range from $100,000 to $1 million or more, depending on the severity of Parkinson's symptoms and exposure history."
                },
                source: 'fallback'
            }
        ];
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }
} 