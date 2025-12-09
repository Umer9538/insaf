/**
 * INSAF - Validation Utilities
 * 
 * Centralized validation logic for forms across the application.
 */

/**
 * Validates an email address against strict rules.
 * 
 * Rules enforced:
 * 1. Follow basic format (abc@domain.com)
 * 2. Must contain exactly one "@" symbol
 * 3. Domain must contain at least one dot
 * 4. No whitespaces anywhere
 * 5. No consecutive dots
 * 6. No leading dot in address
 * 7. No trailing dot in current address
 * 8. No trailing dot in local part
 * 9. No special characters outside allowed set
 * 10. Domain cannot start with a hyphen
 * 11. Domain cannot end with a hyphen
 * 12. TLD must be at least 2 characters
 * 13. No repetitive/duplicate TLDs
 * 14. Local part cannot exceed 64 characters
 * 15. Total length cannot exceed 254 characters
 * 
 * @param email The email string to validate
 * @returns Error message string if invalid, null if valid
 */
export const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';

    // 4. No whitespaces anywhere
    if (/\s/.test(email)) return 'Email must not contain spaces';

    // 15. Total length cannot exceed 254 characters
    if (email.length > 254) return 'Email is too long (max 254 characters)';

    // 2. Must contain exactly one "@" symbol
    const parts = email.split('@');
    if (parts.length !== 2) return 'Email must contain exactly one "@" symbol';

    // Split into local and domain parts
    // Note: split can result in empty strings if @ is at start or end
    const [local, domain] = parts;

    if (local.length === 0) return 'Email is missing local part (before @)';
    if (domain.length === 0) return 'Email is missing domain part (after @)';

    // 14. Local part cannot exceed 64 characters
    if (local.length > 64) return 'Local part exceeds 64 characters';

    // 5. No consecutive dots
    if (email.includes('..')) return 'Email cannot contain consecutive dots';

    // 6. No leading dot in address (effectively checked by local part start)
    if (email.startsWith('.')) return 'Email cannot start with a dot';

    // 7. No trailing dot in the address
    if (email.endsWith('.')) return 'Email cannot end with a dot';

    // 7. No trailing dot in the local part specifically
    if (local.endsWith('.')) return 'Local part cannot end with a dot';

    // 8. No special characters outside of allowed set
    // Allowed in local part: a-z, A-Z, 0-9, and .!#$%&'*+/=?^_`{|}~-
    const allowedCharsValues = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
    if (!allowedCharsValues.test(local)) return 'Email contains invalid special characters';

    // 9. Domain cannot start with a hyphen
    if (domain.startsWith('-')) return 'Domain cannot start with a hyphen';

    // 10. Domain cannot end with a hyphen
    if (domain.endsWith('-')) return 'Domain cannot end with a hyphen';

    // 3. Domain must contain at least one dot
    if (!domain.includes('.')) return 'Domain must contain at least one dot';

    // 12. TLD must be at least 2 characters
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];

    if (tld.length < 2) {
        return 'Top-level domain (e.g. .com) must be at least 2 characters';
    }

    // 13. No repetitive/duplicate TLDs (e.g. .com.com)
    // Check if the last two parts are identical
    if (domainParts.length >= 2) {
        const secondToLast = domainParts[domainParts.length - 2];
        if (secondToLast === tld) {
            return `Email contains repetitive domain parts (.${tld}.${tld})`;
        }
    }

    return null; // Valid
};
