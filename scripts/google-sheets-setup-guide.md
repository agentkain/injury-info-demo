# 📊 Google Sheets Integration Setup Guide

## 🎯 Overview
This guide will help you set up Google Sheets as your data source for the Injury Info MCP server. This approach is much more practical than web scraping and gives you full control over your data.

## 🚀 Quick Start

### 1. Create Google Sheets Template

**Create a new Google Sheet with 3 tabs:**

#### 📋 Tab 1: "Law Firms"
| Name | Specialty | Success Rate | Years Experience | Contingency Fee | Languages | Phone | Email | City | State |
|------|-----------|--------------|------------------|-----------------|-----------|-------|-------|------|-------|
| Smith & Associates | Personal Injury | 95 | 15 | 30 | English, Spanish | 555-0101 | contact@smithlaw.com | New York | NY |
| Johnson Legal Group | Medical Malpractice | 88 | 12 | 25 | English | 555-0102 | info@johnsonlegal.com | Los Angeles | CA |

#### 📋 Tab 2: "Manufacturer Cases"
| Company | Product | Injury Type | Settlement Amount | Year | Status | Severity | Case Name |
|---------|---------|-------------|-------------------|------|--------|----------|-----------|
| Johnson & Johnson | Talcum Powder | Ovarian Cancer | $2,000,000 | 2023 | Settled | High | Smith v. J&J |
| Bayer | Roundup | Non-Hodgkin Lymphoma | $1,500,000 | 2022 | Settled | High | Johnson v. Bayer |

#### 📋 Tab 3: "Medical Information"
| Condition | Symptoms | Treatments | Legal Considerations | Average Settlement | Time Limit |
|-----------|----------|------------|---------------------|-------------------|------------|
| Mesothelioma | Chest pain, shortness of breath | Chemo, surgery | Asbestos exposure history | $1,200,000 | 2-3 years |
| Talcum Powder Cancer | Pelvic pain, bloating | Surgery, chemo | Product use history | $800,000 | 2 years |

### 2. Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 3. Configure Environment

Add to your `.env` file:
```env
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
HUBSPOT_ACCESS_TOKEN=your-hubspot-token-here
```

**To get your Spreadsheet ID:**
- Open your Google Sheet
- Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
- Copy the ID between `/d/` and `/edit`

### 4. Install Dependencies

```bash
npm install node-fetch dotenv
```

### 5. Run the Sync

```bash
node scripts/google-sheets-connector.js
```

## 🔧 Advanced Configuration

### Custom Sheet Structure

You can modify the sheet structure in `google-sheets-connector.js`:

```javascript
const SHEET_STRUCTURE = {
    law_firms: {
        sheet_name: 'Law Firms',  // Your sheet tab name
        columns: ['Name', 'Phone', 'Email'],  // Your column headers
        hubspot_mapping: {
            'Name': 'name',  // Maps sheet column to HubSpot property
            'Phone': 'phone',
            'Email': 'email'
        }
    }
};
```

### Automated Sync

Set up a cron job or GitHub Action for automatic syncing:

```bash
# Daily sync at 9 AM
0 9 * * * cd /path/to/your/project && node scripts/google-sheets-connector.js
```

## 📊 Data Management Best Practices

### ✅ Do's
- Keep column headers consistent
- Use clear, descriptive names
- Include all required fields
- Regular backups of your sheet
- Version control important changes

### ❌ Don'ts
- Don't change column names after setup
- Don't leave cells empty for required fields
- Don't use special characters in headers
- Don't exceed Google Sheets limits (10M cells)

## 🔄 Sync Options

### Option 1: Full Sync (Default)
- Reads entire sheets
- Creates/updates all records
- Good for initial setup

### Option 2: Incremental Sync
- Only syncs new/changed rows
- Faster for large datasets
- Requires timestamp column

### Option 3: Manual Sync
- Run on-demand
- Good for testing
- Full control over timing

## 🛠️ Troubleshooting

### Common Issues

**"API Key Invalid"**
- Check your Google API key
- Ensure Google Sheets API is enabled
- Verify project billing is set up

**"Spreadsheet Not Found"**
- Check spreadsheet ID in URL
- Ensure sheet is shared (if using service account)
- Verify sheet names match exactly

**"HubSpot API Errors"**
- Check HubSpot access token
- Verify HubSpot properties exist
- Check API rate limits

### Debug Mode

Add debug logging:
```javascript
console.log('Raw sheet data:', result.values);
console.log('Mapped properties:', properties);
```

## 🎯 Next Steps

1. **Test with Sample Data**: Start with a few rows to verify everything works
2. **Set Up Automation**: Configure automatic syncing
3. **Monitor Performance**: Watch for API limits and errors
4. **Scale Up**: Add more data and sheets as needed

## 💡 Pro Tips

- **Backup Strategy**: Keep a copy of your sheet in Google Drive
- **Data Validation**: Use Google Sheets data validation for consistent data
- **Collaboration**: Share sheet with team members for updates
- **Monitoring**: Set up alerts for sync failures
- **Documentation**: Keep a changelog of data updates

## 🔗 Useful Links

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [HubSpot CRM API Documentation](https://developers.hubspot.com/docs/api/crm/overview)
- [Google Cloud Console](https://console.cloud.google.com/)
- [HubSpot Developer Portal](https://developers.hubspot.com/)

---

**Need Help?** Check the troubleshooting section or review the console output for specific error messages. 