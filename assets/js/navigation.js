// Navigation Management Module
class NavigationManager {
    constructor() {
        this.currentSection = 'home';
        this.history = [];
    }
    
    init() {
        this.setupEventListeners();
        this.setupNavigationHighlight();
    }
    
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });
        
        // Logo click
        const logo = document.getElementById('app-logo');
        if (logo) {
            logo.addEventListener('click', () => {
                this.showSection('home');
            });
            logo.style.cursor = 'pointer';
        }
    }
    
    setupNavigationHighlight() {
        // Set up intersection observer for automatic highlighting
        const sections = document.querySelectorAll('.app-section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveNavLink(sectionId);
                }
            });
        }, {
            threshold: 0.6
        });
        
        sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    showSection(sectionName) {
        // Validate section
        const targetSection = document.getElementById(sectionName);
        if (!targetSection) {
            console.warn(`Section ${sectionName} not found`);
            return;
        }
        
        // Hide all sections
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        targetSection.classList.add('active');
        
        // Update current section
        this.history.push(this.currentSection);
        this.currentSection = sectionName;
        
        // Update navigation
        this.updateActiveNavLink(sectionName);
        
        // Update URL
        this.updateURL(sectionName);
        
        // Handle special cases
        this.handleSectionSpecialCases(sectionName);
        
        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Analytics tracking
        this.trackPageView(sectionName);
    }
    
    updateActiveNavLink(sectionName) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current nav link
        const currentNavLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (currentNavLink) {
            currentNavLink.classList.add('active');
        }
    }
    
    updateURL(sectionName) {
        // Update URL without page reload
        const newURL = sectionName === 'home' ? 
            window.location.pathname : 
            `${window.location.pathname}#${sectionName}`;
            
        window.history.pushState({ section: sectionName }, '', newURL);
    }
    
    handleSectionSpecialCases(sectionName) {
        switch (sectionName) {
            case 'policies':
                // Ensure main policies are shown when entering policies section
                if (window.PolicyManager) {
                    window.PolicyManager.showMainPolicies();
                }
                break;
                
            case 'about':
                // Trigger any about page animations
                this.animateAboutSection();
                break;
                
            case 'membership':
                // Focus on membership form if exists
                this.focusMembershipForm();
                break;
        }
    }
    
    animateAboutSection() {
        const candidateInfo = document.querySelector('.candidate-info');
        if (candidateInfo) {
            candidateInfo.style.opacity = '0';
            candidateInfo.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                candidateInfo.style.transition = 'all 0.6s ease';
                candidateInfo.style.opacity = '1';
                candidateInfo.style.transform = 'translateY(0)';
            }, 100);
        }
    }
    
    focusMembershipForm() {
        const membershipLink = document.querySelector('.membership-link');
        if (membershipLink) {
            setTimeout(() => {
                membershipLink.style.animation = 'pulse 2s infinite';
            }, 500);
            
            // Remove animation after 6 seconds
            setTimeout(() => {
                membershipLink.style.animation = '';
            }, 6500);
        }
    }
    
    goBack() {
        if (this.history.length > 0) {
            const previousSection = this.history.pop();
            this.showSection(previousSection);
        } else {
            this.showSection('home');
        }
    }
    
    goToNextSection() {
        const sections = ['home', 'policies', 'about', 'news', 'membership'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        if (currentIndex < sections.length - 1) {
            this.showSection(sections[currentIndex + 1]);
        }
    }
    
    goToPreviousSection() {
        const sections = ['home', 'policies', 'about', 'news', 'membership'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        if (currentIndex > 0) {
            this.showSection(sections[currentIndex - 1]);
        }
    }
    
    getCurrentSection() {
        return this.currentSection;
    }
    
    getHistory() {
        return [...this.history];
    }
    
    trackPageView(sectionName) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_TRACKING_ID', {
                page_title: `이우규 - ${this.getSectionTitle(sectionName)}`,
                page_location: window.location.href
            });
        }
        
        // Custom analytics
        console.log(`Page view: ${sectionName} at ${new Date().toISOString()}`);
    }
    
    getSectionTitle(sectionName) {
        const titles = {
            'home': '홈',
            'policies': '공약',
            'about': '이우규 소개',
            'news': '소식',
            'membership': '입당신청'
        };
        
        return titles[sectionName] || sectionName;
    }
    
    // Quick navigation methods
    goHome() {
        this.showSection('home');
    }
    
    goPolicies() {
        this.showSection('policies');
    }
    
    goAbout() {
        this.showSection('about');
    }
    
    goNews() {
        this.showSection('news');
    }
    
    goMembership() {
        this.showSection('membership');
    }
    
    // Mobile navigation helper
    toggleMobileNav() {
        const nav = document.querySelector('.main-nav');
        if (nav) {
            nav.classList.toggle('mobile-open');
        }
    }
    
    // Breadcrumb functionality
    getBreadcrumb() {
        const breadcrumb = [this.getSectionTitle('home')];
        
        if (this.currentSection !== 'home') {
            breadcrumb.push(this.getSectionTitle(this.currentSection));
        }
        
        if (window.PolicyManager && window.PolicyManager.getCurrentDetailId()) {
            const policy = window.PolicyManager.getPolicyById(window.PolicyManager.getCurrentDetailId());
            if (policy) {
                breadcrumb.push(policy.title);
            }
        }
        
        return breadcrumb;
    }
}

// Create global instance
const navigation = new NavigationManager();

// Global access
window.Navigation = navigation;