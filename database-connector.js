/**
 * Database Connector for Injury Info Website
 * This module handles connections to your website's database or API
 */

import fetch from 'node-fetch';

export class InjuryInfoDatabase {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'https://your-injury-info-site.com/api';
    this.databaseType = config.databaseType || 'mysql'; // mysql, postgresql, mongodb, etc.
    this.connectionString = config.connectionString;
    this.apiKey = config.apiKey;
  }

  /**
   * Search for diseases/conditions in your database
   */
  async searchDiseases(query, category = null, limit = 10) {
    try {
      // Option 1: API endpoint
      if (this.apiUrl) {
        const params = new URLSearchParams({
          q: query,
          category: category || '',
          limit: limit.toString()
        });
        
        const response = await fetch(`${this.apiUrl}/diseases/search?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }
        
        return await response.json();
      }
      
      // Option 2: Direct database query (example for MySQL)
      if (this.databaseType === 'mysql') {
        const sql = `
          SELECT 
            d.id,
            d.name,
            d.category,
            d.description,
            d.symptoms,
            d.causes,
            d.average_settlement_min,
            d.average_settlement_max,
            d.latency_period,
            GROUP_CONCAT(m.name) as manufacturers
          FROM diseases d
          LEFT JOIN disease_manufacturers dm ON d.id = dm.disease_id
          LEFT JOIN manufacturers m ON dm.manufacturer_id = m.id
          WHERE d.name LIKE ? OR d.description LIKE ? OR d.symptoms LIKE ?
          ${category ? 'AND d.category = ?' : ''}
          GROUP BY d.id
          LIMIT ?
        `;
        
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];
        if (category) params.push(category);
        params.push(limit);
        
        // Execute query with your database connection
        // return await this.executeQuery(sql, params);
      }
      
      // Fallback to mock data if no connection configured
      return this.getMockDiseases(query, category, limit);
      
    } catch (error) {
      console.error('Database search error:', error);
      throw error;
    }
  }

  /**
   * Find law firms in your database
   */
  async findLawFirms(specialty, location = null, limit = 10) {
    try {
      if (this.apiUrl) {
        const params = new URLSearchParams({
          specialty,
          location: location || '',
          limit: limit.toString()
        });
        
        const response = await fetch(`${this.apiUrl}/law-firms/search?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        return await response.json();
      }
      
      // Direct database query example
      if (this.databaseType === 'mysql') {
        const sql = `
          SELECT 
            lf.id,
            lf.name,
            lf.location,
            lf.experience_years,
            lf.success_rate,
            lf.contact_info,
            GROUP_CONCAT(s.name) as specialties,
            GROUP_CONCAT(ns.case_name) as notable_settlements
          FROM law_firms lf
          LEFT JOIN firm_specialties fs ON lf.id = fs.firm_id
          LEFT JOIN specialties s ON fs.specialty_id = s.id
          LEFT JOIN notable_settlements ns ON lf.id = ns.firm_id
          WHERE s.name LIKE ?
          ${location ? 'AND lf.location LIKE ?' : ''}
          GROUP BY lf.id
          LIMIT ?
        `;
        
        const params = [`%${specialty}%`];
        if (location) params.push(`%${location}%`);
        params.push(limit);
        
        // return await this.executeQuery(sql, params);
      }
      
      return this.getMockLawFirms(specialty, location, limit);
      
    } catch (error) {
      console.error('Law firm search error:', error);
      throw error;
    }
  }

  /**
   * Get manufacturer negligence cases
   */
  async getManufacturerCases(manufacturer, product = null) {
    try {
      if (this.apiUrl) {
        const params = new URLSearchParams({
          manufacturer,
          product: product || ''
        });
        
        const response = await fetch(`${this.apiUrl}/manufacturers/cases?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        return await response.json();
      }
      
      return this.getMockManufacturerCases(manufacturer, product);
      
    } catch (error) {
      console.error('Manufacturer case search error:', error);
      throw error;
    }
  }

  /**
   * Get settlement data for calculations
   */
  async getSettlementData(condition, state = null) {
    try {
      if (this.apiUrl) {
        const params = new URLSearchParams({
          condition,
          state: state || ''
        });
        
        const response = await fetch(`${this.apiUrl}/settlements/data?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        return await response.json();
      }
      
      return this.getMockSettlementData(condition);
      
    } catch (error) {
      console.error('Settlement data error:', error);
      throw error;
    }
  }

  /**
   * Get legal timeline information
   */
  async getLegalTimeline(state, injuryType) {
    try {
      if (this.apiUrl) {
        const params = new URLSearchParams({
          state,
          injury_type: injuryType
        });
        
        const response = await fetch(`${this.apiUrl}/legal/timeline?${params}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        return await response.json();
      }
      
      return this.getMockLegalTimeline(state, injuryType);
      
    } catch (error) {
      console.error('Legal timeline error:', error);
      throw error;
    }
  }

  // Mock data methods (remove these when you have real data)
  getMockDiseases(query, category, limit) {
    const mockData = [
      {
        id: 1,
        name: "Mesothelioma",
        category: "Cancer",
        description: "A rare cancer that affects the lining of the lungs, heart, or abdomen.",
        symptoms: ["Chest pain", "Shortness of breath", "Persistent cough"],
        causes: ["Asbestos exposure"],
        average_settlement_min: 1200000,
        average_settlement_max: 2400000,
        latency_period: "20-50 years",
        manufacturers: ["Johns Manville", "Owens Corning", "3M"]
      },
      {
        id: 2,
        name: "Silicosis",
        category: "Lung Disease", 
        description: "A lung disease caused by inhaling crystalline silica dust.",
        symptoms: ["Cough", "Shortness of breath", "Chest tightness"],
        causes: ["Silica dust exposure in construction, mining"],
        average_settlement_min: 500000,
        average_settlement_max: 1500000,
        latency_period: "10-30 years",
        manufacturers: ["Various construction companies"]
      }
    ];

    return mockData.filter(disease => 
      disease.name.toLowerCase().includes(query.toLowerCase()) ||
      disease.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
  }

  getMockLawFirms(specialty, location, limit) {
    const mockFirms = [
      {
        id: 1,
        name: "Mesothelioma Law Firm",
        location: "New York, NY",
        experience_years: 25,
        success_rate: 95,
        contact_info: "1-800-MESO-LAW",
        specialties: ["Asbestos litigation", "Mesothelioma cases"],
        notable_settlements: ["$2.5M Johnson case", "$1.8M Smith settlement"]
      }
    ];

    return mockFirms.filter(firm => 
      firm.specialties.some(spec => spec.toLowerCase().includes(specialty.toLowerCase()))
    ).slice(0, limit);
  }

  getMockManufacturerCases(manufacturer, product) {
    return [
      {
        id: 1,
        manufacturer: "Johns Manville",
        product: "Asbestos insulation",
        allegation: "Failed to warn about asbestos dangers",
        status: "Settled",
        total_settlements: "$2.5B",
        cases_count: 8500
      }
    ];
  }

  getMockSettlementData(condition) {
    const ranges = {
      'mesothelioma': { min: 1200000, max: 2400000 },
      'silicosis': { min: 500000, max: 1500000 },
      'asbestosis': { min: 300000, max: 800000 }
    };

    return ranges[condition.toLowerCase()] || { min: 100000, max: 500000 };
  }

  getMockLegalTimeline(state, injuryType) {
    const statutes = {
      'california': { personal: 2, discovery: 1 },
      'new york': { personal: 3, discovery: 3 },
      'texas': { personal: 2, discovery: 2 },
      'florida': { personal: 4, discovery: 2 }
    };

    return statutes[state.toLowerCase()] || { personal: 2, discovery: 1 };
  }
}

/**
 * Website scraper for when you need to extract data directly from your website
 */
export class InjuryInfoScraper {
  constructor(baseUrl = 'https://your-injury-info-site.com') {
    this.baseUrl = baseUrl;
  }

  async scrapeDiseaseInfo(diseaseName) {
    try {
      const url = `${this.baseUrl}/diseases/${encodeURIComponent(diseaseName)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Parse HTML to extract disease information
      // You'd use a library like cheerio for this
      // const $ = cheerio.load(html);
      // const diseaseInfo = {
      //   name: $('h1').text(),
      //   description: $('.description').text(),
      //   symptoms: $('.symptoms li').map((i, el) => $(el).text()).get(),
      //   // etc...
      // };
      
      return {
        name: diseaseName,
        description: "Scraped from website",
        // Add more fields as needed
      };
      
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  async scrapeLawFirms(specialty) {
    try {
      const url = `${this.baseUrl}/law-firms?specialty=${encodeURIComponent(specialty)}`;
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse HTML to extract law firm information
      return [
        {
          name: "Scraped Law Firm",
          specialty: specialty,
          // Add more fields
        }
      ];
      
    } catch (error) {
      console.error('Law firm scraping error:', error);
      throw error;
    }
  }
} 