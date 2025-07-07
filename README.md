# Injury Information Website with OpenAI Integration

A comprehensive injury information website that uses OpenAI's ChatGPT to provide intelligent answers about legal cases, settlements, medical conditions, and related topics.

## 🚀 Features

- **Real OpenAI Integration**: Uses actual OpenAI GPT models for intelligent responses
- **Secure API Key Handling**: Server-side API key management for security
- **Smart Search**: Auto-detects questions vs. searches
- **Contextual AI Responses**: Provides detailed information about injury cases
- **Interactive Chat**: Article-specific chat modals for deeper conversations
- **Comprehensive Error Handling**: Detailed error messages and troubleshooting guidance

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- OpenAI API key

### 2. Installation

1. **Clone/Download the project**
   ```bash
   git clone <repository-url>
   cd mcp-server-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your OpenAI API key**
   - Open `.env.local` file
   - Make sure your OpenAI API key is set:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```
   - Save the file

### 3. Running the Server

**Start the server:**
```bash
npm start
```

**For development (auto-restart on changes):**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Using the Website

1. Open your browser and go to `http://localhost:3000`
2. The website will automatically test the OpenAI connection
3. Use the search bar to:
   - Ask questions (e.g., "What are mesothelioma symptoms?")
   - Search for articles (e.g., "Roundup lawsuit")
4. Click "Ask AI" for intelligent responses
5. Click "Learn More" on articles for contextual chat

## 🔧 Troubleshooting

### Common Issues

**1. "Unable to connect to the server"**
- Make sure the server is running with `npm start`
- Check that port 3000 is not in use by another application
- Refresh the page after starting the server

**2. "API key authentication failed"**
- Verify your OpenAI API key in `.env.local`
- Ensure the API key is valid and active
- Check that you have sufficient credits in your OpenAI account
- Restart the server after updating the API key

**3. "Rate limit exceeded"**
- Wait a moment before making another request
- Consider upgrading your OpenAI plan for higher limits
- Check your OpenAI usage dashboard

**4. Server won't start**
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check for port conflicts: `netstat -an | grep 3000`

### Testing the API Connection

Visit `http://localhost:3000/api/test` to check if the OpenAI API is working correctly.

## 📁 Project Structure

```
├── server.js              # Express server with OpenAI integration
├── index.html             # Main website interface
├── package.json           # Project dependencies and scripts
├── .env.local            # Environment variables (API keys)
└── README.md             # This file
```

## 🔒 Security Features

- **Server-side API Key**: OpenAI API key is never exposed to the browser
- **CORS Protection**: Proper cross-origin request handling
- **Input Validation**: Server validates all requests
- **Error Handling**: Detailed error messages without exposing sensitive info

## 🎯 API Endpoints

- `GET /` - Main website
- `POST /api/chat` - OpenAI chat completion
- `GET /api/test` - Test OpenAI connection
- `GET /health` - Server health check

## 📝 Usage Examples

### Asking Questions
- "What are the symptoms of mesothelioma?"
- "How much compensation can I get for a Roundup lawsuit?"
- "What legal options do I have for silicosis?"

### Searching Articles
- "Roundup lawsuit"
- "3M earplug"
- "Asbestos exposure"

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Check the server logs in your terminal
3. Verify your OpenAI API key is valid
4. Ensure you have sufficient OpenAI credits
5. Try restarting the server

## 🔄 Updates

To update the project:
1. Pull the latest changes
2. Run `npm install` to update dependencies
3. Restart the server

---

**Note**: This application requires an active OpenAI API key and sufficient credits to function properly. Make sure to monitor your OpenAI usage to avoid unexpected charges. 