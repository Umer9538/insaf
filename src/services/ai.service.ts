/**
 * INSAF - AI Service
 * 
 * Handles AI chatbot interactions for Law Coach (clients) and Law Assistant (lawyers)
 */

import {
    COLLECTIONS,
    createDocument,
    getDocuments,
    subscribeToCollection,
    updateDocument,
    where,
    orderBy,
} from './firestore.service';
import { serverTimestamp } from 'firebase/firestore';
import { AI_CONFIG, AI_ENDPOINTS, validateAIConfig } from '../config/ai.config';

// AI Chat Types
export type AIChatType = 'LAW_COACH' | 'LAW_ASSISTANT';

// Message Role
export type MessageRole = 'user' | 'assistant' | 'system';

// AI Message Interface
export interface AIMessage {
    id?: string;
    userId: string;
    chatType: AIChatType;
    role: MessageRole;
    content: string;
    timestamp: any;
    sessionId?: string;
    metadata?: {
        model?: string;
        tokens?: number;
        suggestedAreaOfLaw?: string;
        suggestedActions?: string[];
    };
}

// AI Chat Session Interface
export interface AIChatSession {
    id?: string;
    userId: string;
    chatType: AIChatType;
    title: string;
    lastMessage: string;
    messageCount: number;
    createdAt: any;
    updatedAt: any;
}

// AI Response Interface
interface AIResponse {
    message: string;
    metadata?: {
        model: string;
        tokens: number;
        suggestedAreaOfLaw?: string;
        suggestedActions?: string[];
    };
}

/**
 * Create a new AI chat session
 */
export const createChatSession = async (
    userId: string,
    chatType: AIChatType,
    title: string = 'New Chat'
): Promise<string> => {
    return createDocument(COLLECTIONS.AI_SESSIONS, {
        userId,
        chatType,
        title,
        lastMessage: '',
        messageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

/**
 * Get user's chat sessions
 */
export const getUserChatSessions = async (
    userId: string,
    chatType: AIChatType
): Promise<AIChatSession[]> => {
    return getDocuments<AIChatSession>(COLLECTIONS.AI_SESSIONS, [
        where('userId', '==', userId),
        where('chatType', '==', chatType),
        orderBy('updatedAt', 'desc'),
    ]);
};

/**
 * Send message to AI and get response
 */
export const sendAIMessage = async (
    userId: string,
    chatType: AIChatType,
    userMessage: string,
    conversationHistory: AIMessage[] = [],
    sessionId?: string
): Promise<AIResponse> => {
    try {
        // Validate API configuration
        if (!validateAIConfig()) {
            throw new Error('AI API not configured. Please add your API key in ai.config.ts');
        }

        // Get system prompt based on chat type
        const systemPrompt =
            chatType === 'LAW_COACH'
                ? AI_CONFIG.systemPrompts.lawCoach
                : AI_CONFIG.systemPrompts.lawAssistant;

        // Build conversation context
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: 'user', content: userMessage },
        ];

        // Call AI API based on provider
        let response: AIResponse;

        switch (AI_CONFIG.provider) {
            case 'openai':
                response = await callOpenAI(messages);
                break;
            case 'gemini':
                response = await callGemini(messages);
                break;
            case 'claude':
                response = await callClaude(messages);
                break;
            default:
                throw new Error(`Unsupported AI provider: ${AI_CONFIG.provider}`);
        }

        // Save user message to Firestore
        await createDocument(COLLECTIONS.AI_MESSAGES, {
            userId,
            chatType,
            sessionId,
            role: 'user',
            content: userMessage,
            timestamp: serverTimestamp(),
        });

        // Save AI response to Firestore
        await createDocument(COLLECTIONS.AI_MESSAGES, {
            userId,
            chatType,
            sessionId,
            role: 'assistant',
            content: response.message,
            timestamp: serverTimestamp(),
            metadata: response.metadata,
        });

        // Update session if sessionId exists
        if (sessionId) {
            await updateDocument(COLLECTIONS.AI_SESSIONS, sessionId, {
                lastMessage: response.message.substring(0, 100) + (response.message.length > 100 ? '...' : ''),
                messageCount: conversationHistory.length + 2, // + user msg + ai response
                updatedAt: serverTimestamp(),
            });
        }

        return response;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

/**
 * Call OpenAI API
 */
const callOpenAI = async (messages: any[]): Promise<AIResponse> => {
    try {
        const response = await fetch(AI_ENDPOINTS.openai, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${AI_CONFIG.apiKey}`,
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: messages,
                temperature: AI_CONFIG.temperature,
                max_tokens: AI_CONFIG.maxTokens,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;

        return {
            message: aiMessage,
            metadata: {
                model: data.model,
                tokens: data.usage?.total_tokens || 0,
            },
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
};

/**
 * Call Google Gemini API
 */
const callGemini = async (messages: any[]): Promise<AIResponse> => {
    try {
        // Gemini uses a different format - combine messages into a single prompt
        const prompt = messages
            .filter((m) => m.role !== 'system')
            .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n');

        const systemContext = messages.find((m) => m.role === 'system')?.content || '';
        const fullPrompt = `${systemContext}\n\n${prompt}\n\nAssistant:`;

        // Dynamic URL construction using the configured model
        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        const url = `${baseUrl}/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`;

        const response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: fullPrompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: AI_CONFIG.temperature,
                        maxOutputTokens: AI_CONFIG.maxTokens,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        const aiMessage = data.candidates[0].content.parts[0].text;

        return {
            message: aiMessage,
            metadata: {
                model: 'gemini-pro',
                tokens: 0, // Gemini doesn't return token count in the same way
            },
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
};

/**
 * Call Anthropic Claude API
 */
const callClaude = async (messages: any[]): Promise<AIResponse> => {
    try {
        // Extract system message
        const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
        const conversationMessages = messages.filter((m) => m.role !== 'system');

        const response = await fetch(AI_ENDPOINTS.claude, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_CONFIG.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature,
                system: systemMessage,
                messages: conversationMessages,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API error');
        }

        const data = await response.json();
        const aiMessage = data.content[0].text;

        return {
            message: aiMessage,
            metadata: {
                model: data.model,
                tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0,
            },
        };
    } catch (error) {
        console.error('Claude API Error:', error);
        throw error;
    }
};

/**
 * Get AI chat history for a user
 */
export const getAIChatHistory = async (
    userId: string,
    chatType: AIChatType,
    limit: number = 50,
    sessionId?: string
): Promise<AIMessage[]> => {
    try {
        const constraints = [
            where('userId', '==', userId),
            where('chatType', '==', chatType),
            orderBy('timestamp', 'asc'),
        ];

        if (sessionId) {
            constraints.push(where('sessionId', '==', sessionId));
        }

        const messages = await getDocuments<AIMessage>(COLLECTIONS.AI_MESSAGES, constraints);

        // Return last N messages
        return messages.slice(-limit);
    } catch (error) {
        console.error('Error fetching AI chat history:', error);
        throw error;
    }
};

/**
 * Subscribe to AI chat updates (real-time)
 */
export const subscribeToAIChat = (
    userId: string,
    chatType: AIChatType,
    callback: (messages: AIMessage[]) => void,
    sessionId?: string
) => {
    const constraints = [
        where('userId', '==', userId),
        where('chatType', '==', chatType),
        orderBy('timestamp', 'asc'),
    ];

    if (sessionId) {
        constraints.push(where('sessionId', '==', sessionId));
    }

    return subscribeToCollection<AIMessage>(
        COLLECTIONS.AI_MESSAGES,
        constraints,
        callback
    );
};

/**
 * Clear AI chat history
 */
export const clearAIChatHistory = async (
    userId: string,
    chatType: AIChatType
): Promise<void> => {
    // Note: This would require a Cloud Function for batch delete
    // For now, we'll just mark it as a TODO
    console.warn('Clear chat history not implemented yet - requires Cloud Function');
    // TODO: Implement via Cloud Function
};

/**
 * Analyze case and suggest area of law (for Law Coach)
 */
export const analyzeCaseForAreaOfLaw = async (
    caseDescription: string
): Promise<string> => {
    try {
        const prompt = `Based on this case description, suggest the most relevant area of law from these options:
- FAMILY_LAW
- CRIMINAL_LAW
- CIVIL_LAW
- CORPORATE_LAW
- PROPERTY_LAW
- LABOR_LAW
- TAX_LAW
- CONSTITUTIONAL_LAW
- BANKING_LAW
- CYBER_LAW
- OTHER

Case description: ${caseDescription}

Respond with ONLY the area of law code (e.g., FAMILY_LAW), nothing else.`;

        const response = await sendAIMessage('system', 'LAW_COACH', prompt, [], undefined);
        return response.message.trim();
    } catch (error) {
        console.error('Error analyzing case:', error);
        return 'OTHER';
    }
};

/**
 * Get AI-powered case summary (for Law Assistant)
 */
export const generateCaseSummary = async (
    caseDetails: string
): Promise<string> => {
    try {
        const prompt = `Provide a concise legal case summary (max 200 words) for this case:

${caseDetails}

Include:
1. Key parties involved
2. Main legal issue
3. Important dates/deadlines
4. Potential legal grounds
5. Recommended next steps`;

        const response = await sendAIMessage('system', 'LAW_ASSISTANT', prompt, [], undefined);
        return response.message;
    } catch (error) {
        console.error('Error generating case summary:', error);
        throw error;
    }
};
