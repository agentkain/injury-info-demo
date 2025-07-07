// Server-side AI Configuration
// This file contains all AI parameters and settings used by the server

export const SERVER_AI_CONFIG = {
    // OpenAI API Settings
    api: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500
    },

    // System Messages
    systemMessages: {
        // General injury and legal information assistant
        general: `You are an AI assistant specializing in injury and legal information. Please provide helpful, accurate information about injury cases, legal rights, medical conditions, settlements, and related topics. Be empathetic and informative, but always recommend consulting with qualified medical professionals or attorneys for specific situations. Keep your response concise (1-2 paragraphs or a short list).`,

        // Article-specific context
        articleContext: (articleTitle, articleContent) => `You are an AI assistant specializing in injury and legal information. The user is asking about: ${articleTitle}. 

Article Context:
${articleContent}

Please provide helpful, accurate information based on this specific article. Be empathetic and informative, but always recommend consulting with qualified medical professionals or attorneys for specific situations.`,

        // Legal referral trigger
        legalReferral: `You are an AI assistant specializing in injury and legal information. Please provide helpful, accurate information about injury cases, legal rights, medical conditions, settlements, and related topics. Be empathetic and informative, but always recommend consulting with qualified medical professionals or attorneys for specific situations. Keep your response concise (1-2 paragraphs or a short list).

IMPORTANT: If the user asks about legal options, filing claims, consulting attorneys, or seeking legal advice, mention that they can start their claim at legalinjuryadvocates.com.`
    },

    // Error Messages
    errors: {
        connectionFailed: 'Unable to connect to the server. Please make sure the server is running.',
        apiKeyInvalid: 'Invalid API key. Please check your OpenAI API key.',
        rateLimitExceeded: 'Rate limit exceeded. Please try again later.',
        serviceUnavailable: 'OpenAI service error. Please try again later.',
        generic: 'An error occurred while processing your request.'
    }
};

// Helper function to create OpenAI API request
export function createOpenAIRequest(messages, options = {}) {
    // Only include valid OpenAI API parameters
    const request = {
        model: options.model || SERVER_AI_CONFIG.api.model,
        messages: messages,
        temperature: options.temperature || SERVER_AI_CONFIG.api.temperature,
        max_tokens: options.max_tokens || SERVER_AI_CONFIG.api.max_tokens
    };
    
    // Add any other valid OpenAI parameters if needed
    if (options.top_p !== undefined) request.top_p = options.top_p;
    if (options.frequency_penalty !== undefined) request.frequency_penalty = options.frequency_penalty;
    if (options.presence_penalty !== undefined) request.presence_penalty = options.presence_penalty;
    
    return request;
}

// Helper function to get error message based on error type
export function getServerErrorMessage(error) {
    if (error.status === 401) {
        return SERVER_AI_CONFIG.errors.apiKeyInvalid;
    } else if (error.status === 429) {
        return SERVER_AI_CONFIG.errors.rateLimitExceeded;
    } else if (error.status === 500) {
        return SERVER_AI_CONFIG.errors.serviceUnavailable;
    } else {
        return SERVER_AI_CONFIG.errors.generic;
    }
} 