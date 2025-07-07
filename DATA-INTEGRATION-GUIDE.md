# 🎯 Data Integration Guide

## Overview

Your injury information website now uses a centralized data integration system that pulls information from Google Sheets and HubSpot through your MCP connectors. This ensures all content stays up-to-date and can be easily managed through your preferred platforms.

## 🔗 Data Sources

### 1. Google Sheets
- **Medical Conditions** - Disease information, symptoms, causes, treatments
- **Legal Cases** - Case summaries, legal options, settlement amounts
- **Manufacturer Cases** - Product liability cases, company information
- **Law Firms** - Attorney contact info, specialties, success rates
- **Settlements** - Settlement ranges, case statistics

### 2. HubSpot
- **CMS Content** - Blog posts and articles about medical conditions
- **CRM Data** - Law firm information, contact details
- **Custom Objects** - Manufacturer case data, settlement information

## 📊 API Endpoints

### Articles
```bash
# Get all articles
GET /api/articles

# Get specific article by slug
GET /api/articles/mesothelioma-asbestos-exposure
```

### Law Firms
```bash
# Get law firms (optional filters)
GET /api/law-firms?specialty=mesothelioma&location=California
```

### Settlement Data
```bash
# Get settlement information
GET /api/settlements?condition=mesothelioma&state=Texas
```

### Search
```bash
# Comprehensive search for a condition
GET /api/search/mesothelioma
```

### Cache Management
```bash
# Clear cache to refresh data
POST /api/cache/clear
```

## 🛠️ How It Works

### 1. Data Flow
```
Google Sheets + HubSpot → Data Integration Service → Website API → Frontend
```

### 2. Caching
- Data is cached for 5 minutes to improve performance
- Cache can be cleared manually via API
- Fallback data provided if connectors fail

### 3. Error Handling
- Graceful degradation if data sources are unavailable
- Fallback to basic information if needed
- Detailed error logging for troubleshooting

## 📝 Google Sheets Structure

### Medical Conditions Sheet
| Column | Description |
|--------|-------------|
| Condition Name | Name of the medical condition |
| Description | Overview of the condition |
| Symptoms | Common symptoms (comma-separated) |
| Causes | Risk factors and causes |
| Treatments | Treatment options |
| Legal Options | Available legal actions |
| Settlements | Typical settlement ranges |

### Law Firms Sheet
| Column | Description |
|--------|-------------|
| Name | Law firm name |
| Location | City, State |
| Phone | Contact number |
| Website | Firm website |
| Specialties | Areas of expertise |
| Years Experience | Years in practice |
| Success Rate | Success percentage |
| Notable Settlements | Major case results |

### Settlements Sheet
| Column | Description |
|--------|-------------|
| Condition | Medical condition |
| State | Jurisdiction |
| Settlement Range | Typical settlement amounts |
| Average Settlement | Average case value |
| Total Cases | Number of cases |
| Year | Year of data |

## 🔧 Configuration

### Environment Variables
```bash
# HubSpot
HUBSPOT_ACCESS_TOKEN=your-hubspot-token
HUBSPOT_PORTAL_ID=your-portal-id

# Google Sheets
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# OpenAI
OPENAI_API_KEY=your-openai-key
```

### Sheet Names
The system expects these sheet names in your Google Spreadsheet:
- `Medical Conditions`
- `Legal Cases`
- `Manufacturer Cases`
- `Law Firms`
- `Settlements`

## 🚀 Benefits

### 1. Centralized Management
- Update content in Google Sheets or HubSpot
- Changes automatically appear on your website
- No need to edit code for content updates

### 2. Real-time Data
- Live data from your MCP connectors
- Automatic synchronization
- Cached for performance

### 3. Scalability
- Easy to add new data sources
- Modular architecture
- Extensible for future needs

### 4. Reliability
- Fallback data if connectors fail
- Error handling and logging
- Graceful degradation

## 📈 Usage Examples

### Frontend Integration
```javascript
// Fetch articles from data sources
const articles = await fetch('/api/articles').then(r => r.json());

// Search for law firms
const lawFirms = await fetch('/api/law-firms?specialty=mesothelioma').then(r => r.json());

// Get settlement data
const settlements = await fetch('/api/settlements?condition=mesothelioma').then(r => r.json());
```

### AI Chatbot Integration
The AI chatbot now has access to real-time data and can provide:
- Current settlement information
- Up-to-date law firm recommendations
- Latest medical condition information
- Recent legal case updates

## 🔄 Data Updates

### Adding New Content
1. **Google Sheets**: Add new rows to existing sheets
2. **HubSpot**: Create new blog posts or CRM records
3. **Automatic**: Data appears on website within 5 minutes (cache timeout)

### Updating Existing Content
1. **Google Sheets**: Edit existing rows
2. **HubSpot**: Update existing content
3. **Cache**: Clear cache via `/api/cache/clear` for immediate updates

### Adding New Data Types
1. Create new sheet in Google Sheets
2. Update `DataIntegrationService` to read new sheet
3. Add new API endpoints if needed

## 🐛 Troubleshooting

### Common Issues

#### No Data Loading
- Check environment variables are set correctly
- Verify Google Sheets API key has access to spreadsheet
- Ensure HubSpot tokens are valid

#### Cache Issues
- Clear cache: `POST /api/cache/clear`
- Check cache timeout settings
- Monitor cache hit/miss rates

#### Performance Issues
- Increase cache timeout for better performance
- Reduce data size in sheets
- Optimize API calls

### Debugging
```bash
# Check server logs for data loading
npm start

# Test individual endpoints
curl http://localhost:3000/api/articles
curl http://localhost:3000/api/law-firms?specialty=mesothelioma
```

## 🎯 Next Steps

### Immediate
1. Set up your Google Sheets with the required structure
2. Configure HubSpot integration
3. Test the data flow

### Future Enhancements
1. Add more data sources (FDA, court records)
2. Implement real-time notifications
3. Add data validation and quality checks
4. Create admin interface for data management

## 📞 Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify your environment variables
3. Test individual connectors
4. Clear cache and retry

The system is designed to be robust and self-healing, but manual intervention may be needed for major data source changes. 