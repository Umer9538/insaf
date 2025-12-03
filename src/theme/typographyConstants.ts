/**
 * INSAF - Typography Constants Helper
 * 
 * Simple typography constants for screens
 */

export const TYPOGRAPHY = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
    },
    h2: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 36,
    },
    h3: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
    },
    body: {
        medium: {
            fontSize: 16,
            fontWeight: '400' as const,
            lineHeight: 24,
        },
        semibold: {
            fontSize: 16,
            fontWeight: '600' as const,
            lineHeight: 24,
        },
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        semibold: {
            fontSize: 12,
            fontWeight: '600' as const,
            lineHeight: 16,
        },
    },
};
