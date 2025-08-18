/**
 * Feature Utilities
 * Helper functions to check feature switches and control feature visibility
 */

// Cache for feature switches to avoid repeated API calls
let featureSwitchCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch feature switches from the API
 * Uses caching to reduce API calls
 */
async function fetchFeatureSwitches() {
    // Check if cache is valid
    if (featureSwitchCache && cacheExpiry && Date.now() < cacheExpiry) {
        return featureSwitchCache;
    }

    try {
        const response = await fetch('/regapp2/public/backend/feature_switches.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            featureSwitchCache = data;
            cacheExpiry = Date.now() + CACHE_DURATION;
            return data;
        } else {
            throw new Error(data.error || 'Failed to fetch feature switches');
        }
    } catch (error) {
        console.error('Error fetching feature switches:', error);
        // Return a default state if API fails
        return {
            success: true,
            enabled_features: ['subscriptions', 'user_invitations', 'user_profiles'], // Default enabled features
            all_features: {}
        };
    }
}

/**
 * Check if a specific feature is enabled
 * @param {string} featureKey - The feature key to check
 * @returns {Promise<boolean>} - Whether the feature is enabled
 */
export async function isFeatureEnabled(featureKey) {
    try {
        const switches = await fetchFeatureSwitches();
        return switches.enabled_features.includes(featureKey);
    } catch (error) {
        console.error('Error checking feature:', error);
        // Default to enabled for critical features
        const criticalFeatures = ['user_profiles', 'password_reset'];
        return criticalFeatures.includes(featureKey);
    }
}

/**
 * Get all enabled features
 * @returns {Promise<string[]>} - Array of enabled feature keys
 */
export async function getEnabledFeatures() {
    try {
        const switches = await fetchFeatureSwitches();
        return switches.enabled_features;
    } catch (error) {
        console.error('Error getting enabled features:', error);
        return ['user_profiles', 'password_reset']; // Default minimal features
    }
}

/**
 * Get all feature information
 * @returns {Promise<Object>} - Object with all feature details
 */
export async function getAllFeatures() {
    try {
        const switches = await fetchFeatureSwitches();
        return switches.all_features;
    } catch (error) {
        console.error('Error getting all features:', error);
        return {};
    }
}

/**
 * Show/hide elements based on feature availability
 * @param {string} featureKey - The feature key to check
 * @param {string|Element} element - Element selector or element to show/hide
 * @param {boolean} invert - If true, hide when feature is enabled
 */
export async function toggleElementByFeature(featureKey, element, invert = false) {
    try {
        const isEnabled = await isFeatureEnabled(featureKey);
        const shouldShow = invert ? !isEnabled : isEnabled;
        
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            if (shouldShow) {
                // Remove the hidden state - CSS will handle display when body has feature-loaded class
                el.style.removeProperty('display');
                el.classList.remove('hidden');
                el.setAttribute('data-feature-enabled', 'true');
            } else {
                // Keep element hidden
                el.style.display = 'none';
                el.classList.add('hidden');
                el.setAttribute('data-feature-enabled', 'false');
            }
        }
    } catch (error) {
        console.error('Error toggling element by feature:', error);
        // On error, default to showing the element for better UX
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.removeProperty('display');
            el.classList.remove('hidden');
            el.setAttribute('data-feature-enabled', 'true');
        }
    }
}

/**
 * Show/hide multiple elements based on feature availability
 * @param {string} featureKey - The feature key to check
 * @param {string[]|Element[]} elements - Array of element selectors or elements
 * @param {boolean} invert - If true, hide when feature is enabled
 */
export async function toggleElementsByFeature(featureKey, elements, invert = false) {
    const promises = elements.map(element => toggleElementByFeature(featureKey, element, invert));
    await Promise.all(promises);
}

/**
 * Clear the feature cache (useful after admin changes)
 */
export function clearFeatureCache() {
    featureSwitchCache = null;
    cacheExpiry = null;
}

/**
 * Initialize feature-based page controls
 * Call this on page load to set up feature-dependent elements
 */
export async function initializeFeatureControls() {
    try {
        // Wait a bit for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Apply feature controls based on data attributes
        const featureElements = document.querySelectorAll('[data-feature]');
        
        for (const element of featureElements) {
            const featureKey = element.getAttribute('data-feature');
            const invert = element.hasAttribute('data-feature-invert');
            
            if (featureKey) {
                await toggleElementByFeature(featureKey, element, invert);
            }
        }
        
        // Add feature-loaded class to body to enable CSS-based display
        document.body.classList.add('feature-loaded');
    } catch (error) {
        console.error('Error initializing feature controls:', error);
        // On error, still add the class to show elements
        document.body.classList.add('feature-loaded');
    }
}

/**
 * Redirect to error page if feature is disabled
 * @param {string} featureKey - The feature key to check
 * @param {string} redirectUrl - URL to redirect to if feature is disabled
 */
export async function requireFeature(featureKey, redirectUrl = '/regapp2/public/frontend/index.html') {
    try {
        const isEnabled = await isFeatureEnabled(featureKey);
        if (!isEnabled) {
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error('Error checking required feature:', error);
        // On error, allow access to avoid breaking the user experience
    }
}
