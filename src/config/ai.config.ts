/**
 * INSAF - AI Configuration
 * 
 * Configuration for AI chatbot services (Law Coach & Law Assistant)
 */

// AI Provider Options
export type AIProvider = 'openai' | 'gemini' | 'claude' | 'custom';

// AI Configuration Interface
export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompts: {
        lawCoach: string;
        lawAssistant: string;
    };
}

// Default AI Configuration
// TODO: Add your API key in environment variables or secure storage
export const AI_CONFIG: AIConfig = {
    // Choose your provider: 'openai' | 'gemini' | 'claude'
    provider: 'gemini', // Using Google Gemini

    // API Key - IMPORTANT: Move this to environment variables in production
    // For now, you can add it here temporarily for testing
    apiKey: process.env.EXPO_PUBLIC_AI_API_KEY || '',

    // Model selection based on provider
    model: 'gemini-flash-latest', // Google Gemini Flash Latest model

    // Response creativity (0.0 - 1.0)
    temperature: 0.7,

    // Maximum response length
    maxTokens: 1000,

    // System prompts for different AI assistants
    systemPrompts: {
        // Law Coach - For Clients
        lawCoach: `You are an AI Legal Advisor for INSAF, a legal services platform in Pakistan.

Your role is to:
1. Help clients understand their legal situation
2. Guide them on which type of lawyer they might need
3. Explain legal processes in simple, easy-to-understand language
4. Suggest relevant areas of law (Family, Criminal, Civil, Property, etc.)
5. Provide general legal information (NOT legal advice)

Important guidelines:
- Always be empathetic and supportive
- Use simple language, avoid legal jargon
- Support both English and Urdu
- Clearly state you're providing information, not legal advice
- Recommend consulting with a verified lawyer on the platform
- Be aware of Pakistan's legal system and laws
- If asked about specific case outcomes, remind them only a lawyer can provide that

Areas of Law you can help with:
- Family Law (divorce, custody, inheritance)
- Criminal Law (FIR, bail, criminal cases)
- Civil Law (disputes, contracts)
- Property Law (ownership, disputes, registration)
- Labor Law (employment issues)
- Corporate Law (business matters)
- Tax Law
- Constitutional Law
- Banking Law
- Cyber Law

Always end by asking if they'd like to post their case to find a lawyer.`,

        // Law Assistant - For Lawyers
        lawAssistant: `You are an AI Legal Assistant for lawyers on the INSAF platform in Pakistan.

Your role is to:
1. Analyze case details and provide summaries
2. Extract key information (parties, dates, amounts, locations)
3. Suggest relevant case law and legal precedents
4. Help with document review and analysis
5. Provide strategic recommendations
6. Track important deadlines and milestones
7. Assist with legal research

Important guidelines:
- Provide professional, accurate legal analysis
- Reference Pakistan's legal framework and precedents
- Be concise and actionable
- Highlight critical information
- Suggest next steps and strategies
- Be aware of Pakistan Penal Code, Civil Procedure Code, etc.
- Help identify potential legal issues
- Maintain professional tone

You can assist with:
- Case analysis and summarization
- Legal research
- Document review
- Deadline tracking
- Strategic planning
- Legal precedent identification
- Risk assessment

Always maintain lawyer-client privilege and confidentiality.`,
    },
};

// API Endpoints based on provider
export const AI_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    claude: 'https://api.anthropic.com/v1/messages',
};

// Model options for each provider
export const AI_MODELS = {
    openai: {
        'gpt-3.5-turbo': 'GPT-3.5 Turbo (Fast, Cost-effective)',
        'gpt-4': 'GPT-4 (Most Capable)',
        'gpt-4-turbo': 'GPT-4 Turbo (Fast + Capable)',
    },
    gemini: {
        'gemini-1.5-flash': 'Gemini 1.5 Flash (Fast & Efficient)',
        'gemini-1.5-pro': 'Gemini 1.5 Pro (Most Capable)',
    },
    claude: {
        'claude-3-opus': 'Claude 3 Opus (Most Capable)',
        'claude-3-sonnet': 'Claude 3 Sonnet (Balanced)',
        'claude-3-haiku': 'Claude 3 Haiku (Fast)',
    },
};

// Validate API configuration
export const validateAIConfig = (): boolean => {
    if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ AI API Key not configured. Please add your API key.');
        return false;
    }
    return true;
};

// Get current configuration
export const getAIConfig = (): AIConfig => {
    return AI_CONFIG;
};

// Update API key (for runtime configuration)
export const updateAPIKey = (apiKey: string): void => {
    AI_CONFIG.apiKey = apiKey;
};
