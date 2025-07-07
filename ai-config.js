// Centralized AI Configuration
// This file contains all AI parameters and settings used across the application

export const AI_CONFIG = {
    // OpenAI API Settings
    api: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
        baseURL: window.location.origin
    },

    // System Messages
    systemMessages: {
        // General injury and legal information assistant
        general: `You are an AI assistant specializing in injury and legal information. You have access to real-time data from Google Sheets and HubSpot about medical conditions, legal cases, law firms, and settlement information. Please provide helpful, accurate information based on this data. Be empathetic and informative, but always recommend consulting with qualified medical professionals or attorneys for specific situations. Keep your response concise (1-2 paragraphs or a short list).`,

        // Article-specific context
        articleContext: (articleTitle, articleContent) => `You are an AI assistant specializing in injury and legal information. The user is asking about: ${articleTitle}. 

Article Context:
${articleContent}

Please provide helpful, accurate information based on this specific article. Be empathetic and informative, but always recommend consulting with qualified medical professionals or attorneys for specific situations.`,

        // Legal referral trigger
        legalReferral: `You are an AI assistant specializing in injury and legal information. Please provide helpful, accurate information about injury cases, legal rights, medical conditions, settlements, and related topics. Be empathetic and informative, but always recommend consulting with qualified medical professionals or attorneys for specific situations. Keep your response concise (1-2 paragraphs or a short list).

IMPORTANT: If the user asks about legal options, filing claims, consulting attorneys, or seeking legal advice, mention that they can start their claim at legalinjuryadvocates.com.`
    },

    // Response Formatting
    formatting: {
        // Keywords that trigger legal referral
        legalReferralKeywords: [
            'consult', 'speak to', 'talk to', 'meet with', 'attorney', 'lawyer', 
            'file a claim', 'legal advice', 'legal options', 'seek legal', 
            'recommend', 'contact a lawyer', 'contact an attorney', 'how to file',
            'where to file', 'get compensation', 'payout', 'settlement'
        ],

        // Legal referral message
        legalReferralMessage: `<br><br><strong>➡️ You can start your claim at <a href="https://legalinjuryadvocates.com" target="_blank">legalinjuryadvocates.com</a>.</strong>`
    },

    // Error Messages
    errors: {
        connectionFailed: 'Unable to connect to the server. Please make sure the server is running.',
        apiKeyInvalid: 'API key authentication failed. Please check your OpenAI API key.',
        rateLimitExceeded: 'Rate limit exceeded. Please wait a moment and try again.',
        serviceUnavailable: 'OpenAI service is temporarily unavailable. Please try again later.',
        generic: 'An unexpected error occurred. Please try again.'
    },

    // UI Settings
    ui: {
        loadingMessage: 'AI is thinking...',
        thinkingMessage: 'AI is analyzing your question...',
        errorPrefix: 'Sorry, I encountered an error: '
    }
};

// Helper function to create API request body
export function createApiRequest(message, systemMessage = null, options = {}) {
    return {
        message,
        systemMessage: systemMessage || AI_CONFIG.systemMessages.general,
        options: {
            model: options.model || AI_CONFIG.api.model,
            temperature: options.temperature || AI_CONFIG.api.temperature,
            max_tokens: options.max_tokens || AI_CONFIG.api.max_tokens,
            ...options
        }
    };
}

// Helper function to check if response should include legal referral
export function shouldIncludeLegalReferral(text) {
    const lowerText = text.toLowerCase();
    return AI_CONFIG.formatting.legalReferralKeywords.some(keyword => 
        lowerText.includes(keyword.toLowerCase())
    );
}

// Helper function to add legal referral to response
export function addLegalReferralIfNeeded(text) {
    if (shouldIncludeLegalReferral(text)) {
        return text + AI_CONFIG.formatting.legalReferralMessage;
    }
    return text;
}

// Helper function to get error message based on error type
export function getErrorMessage(error) {
    const message = error.message || '';
    
    if (message.includes('401')) {
        return AI_CONFIG.errors.apiKeyInvalid;
    } else if (message.includes('429')) {
        return AI_CONFIG.errors.rateLimitExceeded;
    } else if (message.includes('500')) {
        return AI_CONFIG.errors.serviceUnavailable;
    } else if (message.includes('fetch') || message.includes('connect')) {
        return AI_CONFIG.errors.connectionFailed;
    } else {
        return AI_CONFIG.errors.generic;
    }
}

// Enhanced Markdown to HTML converter
export function markdownToHtml(md) {
    if (!md) return '';
    let html = md;
    
    // Bold **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle numbered lists (1. item)
    html = html.replace(/^\d+\.\s+(.*?)$/gm, '<li>$1</li>');
    
    // Handle bullet lists (- item, * item, • item)
    html = html.replace(/^[-*•]\s+(.*?)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> elements in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/gs, function(match) {
        return '<ul>' + match + '</ul>';
    });
    
    // Handle line breaks and paragraphs
    html = html.replace(/\n{3,}/g, '</p><p>');
    html = html.replace(/\n{2}/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags if not already wrapped
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }
    
    return html;
} 