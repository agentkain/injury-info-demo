#!/usr/bin/env node

/**
 * Injury Info MCP Server
 * Specialized server for searching medical information, law firms, and legal cases
 * related to injuries, diseases, and manufacturer negligence
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InjuryInfoMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'injury-info-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // In a real implementation, you'd connect to your actual database
    // For now, I'll create mock data structures to demonstrate the concept
    this.mockDatabase = this.initializeMockData();
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  initializeMockData() {
    return {
      diseases: [
        {
          id: 1,
          name: "Mesothelioma",
          category: "Cancer",
          description: "A rare cancer that affects the lining of the lungs, heart, or abdomen.",
          causes: ["Asbestos exposure"],
          symptoms: ["Chest pain", "Shortness of breath", "Persistent cough"],
          manufacturers: ["Johns Manville", "Owens Corning", "3M"],
          averageSettlement: "$1.2M - $2.4M",
          latencyPeriod: "20-50 years"
        },
        {
          id: 2,
          name: "Silicosis",
          category: "Lung Disease",
          description: "A lung disease caused by inhaling crystalline silica dust.",
          causes: ["Silica dust exposure in construction, mining"],
          symptoms: ["Cough", "Shortness of breath", "Chest tightness"],
          manufacturers: ["Various construction companies"],
          averageSettlement: "$500K - $1.5M",
          latencyPeriod: "10-30 years"
        }
      ],
      lawFirms: [
        {
          id: 1,
          name: "Mesothelioma Law Firm",
          specialties: ["Asbestos litigation", "Mesothelioma cases"],
          location: "New York, NY",
          experience: "25+ years",
          successRate: "95%",
          contact: "1-800-MESO-LAW",
          notableSettlements: ["$2.5M Johnson case", "$1.8M Smith settlement"]
        },
        {
          id: 2,
          name: "Industrial Injury Attorneys",
          specialties: ["Workplace injuries", "Product liability"],
          location: "Chicago, IL",
          experience: "30+ years", 
          successRate: "92%",
          contact: "1-800-INJURY-LAW",
          notableSettlements: ["$3.2M Factory accident", "$1.1M Silicosis case"]
        }
      ],
      manufacturerCases: [
        {
          id: 1,
          manufacturer: "Johns Manville",
          product: "Asbestos insulation",
          allegation: "Failed to warn about asbestos dangers",
          status: "Settled",
          totalSettlements: "$2.5B",
          casesCount: 8500
        }
      ]
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_diseases',
            description: 'Search for medical information about diseases, injuries, and conditions',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Disease name or symptom to search for',
                },
                category: {
                  type: 'string',
                  description: 'Optional: Filter by category (Cancer, Lung Disease, etc.)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'find_law_firms',
            description: 'Find law firms specializing in specific types of injury cases',
            inputSchema: {
              type: 'object',
              properties: {
                specialty: {
                  type: 'string',
                  description: 'Type of case (e.g., "asbestos", "mesothelioma", "workplace injury")',
                },
                location: {
                  type: 'string',
                  description: 'Optional: Preferred location or state',
                },
              },
              required: ['specialty'],
            },
          },
          {
            name: 'manufacturer_negligence',
            description: 'Search for information about manufacturer negligence cases',
            inputSchema: {
              type: 'object',
              properties: {
                manufacturer: {
                  type: 'string',
                  description: 'Name of manufacturer to search for',
                },
                product: {
                  type: 'string',
                  description: 'Optional: Specific product involved',
                },
              },
              required: ['manufacturer'],
            },
          },
          {
            name: 'settlement_calculator',
            description: 'Get estimated settlement ranges for specific conditions',
            inputSchema: {
              type: 'object',
              properties: {
                condition: {
                  type: 'string',
                  description: 'Medical condition or injury type',
                },
                severity: {
                  type: 'string',
                  description: 'Severity level (mild, moderate, severe)',
                },
                exposureYears: {
                  type: 'number',
                  description: 'Years of exposure to harmful substance',
                },
              },
              required: ['condition'],
            },
          },
          {
            name: 'legal_timeline',
            description: 'Get information about legal timelines and statute of limitations',
            inputSchema: {
              type: 'object',
              properties: {
                state: {
                  type: 'string',
                  description: 'State where the case would be filed',
                },
                injuryType: {
                  type: 'string',
                  description: 'Type of injury or condition',
                },
              },
              required: ['state', 'injuryType'],
            },
          },
          {
            name: 'comprehensive_report',
            description: 'Generate a comprehensive report about a specific condition including medical info, legal options, and potential settlements',
            inputSchema: {
              type: 'object',
              properties: {
                condition: {
                  type: 'string',
                  description: 'Medical condition to generate report for',
                },
                userLocation: {
                  type: 'string',
                  description: 'User\'s location for localized law firm recommendations',
                },
              },
              required: ['condition'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_diseases':
            return await this.handleSearchDiseases(args.query, args.category);

          case 'find_law_firms':
            return await this.handleFindLawFirms(args.specialty, args.location);

          case 'manufacturer_negligence':
            return await this.handleManufacturerNegligence(args.manufacturer, args.product);

          case 'settlement_calculator':
            return await this.handleSettlementCalculator(args.condition, args.severity, args.exposureYears);

          case 'legal_timeline':
            return await this.handleLegalTimeline(args.state, args.injuryType);

          case 'comprehensive_report':
            return await this.handleComprehensiveReport(args.condition, args.userLocation);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async handleSearchDiseases(query, category) {
    const results = this.mockDatabase.diseases.filter(disease => {
      const matchesQuery = disease.name.toLowerCase().includes(query.toLowerCase()) ||
                          disease.description.toLowerCase().includes(query.toLowerCase()) ||
                          disease.symptoms.some(symptom => 
                            symptom.toLowerCase().includes(query.toLowerCase())
                          );
      
      const matchesCategory = !category || disease.category.toLowerCase() === category.toLowerCase();
      
      return matchesQuery && matchesCategory;
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No diseases found matching "${query}"${category ? ` in category "${category}"` : ''}.`,
          },
        ],
      };
    }

    const formatted = results.map(disease => `
**${disease.name}** (${disease.category})
Description: ${disease.description}

Symptoms: ${disease.symptoms.join(', ')}
Common Causes: ${disease.causes.join(', ')}
Average Settlement Range: ${disease.averageSettlement}
Latency Period: ${disease.latencyPeriod}
Associated Manufacturers: ${disease.manufacturers.join(', ')}
`).join('\n---\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} result(s) for "${query}":\n\n${formatted}`,
        },
      ],
    };
  }

  async handleFindLawFirms(specialty, location) {
    const results = this.mockDatabase.lawFirms.filter(firm => {
      const matchesSpecialty = firm.specialties.some(spec => 
        spec.toLowerCase().includes(specialty.toLowerCase())
      );
      
      const matchesLocation = !location || 
        firm.location.toLowerCase().includes(location.toLowerCase());
      
      return matchesSpecialty && matchesLocation;
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No law firms found specializing in "${specialty}"${location ? ` in "${location}"` : ''}.`,
          },
        ],
      };
    }

    const formatted = results.map(firm => `
**${firm.name}**
Location: ${firm.location}
Specialties: ${firm.specialties.join(', ')}
Experience: ${firm.experience}
Success Rate: ${firm.successRate}
Contact: ${firm.contact}
Notable Settlements: ${firm.notableSettlements.join(', ')}
`).join('\n---\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} law firm(s) specializing in "${specialty}":\n\n${formatted}`,
        },
      ],
    };
  }

  async handleManufacturerNegligence(manufacturer, product) {
    const results = this.mockDatabase.manufacturerCases.filter(case_ => {
      const matchesManufacturer = case_.manufacturer.toLowerCase().includes(manufacturer.toLowerCase());
      const matchesProduct = !product || 
        case_.product.toLowerCase().includes(product.toLowerCase());
      
      return matchesManufacturer && matchesProduct;
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No negligence cases found for manufacturer "${manufacturer}"${product ? ` involving "${product}"` : ''}.`,
          },
        ],
      };
    }

    const formatted = results.map(case_ => `
**${case_.manufacturer}** - ${case_.product}
Allegation: ${case_.allegation}
Status: ${case_.status}
Total Cases: ${case_.casesCount.toLocaleString()}
Total Settlements: ${case_.totalSettlements}
`).join('\n---\n');

    return {
      content: [
        {
          type: 'text',
          text: `Manufacturer negligence information:\n\n${formatted}`,
        },
      ],
    };
  }

  async handleSettlementCalculator(condition, severity = 'moderate', exposureYears = 10) {
    // In a real implementation, this would use actual settlement data and algorithms
    const baseRanges = {
      'mesothelioma': { min: 1200000, max: 2400000 },
      'silicosis': { min: 500000, max: 1500000 },
      'asbestosis': { min: 300000, max: 800000 },
    };

    const severityMultipliers = {
      'mild': 0.7,
      'moderate': 1.0,
      'severe': 1.5
    };

    const exposureMultiplier = Math.min(1.5, 1 + (exposureYears - 5) * 0.05);

    const conditionKey = condition.toLowerCase();
    const baseRange = baseRanges[conditionKey] || { min: 100000, max: 500000 };
    
    const severityMult = severityMultipliers[severity.toLowerCase()] || 1.0;
    
    const adjustedMin = Math.round(baseRange.min * severityMult * exposureMultiplier);
    const adjustedMax = Math.round(baseRange.max * severityMult * exposureMultiplier);

    return {
      content: [
        {
          type: 'text',
          text: `Settlement Estimate for ${condition}:\n\n` +
                `Condition: ${condition}\n` +
                `Severity: ${severity}\n` +
                `Exposure Years: ${exposureYears}\n\n` +
                `**Estimated Settlement Range: $${adjustedMin.toLocaleString()} - $${adjustedMax.toLocaleString()}**\n\n` +
                `*Note: This is an estimate based on historical data. Actual settlements vary based on many factors including age, income, medical expenses, and specific circumstances.*`,
        },
      ],
    };
  }

  async handleLegalTimeline(state, injuryType) {
    // Mock statute of limitations data
    const statutes = {
      'california': { personal: 2, discovery: 1 },
      'new york': { personal: 3, discovery: 3 },
      'texas': { personal: 2, discovery: 2 },
      'florida': { personal: 4, discovery: 2 }
    };

    const stateKey = state.toLowerCase();
    const statute = statutes[stateKey] || { personal: 2, discovery: 1 };

    return {
      content: [
        {
          type: 'text',
          text: `Legal Timeline for ${injuryType} in ${state}:\n\n` +
                `**Statute of Limitations:**\n` +
                `• Personal Injury: ${statute.personal} years from date of injury\n` +
                `• Discovery Rule: ${statute.discovery} year(s) from discovery of injury\n\n` +
                `**Typical Case Timeline:**\n` +
                `• Initial Consultation: Immediate\n` +
                `• Case Investigation: 2-6 months\n` +
                `• Filing Lawsuit: 6-12 months\n` +
                `• Discovery Phase: 12-18 months\n` +
                `• Settlement/Trial: 18-36 months\n\n` +
                `*Important: Don't delay! Contact an attorney immediately to protect your rights.*`,
        },
      ],
    };
  }

  async handleComprehensiveReport(condition, userLocation) {
    const diseaseInfo = await this.handleSearchDiseases(condition);
    const lawFirms = await this.handleFindLawFirms(condition, userLocation);
    const settlement = await this.handleSettlementCalculator(condition);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Comprehensive Report: ${condition}\n\n` +
                `## Medical Information\n${diseaseInfo.content[0].text}\n\n` +
                `## Legal Representation\n${lawFirms.content[0].text}\n\n` +
                `## Settlement Information\n${settlement.content[0].text}\n\n` +
                `## Next Steps\n` +
                `1. Consult with a qualified attorney immediately\n` +
                `2. Gather all medical records and documentation\n` +
                `3. Document exposure history and timeline\n` +
                `4. Get a thorough medical evaluation\n` +
                `5. File your claim before the statute of limitations expires\n\n` +
                `*This report is for informational purposes only and does not constitute legal or medical advice.*`,
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[Injury Info MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Injury Info MCP Server running on stdio');
  }
}

// Start the server
const server = new InjuryInfoMcpServer();
server.run().catch((error) => {
  console.error('Failed to start Injury Info server:', error);
  process.exit(1);
}); 