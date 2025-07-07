/**
 * HubSpot Connector for Injury Info Website
 * Integrates with HubSpot's CMS, CRM, and content APIs
 */

import fetch from 'node-fetch';

export class HubSpotInjuryInfoConnector {
  constructor(config = {}) {
    this.hubspotApiKey = config.hubspotApiKey || process.env.HUBSPOT_API_KEY;
    this.hubspotPortalId = config.hubspotPortalId || process.env.HUBSPOT_PORTAL_ID;
    this.baseUrl = 'https://api.hubapi.com';
    this.headers = {
      'Authorization': `Bearer ${this.hubspotApiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Search for disease/condition content in HubSpot CMS
   */
  async searchDiseases(query, category = null, limit = 10) {
    try {
      // Search in HubSpot CMS pages/blog posts about diseases
      const searchUrl = `${this.baseUrl}/cms/v3/pages/search`;
      
      const searchBody = {
        query: query,
        limit: limit,
        contentTypes: ['landing-page', 'website-page', 'blog-post'],
        // Filter by category if provided (you can use HubSpot tags/categories)
        ...(category && { 
          filters: [
            {
              propertyName: 'hs_blog_post_tags',
              operator: 'CONTAINS_TOKEN',
              value: category
            }
          ]
        })
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(searchBody)
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform HubSpot data to our expected format
      return data.results.map(page => ({
        id: page.id,
        name: this.extractDiseaseNameFromTitle(page.name),
        category: this.extractCategoryFromTags(page.tagList),
        description: this.cleanHtmlContent(page.metaDescription || ''),
        url: page.url,
        lastUpdated: page.updatedAt,
        // Extract structured data from page content
        symptoms: this.extractSymptomsFromContent(page.postBody),
        causes: this.extractCausesFromContent(page.postBody),
        manufacturers: this.extractManufacturersFromContent(page.postBody)
      }));

    } catch (error) {
      console.error('HubSpot disease search error:', error);
      throw error;
    }
  }

  /**
   * Find law firms stored in HubSpot CRM as companies
   */
  async findLawFirms(specialty, location = null, limit = 10) {
    try {
      // Search companies in HubSpot CRM with law firm properties
      const searchUrl = `${this.baseUrl}/crm/v3/objects/companies/search`;
      
      const filters = [
        {
          propertyName: 'industry',
          operator: 'EQ',
          value: 'Legal Services'
        },
        {
          propertyName: 'law_firm_specialties', // Custom property you'll create
          operator: 'CONTAINS_TOKEN',
          value: specialty
        }
      ];

      if (location) {
        filters.push({
          propertyName: 'city',
          operator: 'CONTAINS_TOKEN',
          value: location
        });
      }

      const searchBody = {
        filterGroups: [{ filters }],
        properties: [
          'name',
          'city',
          'state',
          'phone',
          'website',
          'law_firm_specialties',
          'years_of_experience',
          'success_rate',
          'notable_settlements'
        ],
        limit: limit
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(searchBody)
      });

      const data = await response.json();

      return data.results.map(company => ({
        id: company.id,
        name: company.properties.name,
        location: `${company.properties.city}, ${company.properties.state}`,
        phone: company.properties.phone,
        website: company.properties.website,
        specialties: company.properties.law_firm_specialties?.split(';') || [],
        experience: company.properties.years_of_experience,
        successRate: company.properties.success_rate,
        notableSettlements: company.properties.notable_settlements?.split(';') || []
      }));

    } catch (error) {
      console.error('HubSpot law firm search error:', error);
      throw error;
    }
  }

  /**
   * Get manufacturer negligence data from HubSpot custom objects
   */
  async getManufacturerCases(manufacturer, product = null) {
    try {
      // Use HubSpot custom objects to store manufacturer case data
      const searchUrl = `${this.baseUrl}/crm/v3/objects/manufacturer_cases/search`;
      
      const filters = [
        {
          propertyName: 'manufacturer_name',
          operator: 'CONTAINS_TOKEN',
          value: manufacturer
        }
      ];

      if (product) {
        filters.push({
          propertyName: 'product_name',
          operator: 'CONTAINS_TOKEN',
          value: product
        });
      }

      const searchBody = {
        filterGroups: [{ filters }],
        properties: [
          'manufacturer_name',
          'product_name',
          'allegation',
          'case_status',
          'total_settlements',
          'total_cases',
          'settlement_range_min',
          'settlement_range_max'
        ],
        limit: 50
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(searchBody)
      });

      const data = await response.json();

      return data.results.map(case_ => ({
        id: case_.id,
        manufacturer: case_.properties.manufacturer_name,
        product: case_.properties.product_name,
        allegation: case_.properties.allegation,
        status: case_.properties.case_status,
        totalSettlements: case_.properties.total_settlements,
        totalCases: case_.properties.total_cases,
        settlementRange: {
          min: case_.properties.settlement_range_min,
          max: case_.properties.settlement_range_max
        }
      }));

    } catch (error) {
      console.error('HubSpot manufacturer case search error:', error);
      throw error;
    }
  }

  /**
   * Get settlement data from HubSpot for calculations
   */
  async getSettlementData(condition, state = null) {
    try {
      // Search for settlement data in HubSpot custom objects or CMS
      const searchUrl = `${this.baseUrl}/crm/v3/objects/settlement_data/search`;
      
      const filters = [
        {
          propertyName: 'condition_name',
          operator: 'EQ',
          value: condition.toLowerCase()
        }
      ];

      if (state) {
        filters.push({
          propertyName: 'applicable_states',
          operator: 'CONTAINS_TOKEN',
          value: state
        });
      }

      const searchBody = {
        filterGroups: [{ filters }],
        properties: [
          'condition_name',
          'base_settlement_min',
          'base_settlement_max',
          'state_multiplier',
          'severity_multipliers',
          'last_updated'
        ],
        limit: 1
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(searchBody)
      });

      const data = await response.json();

      if (data.results.length > 0) {
        const settlement = data.results[0].properties;
        return {
          min: parseInt(settlement.base_settlement_min),
          max: parseInt(settlement.base_settlement_max),
          stateMultiplier: parseFloat(settlement.state_multiplier) || 1.0,
          severityMultipliers: JSON.parse(settlement.severity_multipliers || '{}')
        };
      }

      // Fallback to default ranges if no specific data found
      return this.getDefaultSettlementRanges(condition);

    } catch (error) {
      console.error('HubSpot settlement data error:', error);
      return this.getDefaultSettlementRanges(condition);
    }
  }

  /**
   * Track user interactions and store as HubSpot contacts/interactions
   */
  async trackUserInteraction(userInfo, queryData) {
    try {
      // Create or update contact in HubSpot
      const contactData = {
        properties: {
          email: userInfo.email || `anonymous_${Date.now()}@temp.com`,
          firstname: userInfo.firstName || 'Anonymous',
          lastname: userInfo.lastName || 'User',
          injury_condition_searched: queryData.condition,
          law_firm_location_searched: queryData.location,
          settlement_calculation_requested: queryData.settlementRequested,
          last_interaction_date: new Date().toISOString(),
          lead_source: 'AI Assistant'
        }
      };

      const contactUrl = `${this.baseUrl}/crm/v3/objects/contacts`;
      
      const response = await fetch(contactUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        console.log('User interaction tracked in HubSpot');
      }

    } catch (error) {
      console.error('HubSpot contact tracking error:', error);
    }
  }

  /**
   * Get legal timeline data from HubSpot CMS or custom objects
   */
  async getLegalTimeline(state, injuryType) {
    try {
      // Search for legal timeline content in HubSpot
      const searchUrl = `${this.baseUrl}/cms/v3/pages/search`;
      
      const searchBody = {
        query: `legal timeline ${state} ${injuryType}`,
        limit: 5,
        contentTypes: ['landing-page', 'website-page']
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(searchBody)
      });

      const data = await response.json();

      if (data.results.length > 0) {
        const page = data.results[0];
        return {
          state: state,
          injuryType: injuryType,
          statuteOfLimitations: this.extractStatuteFromContent(page.postBody, state),
          typicalTimeline: this.extractTimelineFromContent(page.postBody),
          sourceUrl: page.url
        };
      }

      // Fallback to default timeline data
      return this.getDefaultLegalTimeline(state, injuryType);

    } catch (error) {
      console.error('HubSpot legal timeline error:', error);
      return this.getDefaultLegalTimeline(state, injuryType);
    }
  }

  // Helper methods for content extraction
  extractDiseaseNameFromTitle(title) {
    // Extract disease name from page title
    return title.replace(/\s*(Information|Guide|Overview)\s*$/i, '').trim();
  }

  extractCategoryFromTags(tags) {
    // Map HubSpot tags to categories
    const categoryMap = {
      'cancer': 'Cancer',
      'lung-disease': 'Lung Disease',
      'occupational-disease': 'Occupational Disease'
    };
    
    for (const tag of tags || []) {
      if (categoryMap[tag.toLowerCase()]) {
        return categoryMap[tag.toLowerCase()];
      }
    }
    return 'Other';
  }

  cleanHtmlContent(html) {
    // Remove HTML tags and clean up content
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  extractSymptomsFromContent(content) {
    // Extract symptoms from structured content
    const symptomsMatch = content.match(/symptoms?[:\s]+([^\.]+)/i);
    return symptomsMatch ? symptomsMatch[1].split(',').map(s => s.trim()) : [];
  }

  extractCausesFromContent(content) {
    // Extract causes from structured content
    const causesMatch = content.match(/causes?[:\s]+([^\.]+)/i);
    return causesMatch ? causesMatch[1].split(',').map(c => c.trim()) : [];
  }

  extractManufacturersFromContent(content) {
    // Extract manufacturer names from content
    const manufacturersMatch = content.match(/manufacturers?[:\s]+([^\.]+)/i);
    return manufacturersMatch ? manufacturersMatch[1].split(',').map(m => m.trim()) : [];
  }

  extractStatuteFromContent(content, state) {
    // Extract statute of limitations from content
    const statutes = {
      'california': { personal: 2, discovery: 1 },
      'new york': { personal: 3, discovery: 3 },
      'texas': { personal: 2, discovery: 2 },
      'florida': { personal: 4, discovery: 2 }
    };
    return statutes[state.toLowerCase()] || { personal: 2, discovery: 1 };
  }

  extractTimelineFromContent(content) {
    // Extract case timeline from content
    return {
      consultation: 0,
      investigation: 3,
      filing: 6,
      discovery: 12,
      settlement: 18
    };
  }

  getDefaultSettlementRanges(condition) {
    const ranges = {
      'mesothelioma': { min: 1200000, max: 2400000 },
      'silicosis': { min: 500000, max: 1500000 },
      'asbestosis': { min: 300000, max: 800000 }
    };
    return ranges[condition.toLowerCase()] || { min: 100000, max: 500000 };
  }

  getDefaultLegalTimeline(state, injuryType) {
    return {
      state: state,
      injuryType: injuryType,
      statuteOfLimitations: { personal: 2, discovery: 1 },
      typicalTimeline: {
        consultation: 0,
        investigation: 3,
        filing: 6,
        discovery: 12,
        settlement: 18
      }
    };
  }
} 