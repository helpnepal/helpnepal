/**
 * Emergency Contacts Nepal - JavaScript
 * Handles clipboard operations, user interactions, and analytics
 */

class EmergencyContactsApp {
    constructor() {
        this.initializeEventListeners();
        this.setupAccessibility();
        this.initializeAnimations();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Copy button functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                const phoneNumber = this.extractPhoneNumber(e.target);
                if (phoneNumber) {
                    this.copyToClipboard(phoneNumber);
                }
            }
        });

        // Phone button click tracking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('phone-btn')) {
                this.trackPhoneCall(e.target.textContent || e.target.href);
            }
        });

        // Resource link click tracking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('resource-link')) {
                this.trackResourceAccess(e.target.href);
            }
        });

        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Service worker registration for offline support
        this.registerServiceWorker();
    }

    /**
     * Extract phone number from copy button context
     */
    extractPhoneNumber(copyButton) {
        // Look for adjacent phone button
        const phoneButton = copyButton.previousElementSibling;
        if (phoneButton && phoneButton.classList.contains('phone-btn')) {
            return phoneButton.textContent.trim();
        }

        // Look for phone number in parent context
        const phoneList = copyButton.closest('.phone-list');
        if (phoneList) {
            const phoneButtons = phoneList.querySelectorAll('.phone-btn');
            const copyButtons = phoneList.querySelectorAll('.copy-btn');
            const copyIndex = Array.from(copyButtons).indexOf(copyButton);
            
            if (phoneButtons[copyIndex]) {
                return phoneButtons[copyIndex].textContent.trim();
            }
        }

        // Fallback: get from data attribute or onclick if available
        return copyButton.dataset.phone || null;
    }

    /**
     * Copy text to clipboard with fallback support
     */
    async copyToClipboard(text) {
        if (!text) {
            this.showToast('❌ No phone number found', 'error');
            return;
        }

        try {
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                this.showToast(`📋 Copied: ${text}`, 'success');
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(text);
            }
        } catch (err) {
            console.error('Clipboard operation failed:', err);
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * Fallback clipboard method for older browsers
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            width: 1px;
            height: 1px;
            opacity: 0;
        `;
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showToast(`📋 Copied: ${text}`, 'success');
            } else {
                this.showToast('❌ Copy failed - please try again', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showToast('❌ Copy not supported', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * Display toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        // Clear any existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        // Set message and styling
        toast.textContent = message;
        toast.className = `toast toast--${type}`;
        toast.style.display = 'block';

        // Add entrance animation
        toast.style.animation = 'slideInRight 0.3s ease';

        // Auto-hide after 3 seconds
        this.toastTimeout = setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3000);
    }

    /**
     * Track phone call attempts for analytics
     */
    trackPhoneCall(phoneNumber) {
        const cleanNumber = phoneNumber.replace(/[^\d-]/g, '');
        
        // Log for debugging
        console.log('Emergency contact used:', cleanNumber);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'phone_call', {
                'event_category': 'emergency_contact',
                'event_label': cleanNumber,
                'transport_type': 'beacon'
            });
        }

        // Store in localStorage for usage patterns
        this.storeUsageData('phone_call', cleanNumber);
    }

    /**
     * Track resource access
     */
    trackResourceAccess(url) {
        console.log('Resource accessed:', url);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'resource_access', {
                'event_category': 'emergency_resource',
                'event_label': url,
                'transport_type': 'beacon'
            });
        }

        this.storeUsageData('resource_access', url);
    }

    /**
     * Store usage data locally
     */
    storeUsageData(type, value) {
        try {
            const key = 'emergency_contacts_usage';
            const existingData = JSON.parse(localStorage.getItem(key) || '[]');
            
            existingData.push({
                type,
                value,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent.substring(0, 100)
            });

            // Keep only last 50 entries
            const recentData = existingData.slice(-50);
            localStorage.setItem(key, JSON.stringify(recentData));
        } catch (error) {
            console.warn('Could not store usage data:', error);
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        // Escape key hides toast
        if (e.key === 'Escape') {
            const toast = document.getElementById('toast');
            if (toast && toast.style.display === 'block') {
                toast.style.display = 'none';
            }
        }

        // Enter/Space on copy buttons
        if ((e.key === 'Enter' || e.key === ' ') && 
            e.target.classList.contains('copy-btn')) {
            e.preventDefault();
            e.target.click();
        }
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add ARIA labels to copy buttons
        document.querySelectorAll('.copy-btn').forEach((btn, index) => {
            const phoneButton = btn.previousElementSibling;
            if (phoneButton && phoneButton.classList.contains('phone-btn')) {
                const phoneNumber = phoneButton.textContent.trim();
                btn.setAttribute('aria-label', `Copy phone number ${phoneNumber}`);
                btn.setAttribute('title', `Copy ${phoneNumber} to clipboard`);
            }
        });

        // Add ARIA labels to phone buttons
        document.querySelectorAll('.phone-btn').forEach(btn => {
            const phoneNumber = btn.textContent.trim();
            btn.setAttribute('aria-label', `Call ${phoneNumber}`);
            btn.setAttribute('title', `Call ${phoneNumber}`);
        });

        // Add role and aria-live to toast
        const toast = document.getElementById('toast');
        if (toast) {
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.setAttribute('aria-atomic', 'true');
        }
    }

    /**
     * Initialize animations and interactions
     */
    initializeAnimations() {
        // Intersection Observer for scroll animations
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = '0.1s';
                        entry.target.style.animationFillMode = 'both';
                        entry.target.classList.add('fade-in-up');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            // Observe sections
            document.querySelectorAll('.section').forEach(section => {
                observer.observe(section);
            });
        }

        // Add ripple effect to buttons
        this.addRippleEffect();
    }

    /**
     * Add ripple effect to interactive elements
     */
    addRippleEffect() {
        document.querySelectorAll('.phone-btn, .copy-btn, .emergency-card').forEach(element => {
            element.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = element.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    pointer-events: none;
                `;
                
                element.style.position = 'relative';
                element.style.overflow = 'hidden';
                element.appendChild(ripple);

                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 600);
            });
        });
    }

    /**
     * Register service worker for offline support
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        try {
            const data = JSON.parse(localStorage.getItem('emergency_contacts_usage') || '[]');
            const stats = {
                totalUsage: data.length,
                phoneCallsCount: data.filter(item => item.type === 'phone_call').length,
                resourceAccessCount: data.filter(item => item.type === 'resource_access').length,
                mostUsedNumbers: this.getMostUsed(data.filter(item => item.type === 'phone_call')),
                recentActivity: data.slice(-10).reverse()
            };
            return stats;
        } catch (error) {
            console.warn('Could not get usage stats:', error);
            return null;
        }
    }

    /**
     * Get most used numbers
     */
    getMostUsed(phoneCallData) {
        const counts = {};
        phoneCallData.forEach(item => {
            counts[item.value] = (counts[item.value] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([number, count]) => ({ number, count }));
    }

    /**
     * Export usage data (for debugging)
     */
    exportUsageData() {
        const stats = this.getUsageStats();
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `emergency-contacts-usage-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes fade-in-up {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .fade-in-up {
        animation: fade-in-up 0.6s ease forwards;
    }

    .toast--error {
        background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
    }

    .toast--warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        color: white;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .emergency-card {
            border-width: 3px;
        }
        
        .phone-btn, .copy-btn {
            border: 2px solid currentColor;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        :root {
            --neutral-50: #171717;
            --neutral-100: #262626;
            --neutral-200: #404040;
            --neutral-800: #f5f5f5;
        }
    }
`;
document.head.appendChild(style);

// Global functions for backwards compatibility
window.copyToClipboard = function(text) {
    if (window.emergencyApp) {
        window.emergencyApp.copyToClipboard(text);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyApp = new EmergencyContactsApp();
    
    // Expose useful functions to global scope for debugging
    window.getEmergencyStats = () => window.emergencyApp.getUsageStats();
    window.exportEmergencyData = () => window.emergencyApp.exportUsageData();
    
    console.log('Emergency Contacts Nepal app initialized');
    console.log('Debug commands: getEmergencyStats(), exportEmergencyData()');
});