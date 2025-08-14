function parsePhoneNumber(fullPhoneNumber) {
    if (!fullPhoneNumber) {
        return { countryCode: '', phoneNumber: '' };
    }

    // List of known country codes (add more as needed)
    const countryCodes = [
        '+91', // India
        '+1',  // US/Canada
        '+44', // UK
        '+61', // Australia
        '+81'  // Japan
    ];

    for (const code of countryCodes) {
        if (fullPhoneNumber.startsWith(code)) {
            return {
                countryCode: code,
                phoneNumber: fullPhoneNumber.substring(code.length)
            };
        }
    }

    // If no known country code is matched, return the full number as local
    // This might need refinement based on actual data patterns
    return { countryCode: '', phoneNumber: fullPhoneNumber };
}

// Export functions if using modules, otherwise they'll be global
// For this simple setup, making it global is fine.
// If you were using ES modules, you would export it: export { parsePhoneNumber };
export { parsePhoneNumber };
