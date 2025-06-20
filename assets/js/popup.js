// Popup Management Module
class PopupManager {
    constructor() {
        this.isInitialized = false;
        this.popupElement = null;
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.popupElement = document.getElementById('popup-overlay');
        this.setupEventListeners();
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        if (!this.popupElement) return;
        
        const agreeButton = document.getElementById('agree-push');
        const disagreeButton = document.getElementById('disagree-push');
        
        if (agreeButton) {
            agreeButton.addEventListener('click', () => {
                this.handlePushConsent(true);
            });
        }
        
        if (disagreeButton) {
            disagreeButton.addEventListener('click', () => {
                this.handlePushConsent(false);
            });
        }
        
        // Close popup when clicking overlay
        this.popupElement.addEventListener('click', (e) => {
            if (e.target === this.popupElement) {
                this.hidePopup();
            }
        });
        
        // Close popup with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPopupVisible()) {
                this.hidePopup();
            }
        });
    }
    
    showInitialPopup() {
        // Check if user has already made a choice
        const consent = this.getStoredConsent();
        
        if (consent === null) {
            setTimeout(() => {
                this.showPopup();
            }, 2000); // Show after 2 seconds
        }
    }
    
    showPopup() {
        if (!this.popupElement) {
            this.init();
        }
        
        if (this.popupElement) {
            this.popupElement.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Add animation
            this.popupElement.style.opacity = '0';
            setTimeout(() => {
                this.popupElement.style.transition = 'opacity 0.3s ease';
                this.popupElement.style.opacity = '1';
            }, 10);
            
            // Analytics
            this.trackPopupView('notification_consent');
        }
    }
    
    hidePopup() {
        if (!this.popupElement) return;
        
        this.popupElement.style.opacity = '0';
        
        setTimeout(() => {
            this.popupElement.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }, 300);
    }
    
    handlePushConsent(agreed) {
        const message = agreed ? 
            '푸쉬 알림에 동의해주셔서 감사합니다!\n이우규 후보의 최신 소식을 받아보실 수 있습니다.' : 
            '푸쉬 알림 설정을 거부하셨습니다.\n언제든지 설정에서 변경하실 수 있습니다.';
        
        // Store consent
        this.storeConsent(agreed);
        
        // Register for push notifications if agreed
        if (agreed) {
            this.requestPushPermission();
        }
        
        // Show confirmation
        this.showNotification(message, agreed ? 'success' : 'info');
        
        // Hide popup
        this.hidePopup();
        
        // Analytics
        this.trackConsentChoice(agreed);
    }
    
    async requestPushPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }
    
    storeConsent(agreed) {
        const consentData = {
            agreed: agreed,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        sessionStorage.setItem('pushNotificationConsent', JSON.stringify(consentData));
        
        // Also store in localStorage for persistence
        localStorage.setItem('pushNotificationConsent', JSON.stringify(consentData));
    }
    
    getStoredConsent() {
        try {
            const stored = localStorage.getItem('pushNotificationConsent');
            if (stored) {
                const data = JSON.parse(stored);
                return data.agreed;
            }
        } catch (error) {
            console.error('Error reading consent data:', error);
        }
        
        return null;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            font-size: 0.9rem;
            line-height: 1.4;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    getNotificationColor(type) {
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        };
        return colors[type] || colors.info;
    }
    
    isPopupVisible() {
        return this.popupElement && this.popupElement.style.display === 'flex';
    }
    
    // Custom popup methods
    showCustomPopup(title, message, buttons = []) {
        const customPopup = this.createCustomPopup(title, message, buttons);
        document.body.appendChild(customPopup);
        
        return new Promise((resolve) => {
            customPopup.addEventListener('click', (e) => {
                if (e.target.classList.contains('custom-popup-button')) {
                    const value = e.target.dataset.value;
                    document.body.removeChild(customPopup);
                    resolve(value);
                }
            });
        });
    }
    
    createCustomPopup(title, message, buttons) {
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.style.display = 'flex';
        
        const content = document.createElement('div');
        content.className = 'popup-content';
        
        content.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="popup-buttons">
                ${buttons.map(button => `
                    <button class="popup-button custom-popup-button ${button.class || ''}" 
                            data-value="${button.value}">
                        ${button.text}
                    </button>
                `).join('')}
            </div>
        `;
        
        popup.appendChild(content);
        return popup;
    }
    
    // Analytics and tracking
    trackPopupView(popupType) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'popup_view', {
                popup_type: popupType,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`Popup viewed: ${popupType}`);
    }
    
    trackConsentChoice(agreed) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'consent_choice', {
                consent_type: 'push_notifications',
                consent_granted: agreed,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`Consent choice: ${agreed ? 'agreed' : 'disagreed'}`);
    }
    
    // Reset consent (for testing)
    resetConsent() {
        localStorage.removeItem('pushNotificationConsent');
        sessionStorage.removeItem('pushNotificationConsent');
        console.log('Consent data cleared');
    }
    
    // Get consent status
    getConsentStatus() {
        const consent = this.getStoredConsent();
        const permission = 'Notification' in window ? Notification.permission : 'unsupported';
        
        return {
            consentGiven: consent,
            browserPermission: permission,
            canShowNotifications: consent && permission === 'granted'
        };
    }
}

// Create global instance
const popupManager = new PopupManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    popupManager.init();
});

// Global access
window.PopupManager = popupManager;