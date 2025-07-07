#!/usr/bin/env node

/**
 * Data Sources Connector for Injury Info MCP Server
 * 
 * This connector integrates multiple data sources:
 * - Public APIs (FDA, Court Records, Medical Databases)
 * - RSS Feeds (Legal News, Settlement Announcements)
 * - Government Databases (EPA, OSHA, Consumer Safety)
 * - Academic Research (PubMed, Legal Journals)
 * - Social Media Monitoring (Twitter, LinkedIn)
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

class DataSourcesConnector {
  constructor() {
    this.cacheDir = './cache';
    this.ensureCacheDir();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.log('Cache directory already exists');
    }
  }

  async getCachedData(key, maxAge = 3600000) { // 1 hour default
    const cacheFile = path.join(this.cacheDir, `${key}.json`);
    try {
      const data = await fs.readFile(cacheFile, 'utf8');
      const parsed = JSON.parse(data);
      
      if (Date.now() - parsed.timestamp < maxAge) {
        return parsed.data;
      }
    } catch (error) {
      // Cache miss or expired
    }
    return null;
  }

  async setCachedData(key, data) {
    const cacheFile = path.join(this.cacheDir, `${key}.json`);
    const cacheData = {
      timestamp: Date.now(),
      data: data
    };
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
  }

  // FDA API Integration
  async getFDARecalls(product = null, limit = 10) {
    const cacheKey = `fda_recalls_${product || 'all'}`;
    const cached = await this.getCachedData(cacheKey, 1800000); // 30 minutes
    if (cached) return cached;

    try {
      let url = 'https://api.fda.gov/drug/enforcement.json?limit=100';
      if (product) {
        url += `&search=product_description:"${encodeURIComponent(product)}"`;
      }

      const response = await fetch(url);
      const data = await response.json();

      const recalls = data.results.map(recall => ({
        product: recall.product_description,
        reason: recall.reason_for_recall,
        date: recall.recall_initiation_date,
        company: recall.recalling_firm,
        classification: recall.classification,
        source: 'FDA'
      })).slice(0, limit);

      await this.setCachedData(cacheKey, recalls);
      return recalls;
    } catch (error) {
      console.error('FDA API error:', error.message);
      return [];
    }
  }

  // Court Records API (example with public court APIs)
  async getCourtCases(state, caseType = null, limit = 10) {
    const cacheKey = `court_cases_${state}_${caseType || 'all'}`;
    const cached = await this.getCachedData(cacheKey, 3600000); // 1 hour
    if (cached) return cached;

    try {
      // Example: Using public court APIs (you'd need to find specific ones)
      const url = `https://api.courts.${state.toLowerCase()}.gov/cases?limit=${limit}`;
      if (caseType) {
        url += `&type=${encodeURIComponent(caseType)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      const cases = data.cases.map(courtCase => ({
        caseNumber: courtCase.case_number,
        title: courtCase.case_title,
        filingDate: courtCase.filing_date,
        status: courtCase.status,
        court: courtCase.court_name,
        source: `${state} Courts`
      }));

      await this.setCachedData(cacheKey, cases);
      return cases;
    } catch (error) {
      console.error('Court API error:', error.message);
      return [];
    }
  }

  // Medical Research API (PubMed)
  async getMedicalResearch(condition, limit = 10) {
    const cacheKey = `medical_research_${condition}`;
    const cached = await this.getCachedData(cacheKey, 7200000); // 2 hours
    if (cached) return cached;

    try {
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(condition)}&retmode=json&retmax=${limit}`;
      
      const response = await fetch(url);
      const data = await response.json();

      const research = data.esearchresult.idlist.map(id => ({
        pmid: id,
        title: `Research on ${condition}`,
        source: 'PubMed',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      }));

      await this.setCachedData(cacheKey, research);
      return research;
    } catch (error) {
      console.error('PubMed API error:', error.message);
      return [];
    }
  }

  // Legal News RSS Feeds
  async getLegalNews(keywords = 'injury lawsuit settlement', limit = 10) {
    const cacheKey = `legal_news_${keywords.replace(/\s+/g, '_')}`;
    const cached = await this.getCachedData(cacheKey, 1800000); // 30 minutes
    if (cached) return cached;

    try {
      // Example RSS feeds (you'd need to find actual legal news RSS feeds)
      const feeds = [
        'https://www.law360.com/rss',
        'https://www.reuters.com/rss/legal',
        'https://www.bloomberg.com/feed/podcast/law.xml'
      ];

      const news = [];
      for (const feedUrl of feeds) {
        try {
          const response = await fetch(feedUrl);
          const xml = await response.text();
          
          // Simple XML parsing (you'd use a proper XML parser)
          const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
          
          items.forEach(item => {
            const title = item.match(/<title>([^<]*)<\/title>/)?.[1];
            const description = item.match(/<description>([^<]*)<\/description>/)?.[1];
            const link = item.match(/<link>([^<]*)<\/link>/)?.[1];
            const pubDate = item.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1];

            if (title && title.toLowerCase().includes(keywords.toLowerCase())) {
              news.push({
                title,
                description,
                link,
                pubDate,
                source: 'Legal News'
              });
            }
          });
        } catch (error) {
          console.warn(`Failed to fetch feed ${feedUrl}:`, error.message);
        }
      }

      const limitedNews = news.slice(0, limit);
      await this.setCachedData(cacheKey, limitedNews);
      return limitedNews;
    } catch (error) {
      console.error('Legal news error:', error.message);
      return [];
    }
  }

  // Government Safety Data
  async getSafetyData(agency = 'CPSC', product = null, limit = 10) {
    const cacheKey = `safety_data_${agency}_${product || 'all'}`;
    const cached = await this.getCachedData(cacheKey, 3600000); // 1 hour
    if (cached) return cached;

    try {
      let url;
      switch (agency.toUpperCase()) {
        case 'CPSC':
          url = 'https://www.saferproducts.gov/api/recalls';
          break;
        case 'EPA':
          url = 'https://www.epa.gov/api/enforcement-actions';
          break;
        case 'OSHA':
          url = 'https://www.osha.gov/api/citations';
          break;
        default:
          throw new Error(`Unknown agency: ${agency}`);
      }

      if (product) {
        url += `?product=${encodeURIComponent(product)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      const safetyData = data.results.map(item => ({
        title: item.title || item.description,
        date: item.date,
        agency: agency,
        severity: item.severity || 'Unknown',
        source: `${agency} Database`
      })).slice(0, limit);

      await this.setCachedData(cacheKey, safetyData);
      return safetyData;
    } catch (error) {
      console.error(`${agency} API error:`, error.message);
      return [];
    }
  }

  // Settlement Database
  async getSettlementData(manufacturer = null, condition = null, limit = 10) {
    const cacheKey = `settlements_${manufacturer || 'all'}_${condition || 'all'}`;
    const cached = await this.getCachedData(cacheKey, 7200000); // 2 hours
    if (cached) return cached;

    try {
      // Example: Using public settlement databases
      const url = 'https://api.settlements.com/v1/cases';
      const params = new URLSearchParams();
      if (manufacturer) params.append('manufacturer', manufacturer);
      if (condition) params.append('condition', condition);
      params.append('limit', limit);

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      const settlements = data.cases.map(settlement => ({
        caseName: settlement.case_name,
        manufacturer: settlement.manufacturer,
        product: settlement.product,
        settlementAmount: settlement.amount,
        date: settlement.date,
        condition: settlement.condition,
        source: 'Settlement Database'
      }));

      await this.setCachedData(cacheKey, settlements);
      return settlements;
    } catch (error) {
      console.error('Settlement API error:', error.message);
      return [];
    }
  }

  // Social Media Monitoring
  async getSocialMediaMentions(keywords, platform = 'twitter', limit = 10) {
    const cacheKey = `social_${platform}_${keywords.replace(/\s+/g, '_')}`;
    const cached = await this.getCachedData(cacheKey, 900000); // 15 minutes
    if (cached) return cached;

    try {
      // Example: Using Twitter API (you'd need proper API keys)
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keywords)}&max_results=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      });
      
      const data = await response.json();

      const mentions = data.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        author: tweet.author_id,
        date: tweet.created_at,
        platform: platform,
        source: 'Social Media'
      }));

      await this.setCachedData(cacheKey, mentions);
      return mentions;
    } catch (error) {
      console.error('Social media API error:', error.message);
      return [];
    }
  }

  // Comprehensive Data Aggregation
  async getComprehensiveData(query, sources = ['fda', 'courts', 'medical', 'news', 'safety']) {
    const results = {};

    for (const source of sources) {
      try {
        switch (source) {
          case 'fda':
            results.fda = await this.getFDARecalls(query);
            break;
          case 'courts':
            results.courts = await this.getCourtCases('california', query);
            break;
          case 'medical':
            results.medical = await this.getMedicalResearch(query);
            break;
          case 'news':
            results.news = await this.getLegalNews(query);
            break;
          case 'safety':
            results.safety = await this.getSafetyData('CPSC', query);
            break;
          case 'settlements':
            results.settlements = await this.getSettlementData(null, query);
            break;
          case 'social':
            results.social = await this.getSocialMediaMentions(query);
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${source} data:`, error.message);
        results[source] = [];
      }
    }

    return results;
  }

  // Data Quality Assessment
  async assessDataQuality(data) {
    const assessment = {
      totalRecords: 0,
      sources: {},
      freshness: {},
      completeness: {}
    };

    for (const [source, records] of Object.entries(data)) {
      assessment.sources[source] = records.length;
      assessment.totalRecords += records.length;
      
      if (records.length > 0) {
        // Check data freshness
        const timestamps = records.map(r => new Date(r.date || r.pubDate || Date.now()));
        const avgAge = timestamps.reduce((sum, ts) => sum + (Date.now() - ts), 0) / timestamps.length;
        assessment.freshness[source] = Math.round(avgAge / (1000 * 60 * 60 * 24)); // days
        
        // Check data completeness
        const fields = Object.keys(records[0]);
        const completeness = fields.map(field => {
          const filled = records.filter(r => r[field] && r[field] !== '').length;
          return { field, percentage: Math.round((filled / records.length) * 100) };
        });
        assessment.completeness[source] = completeness;
      }
    }

    return assessment;
  }
}

// Export for use in MCP server
export { DataSourcesConnector };

// Example usage
async function main() {
  const connector = new DataSourcesConnector();
  
  console.log('🔍 Testing data sources...');
  
  // Test FDA recalls
  const recalls = await connector.getFDARecalls('talcum powder', 5);
  console.log(`Found ${recalls.length} FDA recalls`);
  
  // Test legal news
  const news = await connector.getLegalNews('mesothelioma settlement', 5);
  console.log(`Found ${news.length} legal news articles`);
  
  // Test comprehensive data
  const comprehensive = await connector.getComprehensiveData('asbestos', ['fda', 'news', 'medical']);
  console.log('Comprehensive data:', Object.keys(comprehensive));
  
  // Assess data quality
  const quality = await connector.assessDataQuality(comprehensive);
  console.log('Data quality assessment:', quality);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 