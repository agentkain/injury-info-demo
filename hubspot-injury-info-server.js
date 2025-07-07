#!/usr/bin/env node

/**
 * HubSpot Injury Info MCP Server
 * Specialized server for Injury Info website built on HubSpot platform
 * Integrates with HubSpot CMS, CRM, custom objects, and Google Sheets
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { HubSpotInjuryInfoConnector } from './hubspot-connector.js';
import { GoogleSheetsConnector } from './google-sheets-connector.js';

class HubSpotInjuryInfoMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hubspot-injury-info-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize HubSpot connector
    this.hubspot = new HubSpotInjuryInfoConnector({
      hubspotApiKey: process.env.HUBSPOT_API_KEY,
      hubspotPortalId: process.env.HUBSPOT_PORTAL_ID
    });
    
    // Initialize Google Sheets connector
    this.googleSheets = new GoogleSheetsConnector({
      apiKey: process.env.GOOGLE_API_KEY,
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
    });
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_diseases',
            description: 'Search for medical information about diseases and conditions from HubSpot CMS',
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
            description: 'Find law firms from HubSpot CRM specializing in specific injury cases',
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
            description: 'Search manufacturer negligence cases from HubSpot custom objects',
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
            description: 'Calculate settlement estimates using HubSpot settlement data',
            inputSchema: {
              type: 'object',
              properties: {
                condition: {
                  type: 'string',
                  description: 'Medical condition or injury type',
                },
                severity: {
                  type: 'string',
                  description: 'Severity level (mild, moderate, severe, terminal)',
                },
                exposureYears: {
                  type: 'number',
                  description: 'Years of exposure to harmful substance',
                },
                state: {
                  type: 'string',
                  description: 'State for jurisdiction-specific calculations',
                },
              },
              required: ['condition'],
            },
          },
          {
            name: 'legal_timeline',
            description: 'Get legal timeline information from HubSpot content',
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
            description: 'Generate comprehensive reports using all HubSpot data sources',
            inputSchema: {
              type: 'object',
              properties: {
                condition: {
                  type: 'string',
                  description: 'Medical condition to generate report for',
                },
                userLocation: {
                  type: 'string',
                  description: 'User\'s location for localized recommendations',
                },
                userEmail: {
                  type: 'string',
                  description: 'Optional: User email for lead tracking in HubSpot',
                },
                userName: {
                  type: 'string',
                  description: 'Optional: User name for personalization',
                },
              },
              required: ['condition'],
            },
          },
          {
            name: 'track_user_interaction',
            description: 'Track user interactions and create leads in HubSpot CRM',
            inputSchema: {
              type: 'object',
              properties: {
                userEmail: {
                  type: 'string',
                  description: 'User\'s email address',
                },
                userName: {
                  type: 'string',
                  description: 'User\'s full name',
                },
                condition: {
                  type: 'string',
                  description: 'Condition they inquired about',
                },
                location: {
                  type: 'string',
                  description: 'User\'s location',
                },
                interactionType: {
                  type: 'string',
                  description: 'Type of interaction (search, calculator, report)',
                },
              },
              required: ['userEmail', 'condition'],
            },
          },
          // Google Sheets Integration Tools
          {
            name: 'sync_google_sheets',
            description: 'Sync data from Google Sheets to HubSpot CRM',
            inputSchema: {
              type: 'object',
              properties: {
                sheetName: {
                  type: 'string',
                  description: 'Name of the sheet to sync (Law Firms, Manufacturer Cases, Medical Information)',
                },
                syncType: {
                  type: 'string',
                  description: 'Type of sync: full, incremental, or test',
                  enum: ['full', 'incremental', 'test'],
                },
              },
              required: ['sheetName'],
            },
          },
          {
            name: 'query_google_sheets',
            description: 'Query data directly from Google Sheets',
            inputSchema: {
              type: 'object',
              properties: {
                sheetName: {
                  type: 'string',
                  description: 'Name of the sheet to query',
                },
                query: {
                  type: 'string',
                  description: 'Search query to filter results',
                },
                column: {
                  type: 'string',
                  description: 'Optional: Specific column to search in',
                },
                limit: {
                  type: 'number',
                  description: 'Optional: Maximum number of results to return',
                },
              },
              required: ['sheetName', 'query'],
            },
          },
          {
            name: 'get_sheet_statistics',
            description: 'Get statistics and summary of Google Sheets data',
            inputSchema: {
              type: 'object',
              properties: {
                sheetName: {
                  type: 'string',
                  description: 'Name of the sheet to analyze',
                },
              },
              required: ['sheetName'],
            },
          },
          {
            name: 'compare_sheets_hubspot',
            description: 'Compare data between Google Sheets and HubSpot to identify discrepancies',
            inputSchema: {
              type: 'object',
              properties: {
                sheetName: {
                  type: 'string',
                  description: 'Name of the Google Sheet to compare',
                },
                hubspotObject: {
                  type: 'string',
                  description: 'HubSpot object type to compare against (companies, contacts, etc.)',
                },
              },
              required: ['sheetName', 'hubspotObject'],
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
            return await this.handleSettlementCalculator(args.condition, args.severity, args.exposureYears, args.state);
          case 'legal_timeline':
            return await this.handleLegalTimeline(args.state, args.injuryType);
          case 'comprehensive_report':
            return await this.handleComprehensiveReport(args.condition, args.userLocation, args.userEmail, args.userName);
          case 'track_user_interaction':
            return await this.handleTrackUserInteraction(args);
          // Google Sheets tools
          case 'sync_google_sheets':
            return await this.handleSyncGoogleSheets(args.sheetName, args.syncType);
          case 'query_google_sheets':
            return await this.handleQueryGoogleSheets(args.sheetName, args.query, args.column, args.limit);
          case 'get_sheet_statistics':
            return await this.handleGetSheetStatistics(args.sheetName);
          case 'compare_sheets_hubspot':
            return await this.handleCompareSheetsHubSpot(args.sheetName, args.hubspotObject);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Tool '${name}' not found`
            );
        }
      } catch (error) {
        console.error(`Error handling tool '${name}':`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool '${name}': ${error.message}`
        );
      }
    });
  }

  async handleSearchDiseases(query, category) {
    try {
      const results = await this.hubspot.searchDiseases(query, category);
      
      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No diseases found matching "${query}"${category ? ` in category "${category}"` : ''} in HubSpot CMS.`,
            },
          ],
        };
      }

      const formatted = results.map(disease => `
**${disease.name}** ${disease.category ? `(${disease.category})` : ''}
${disease.description}

${disease.symptoms.length > 0 ? `Symptoms: ${disease.symptoms.join(', ')}` : ''}
${disease.causes.length > 0 ? `Causes: ${disease.causes.join(', ')}` : ''}
${disease.manufacturers.length > 0 ? `Related Manufacturers: ${disease.manufacturers.join(', ')}` : ''}

Last Updated: ${new Date(disease.lastUpdated).toLocaleDateString()}
Source: ${disease.url}
`).join('\n---\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${results.length} result(s) for "${query}" in HubSpot:\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot disease search failed: ${error.message}`
      );
    }
  }

  async handleFindLawFirms(specialty, location) {
    try {
      const results = await this.hubspot.findLawFirms(specialty, location);
      
      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No law firms found in HubSpot CRM specializing in "${specialty}"${location ? ` in "${location}"` : ''}.`,
            },
          ],
        };
      }

      const formatted = results.map(firm => `
**${firm.name}**
Location: ${firm.location}
Specialties: ${firm.specialties.join(', ')}
Experience: ${firm.experience} years
Success Rate: ${firm.successRate}%
Contact: ${firm.phone}
Website: ${firm.website}
${firm.notableSettlements.length > 0 ? `Notable Settlements: ${firm.notableSettlements.join(', ')}` : ''}
`).join('\n---\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${results.length} law firm(s) in HubSpot CRM specializing in "${specialty}":\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot law firm search failed: ${error.message}`
      );
    }
  }

  async handleManufacturerNegligence(manufacturer, product) {
    try {
      const results = await this.hubspot.getManufacturerCases(manufacturer, product);
      
      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No negligence cases found in HubSpot for manufacturer "${manufacturer}"${product ? ` involving "${product}"` : ''}.`,
            },
          ],
        };
      }

      const formatted = results.map(case_ => `
**${case_.manufacturer}** - ${case_.product}
Allegation: ${case_.allegation}
Status: ${case_.status}
Total Cases: ${case_.totalCases?.toLocaleString() || 'N/A'}
Total Settlements: ${case_.totalSettlements || 'N/A'}
Settlement Range: $${case_.settlementRange?.min?.toLocaleString()} - $${case_.settlementRange?.max?.toLocaleString()}
`).join('\n---\n');

      return {
        content: [
          {
            type: 'text',
            text: `Manufacturer negligence information from HubSpot:\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot manufacturer case search failed: ${error.message}`
      );
    }
  }

  async handleSettlementCalculator(condition, severity = 'moderate', exposureYears = 10, state = null) {
    try {
      // Get settlement data from HubSpot
      const settlementData = await this.hubspot.getSettlementData(condition, state);
      
      const severityMultipliers = settlementData.severityMultipliers || {
        'mild': 0.7,
        'moderate': 1.0,
        'severe': 1.5,
        'terminal': 2.0
      };

      const exposureMultiplier = Math.min(1.5, 1 + (exposureYears - 5) * 0.05);
      const stateMultiplier = settlementData.stateMultiplier || 1.0;
      const severityMult = severityMultipliers[severity.toLowerCase()] || 1.0;
      
      const adjustedMin = Math.round(settlementData.min * severityMult * exposureMultiplier * stateMultiplier);
      const adjustedMax = Math.round(settlementData.max * severityMult * exposureMultiplier * stateMultiplier);

      return {
        content: [
          {
            type: 'text',
            text: `Settlement Estimate for ${condition} (HubSpot Data):\n\n` +
                  `Condition: ${condition}\n` +
                  `Severity: ${severity}\n` +
                  `Exposure Years: ${exposureYears}\n` +
                  `${state ? `State: ${state}\n` : ''}` +
                  `\n**Estimated Settlement Range: $${adjustedMin.toLocaleString()} - $${adjustedMax.toLocaleString()}**\n\n` +
                  `*Calculation based on HubSpot historical data. Actual settlements vary based on many factors including age, income, medical expenses, and specific circumstances.*`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot settlement calculation failed: ${error.message}`
      );
    }
  }

  async handleLegalTimeline(state, injuryType) {
    try {
      const timeline = await this.hubspot.getLegalTimeline(state, injuryType);
      
      return {
        content: [
          {
            type: 'text',
            text: `Legal Timeline for ${injuryType} in ${state} (HubSpot Data):\n\n` +
                  `**Statute of Limitations:**\n` +
                  `• Personal Injury: ${timeline.statuteOfLimitations.personal} years from date of injury\n` +
                  `• Discovery Rule: ${timeline.statuteOfLimitations.discovery} year(s) from discovery of injury\n\n` +
                  `**Typical Case Timeline:**\n` +
                  `• Initial Consultation: Immediate\n` +
                  `• Case Investigation: ${timeline.typicalTimeline.investigation} months\n` +
                  `• Filing Lawsuit: ${timeline.typicalTimeline.filing} months\n` +
                  `• Discovery Phase: ${timeline.typicalTimeline.discovery} months\n` +
                  `• Settlement/Trial: ${timeline.typicalTimeline.settlement} months\n\n` +
                  `${timeline.sourceUrl ? `Source: ${timeline.sourceUrl}\n\n` : ''}` +
                  `*Important: Don't delay! Contact an attorney immediately to protect your rights.*`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot legal timeline lookup failed: ${error.message}`
      );
    }
  }

  async handleComprehensiveReport(condition, userLocation, userEmail, userName) {
    try {
      // Gather data from multiple HubSpot sources
      const [diseaseInfo, lawFirms, settlement, timeline] = await Promise.all([
        this.handleSearchDiseases(condition),
        this.handleFindLawFirms(condition, userLocation),
        this.handleSettlementCalculator(condition, 'moderate', 10, userLocation),
        userLocation ? this.handleLegalTimeline(userLocation, condition) : null
      ]);

      // Track this interaction in HubSpot if user details provided
      if (userEmail) {
        await this.hubspot.trackUserInteraction(
          { email: userEmail, firstName: userName },
          { condition, location: userLocation, settlementRequested: true }
        );
      }

      const report = `# Comprehensive ${condition} Report (HubSpot Data)
${userName ? `\nPrepared for: ${userName}` : ''}
${userLocation ? `Location: ${userLocation}` : ''}
Report Generated: ${new Date().toLocaleDateString()}

## Medical Information
${diseaseInfo.content[0].text}

## Legal Representation
${lawFirms.content[0].text}

## Settlement Information
${settlement.content[0].text}

${timeline ? `## Legal Timeline\n${timeline.content[0].text}` : ''}

## Next Steps
1. **Consult with a qualified attorney immediately**
2. **Gather all medical records and documentation**
3. **Document exposure history and timeline**
4. **Get a thorough medical evaluation**
5. **File your claim before the statute of limitations expires**

## Important Disclaimers
- This report is for informational purposes only
- Does not constitute legal or medical advice
- Data sourced from HubSpot CMS and CRM
- Consult with qualified professionals for specific guidance

---
*Report generated by Injury Info AI Assistant powered by HubSpot data*`;

      return {
        content: [
          {
            type: 'text',
            text: report,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot comprehensive report generation failed: ${error.message}`
      );
    }
  }

  async handleTrackUserInteraction(args) {
    try {
      await this.hubspot.trackUserInteraction(
        {
          email: args.userEmail,
          firstName: args.userName?.split(' ')[0],
          lastName: args.userName?.split(' ').slice(1).join(' ')
        },
        {
          condition: args.condition,
          location: args.location,
          interactionType: args.interactionType,
          timestamp: new Date().toISOString()
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `User interaction successfully tracked in HubSpot CRM:\n\n` +
                  `User: ${args.userName || 'Anonymous'}\n` +
                  `Email: ${args.userEmail}\n` +
                  `Condition: ${args.condition}\n` +
                  `Location: ${args.location || 'Not specified'}\n` +
                  `Interaction: ${args.interactionType}\n` +
                  `Time: ${new Date().toLocaleString()}\n\n` +
                  `This lead has been added to your HubSpot CRM for follow-up.`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `HubSpot lead tracking failed: ${error.message}`
      );
    }
  }

  async handleSyncGoogleSheets(sheetName, syncType = 'full') {
    try {
      console.log(`🔄 Starting Google Sheets sync: ${sheetName} (${syncType})`);
      
      const result = await this.googleSheets.syncToHubSpot(sheetName, this.hubspot, syncType);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Google Sheets Sync Complete!\n\n` +
                  `Sheet: ${sheetName}\n` +
                  `Sync Type: ${syncType}\n` +
                  `Records Synced: ${result.synced}\n` +
                  `Errors: ${result.errors}\n` +
                  `Total Records: ${result.total}\n\n` +
                  `Success Rate: ${Math.round((result.synced / result.total) * 100)}%\n\n` +
                  `Your HubSpot portal has been updated with the latest data from Google Sheets.`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Google Sheets sync failed: ${error.message}`
      );
    }
  }

  async handleQueryGoogleSheets(sheetName, query, column = null, limit = 10) {
    try {
      console.log(`🔍 Querying Google Sheets: ${sheetName} for "${query}"`);
      
      const result = await this.googleSheets.searchSheet(sheetName, query, column, limit);
      
      if (result.results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No results found in ${sheetName} for query: "${query}"\n\n` +
                    `Try:\n` +
                    `• Using different keywords\n` +
                    `• Checking spelling\n` +
                    `• Searching in a specific column\n` +
                    `• Expanding your search terms`,
            },
          ],
        };
      }
      
      const resultsText = result.results.map((row, index) => {
        const rowData = Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n  ');
        return `${index + 1}. ${rowData}`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `🔍 Google Sheets Search Results\n\n` +
                  `Sheet: ${sheetName}\n` +
                  `Query: "${query}"\n` +
                  `Column: ${column || 'All columns'}\n` +
                  `Results: ${result.results.length} of ${result.total} total matches\n\n` +
                  `**Found Records:**\n\n${resultsText}\n\n` +
                  `*Showing ${result.results.length} of ${result.total} total matches*`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Google Sheets query failed: ${error.message}`
      );
    }
  }

  async handleGetSheetStatistics(sheetName) {
    try {
      console.log(`📊 Getting statistics for Google Sheet: ${sheetName}`);
      
      const stats = await this.googleSheets.getSheetStatistics(sheetName);
      
      if (stats.totalRows === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📊 Google Sheets Statistics\n\n` +
                    `Sheet: ${sheetName}\n` +
                    `Status: Empty or not found\n\n` +
                    `Please ensure the sheet exists and contains data.`,
            },
          ],
        };
      }
      
      const columnStats = stats.columns.map(col => 
        `• ${col.name}: ${col.totalValues} values (${col.uniqueValues} unique, ${col.emptyCells} empty)`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Google Sheets Statistics\n\n` +
                  `Sheet: ${sheetName}\n` +
                  `Summary: ${stats.summary}\n\n` +
                  `**Column Analysis:**\n${columnStats}\n\n` +
                  `**Data Quality:**\n` +
                  `• Total Rows: ${stats.totalRows}\n` +
                  `• Total Columns: ${stats.totalColumns}\n` +
                  `• Average Completion: ${Math.round((stats.columns.reduce((sum, col) => sum + col.totalValues, 0) / (stats.totalRows * stats.totalColumns)) * 100)}%\n\n` +
                  `*Statistics generated from current sheet data*`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Google Sheets statistics failed: ${error.message}`
      );
    }
  }

  async handleCompareSheetsHubSpot(sheetName, hubspotObject) {
    try {
      console.log(`🔍 Comparing ${sheetName} with HubSpot ${hubspotObject}`);
      
      const comparison = await this.googleSheets.compareWithHubSpot(sheetName, this.hubspot, hubspotObject);
      
      const missingInHubSpot = comparison.missingInHubSpot.length > 0 
        ? `\n**Missing in HubSpot:**\n${comparison.missingInHubSpot.map(item => `• ${item}`).join('\n')}`
        : '\n**All sheet records found in HubSpot**';
        
      const missingInSheet = comparison.missingInSheet.length > 0
        ? `\n**Missing in Sheet:**\n${comparison.missingInSheet.map(item => `• ${item}`).join('\n')}`
        : '\n**All HubSpot records found in sheet**';
      
      return {
        content: [
          {
            type: 'text',
            text: `🔍 Data Comparison Results\n\n` +
                  `Sheet: ${sheetName}\n` +
                  `HubSpot Object: ${hubspotObject}\n\n` +
                  `**Summary:**\n` +
                  `• Sheet Records: ${comparison.sheetCount}\n` +
                  `• HubSpot Records: ${comparison.hubspotCount}\n` +
                  `• Matches: ${comparison.matches.length}\n` +
                  `• Missing in HubSpot: ${comparison.missingInHubSpot.length}\n` +
                  `• Missing in Sheet: ${comparison.missingInSheet.length}\n\n` +
                  `**Matches:**\n${comparison.matches.map(item => `• ${item}`).join('\n')}` +
                  `${missingInHubSpot}` +
                  `${missingInSheet}\n\n` +
                  `**Recommendations:**\n` +
                  `${comparison.missingInHubSpot.length > 0 ? '• Run sync to add missing records to HubSpot\n' : ''}` +
                  `${comparison.missingInSheet.length > 0 ? '• Update Google Sheet with missing HubSpot records\n' : ''}` +
                  `${comparison.matches.length === 0 ? '• Verify data format and identifiers match\n' : ''}` +
                  `• Review and resolve any discrepancies`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Data comparison failed: ${error.message}`
      );
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[HubSpot Injury Info MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HubSpot Injury Info MCP Server running on stdio');
  }
}

// Start the server
const server = new HubSpotInjuryInfoMcpServer();
server.run().catch((error) => {
  console.error('Failed to start HubSpot Injury Info server:', error);
  process.exit(1);
}); 