// Main Application Logic (CMS 충돌 해결 버전)
class LeeWooKyuApp {
    constructor() {
        this.currentSection = 'home';
        this.currentPolicyDetail = null;
        this.data = {
            policies: null,
            candidate: null,
            news: null
        };
        
        this.isInitialized = false;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('앱 초기화 시작...');
            
            // Load data first
            await this.loadData();
            
            // Initialize components in order (CMS 제외)
            this.setupEventListeners();
            this.initializeNavigation();
            
            // Render content
            this.renderPolicies();
            this.renderCandidate();
            this.renderNews();
            this.renderFAQ();
            
            // Handle initial URL
            this.handleInitialRoute();
            
            // Show initial popup after everything is loaded
            setTimeout(() => {
                if (window.PopupManager) {
                    window.PopupManager.showInitialPopup();
                }
            }, 2000);
            
            this.isInitialized = true;
            console.log('앱 초기화 완료');
            
        } catch (error) {
            console.error('앱 초기화 실패:', error);
            this.showError('앱을 초기화하는 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    async loadData() {
        try {
            console.log('데이터 로딩 시작...');
            
            const [policies, candidate] = await Promise.all([
                this.loadJSON('assets/data/policies.json'),
                this.loadJSON('assets/data/candidate.json')
            ]);
            
            this.data.policies = policies;
            this.data.candidate = candidate;
            
            console.log('데이터 로딩 완료:', {
                policies: !!this.data.policies,
                candidate: !!this.data.candidate
            });
            
        } catch (error) {
            console.error('데이터 로딩 실패:', error);
            // 더미 데이터로 대체
            this.createFallbackData();
        }
    }
    
    createFallbackData() {
        console.log('더미 데이터 생성...');
        
        this.data.policies = {
            mainPolicies: [
                {
                    id: "policy-A",
                    title: "A. 국민주권-기본사회위원회 운영",
                    summary: "농촌형 기본소득 시범사업 도입, 재생에너지 기반 조성, 주민 참여형 정책 거버넌스 구축",
                    details: {
                        sections: [
                            {
                                title: "A-1. 기본사회위원회 운영",
                                goal: "주거, 의료, 돌봄, 교육, 교통, 공공서비스 분야에서 정책 이행을 총괄 조정, 평가",
                                plans: [
                                    "구성방안: 주민, 기업, 시민사회조직, 협동조합 등 주체가 대표 파견",
                                    "역할: 기본수당추진 기획, 통합돌봄 네트워크 거버넌스 행사"
                                ]
                            }
                        ]
                    }
                }
            ],
            visionByArea: [
                {
                    id: "vision-jinan",
                    name: "진안읍",
                    title: "진안읍 비전 2026",
                    budget: 610,
                    plans: [
                        { name: "진안고원시장 종합 리뉴얼", budget: 80 },
                        { name: "진안읍 스마트 주차관리 시스템", budget: 50 }
                    ]
                }
            ]
        };
        
        this.data.candidate = {
            profile: {
                name: "이우규",
                title: "민주당원 이우규",
                phone: "010-7366-8789",
                email: "leewukui@hanmail.net"
            },
            experience: [
                { title: "제8대 진안군의회 의원", status: "전" },
                { title: "더불어민주당 정책위부의장", status: "현" }
            ],
            vision: {
                description: "진안군의 미래를 이끌어갈 이우규를 소개합니다",
                summary: [
                    "삶의 질 향상 및 공동체 활력 증진",
                    "지속가능한 경제 성장"
                ]
            }
        };
    }
    
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`JSON 로딩 실패: ${url}`, error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const hash = window.location.hash.substring(1);
            if (hash && this.isValidSection(hash)) {
                this.showSection(hash);
            } else {
                this.showSection('home');
            }
        });
        
        // Handle touch events for mobile
        this.setupTouchEvents();
        
        // Handle keyboard shortcuts (CMS와 충돌하지 않도록 수정)
        this.setupKeyboardShortcuts();
    }
    
    isValidSection(sectionName) {
        const validSections = ['home', 'policies', 'about', 'news', 'membership', 'admin'];
        return validSections.includes(sectionName);
    }
    
    setupTouchEvents() {
        let touchStartY = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });
        
        const self = this;
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    self.goToNextSection();
                } else {
                    self.goToPrevSection();
                }
            }
        }
        
        this.handleSwipe = handleSwipe;
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // CMS가 활성화되어 있으면 CMS에서 처리하도록 함
            if (window.cmsManager && (window.cmsManager.editingElement || window.cmsManager.isAdminMode)) {
                return; // CMS가 처리하도록 둠
            }
            
            // 모달이 열려있으면 처리하지 않음
            const activeModal = document.querySelector('.popup-overlay:not(.hidden)');
            if (activeModal) {
                return;
            }
            
            if (e.key === 'Escape' && this.currentPolicyDetail) {
                if (window.PolicyManager) {
                    window.PolicyManager.showMainPolicies();
                }
                return;
            }
            
            // Number keys for quick navigation
            const keyMap = {
                '1': 'home',
                '2': 'policies', 
                '3': 'about',
                '4': 'news',
                '5': 'membership'
            };
            
            if (keyMap[e.key]) {
                this.showSection(keyMap[e.key]);
            }
        });
    }
    
    initializeNavigation() {
        if (window.Navigation) {
            window.Navigation.init();
        } else {
            console.warn('Navigation 모듈이 로드되지 않았습니다.');
            // 기본 네비게이션 설정
            this.setupBasicNavigation();
        }
    }
    
    setupBasicNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                if (section && this.isValidSection(section)) {
                    this.showSection(section);
                }
            });
        });
        
        // Logo click - CMS와 충돌하지 않도록 수정
        const logo = document.getElementById('app-logo');
        if (logo) {
            // CMS가 로고 클릭을 처리하므로 여기서는 제거
            // logo.addEventListener('click', (e) => {
            //     this.showSection('home');
            // });
        }
    }
    
    showSection(sectionName) {
        if (!this.isValidSection(sectionName)) {
            console.warn(`유효하지 않은 섹션: ${sectionName}`);
            return;
        }
        
        try {
            // Hide all sections
            document.querySelectorAll('.app-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            const targetSection = document.getElementById(sectionName);
            if (targetSection) {
                targetSection.classList.add('active');
                this.currentSection = sectionName;
                
                // Update navigation
                this.updateActiveNavLink(sectionName);
                
                // Update URL
                this.updateURL(sectionName);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
            } else {
                console.error(`섹션을 찾을 수 없습니다: ${sectionName}`);
            }
        } catch (error) {
            console.error('섹션 표시 중 오류:', error);
        }
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
        try {
            const newURL = sectionName === 'home' ? 
                window.location.pathname : 
                `${window.location.pathname}#${sectionName}`;
                
            window.history.pushState({ section: sectionName }, '', newURL);
        } catch (error) {
            console.warn('URL 업데이트 실패:', error);
        }
    }
    
    renderPolicies() {
        if (!this.data.policies) {
            console.warn('정책 데이터가 없습니다.');
            return;
        }
        
        try {
            if (window.PolicyManager) {
                window.PolicyManager.init(this.data.policies);
                window.PolicyManager.renderMainPolicies();
                window.PolicyManager.renderVisionByArea();
            } else {
                console.warn('PolicyManager가 로드되지 않았습니다.');
                this.renderBasicPolicies();
            }
        } catch (error) {
            console.error('정책 렌더링 중 오류:', error);
            this.renderBasicPolicies();
        }
    }
    
    renderBasicPolicies() {
        const container = document.getElementById('main-policies-grid');
        if (!container || !this.data.policies?.mainPolicies) return;
        
        try {
            container.innerHTML = this.data.policies.mainPolicies.map(policy => `
                <div class="policy-card" data-editable="policy-card-${policy.id}">
                    <h4 data-editable-field="title">${policy.title}</h4>
                    <p data-editable-field="summary">${policy.summary}</p>
                    <button class="detail-button" onclick="alert('정책 상세 내용: ${policy.title}')">상세보기</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('기본 정책 렌더링 중 오류:', error);
        }
    }
    
    renderCandidate() {
        if (!this.data.candidate) {
            console.warn('후보자 데이터가 없습니다.');
            return;
        }
        
        const profileContainer = document.getElementById('candidate-profile');
        if (!profileContainer) return;
        
        try {
            const { profile, experience, vision } = this.data.candidate;
            
            profileContainer.innerHTML = `
                <div class="hero-background" data-editable="candidate-background">
                    <div class="image-placeholder cms-image-trigger" data-image-type="candidate" data-image-id="candidate-background" style="height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; margin-bottom: 2rem; color: rgba(255,255,255,0.7); cursor: pointer;">
                        <div style="text-align: center;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9,12L11,14.5L15,9.5L20,15H4M2,6H14L16,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6Z"/>
                            </svg>
                            <p style="margin-top: 0.5rem;">후보자 사진 추가</p>
                        </div>
                    </div>
                </div>
                
                <h3 data-editable-field="description">${vision.description}</h3>
                
                <h3>주요 경력</h3>
                <ul>
                    ${experience.map(item => `
                        <li>${item.title} (${item.status})</li>
                    `).join('')}
                </ul>
                
                <div class="contact-info">
                    <h3 style="color: #1e3c72;">연락처</h3>
                    <p><strong>전화:</strong> ${profile.phone}</p>
                    <p><strong>이메일:</strong> ${profile.email}</p>
                </div>
                
                <h3>주요 공약 요약</h3>
                <ul>
                    ${vision.summary.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('후보자 정보 렌더링 중 오류:', error);
        }
        
        // 후보자 소개 섹션에 편집 속성 추가
        this.addCandidateEditableAttributes();
    }
    
    addCandidateEditableAttributes() {
        const profileContainer = document.getElementById('candidate-profile');
        if (!profileContainer) return;
        
        // 경력 목록에 편집 속성 추가
        const experienceItems = profileContainer.querySelectorAll('ul li');
        experienceItems.forEach((item, index) => {
            if (!item.hasAttribute('data-editable')) {
                item.setAttribute('data-editable', `experience-item-${index}`);
                item.setAttribute('data-editable-field', 'content');
            }
        });
        
        // 연락처 정보에 편집 속성 추가
        const contactInfo = profileContainer.querySelector('.contact-info');
        if (contactInfo) {
            const contactItems = contactInfo.querySelectorAll('p');
            contactItems.forEach((item, index) => {
                if (!item.hasAttribute('data-editable')) {
                    item.setAttribute('data-editable', `contact-item-${index}`);
                    item.setAttribute('data-editable-field', 'content');
                }
            });
        }
        
        // 주요 공약 요약에 편집 속성 추가
        const summaryItems = profileContainer.querySelectorAll('ul:last-of-type li');
        summaryItems.forEach((item, index) => {
            if (!item.hasAttribute('data-editable')) {
                item.setAttribute('data-editable', `summary-item-${index}`);
                item.setAttribute('data-editable-field', 'content');
            }
        });
        
        console.log('후보자 정보 편집 속성 추가 완료');
    }
    
    renderNews() {
        try {
            // 최근 활동 내용 렌더링
            const activitiesContainer = document.getElementById('recent-activities');
            if (activitiesContainer) {
                const activities = [
                    '진안군 발전을 위한 정책 연구 및 주민 간담회 개최',
                    '더불어민주당 전북특별자치도당 지방소멸대책 특별위원회 활동',
                    '진안군 각 면 단위 현장 방문 및 주민 의견 수렴'
                ];
                
                activitiesContainer.innerHTML = activities.map((activity, index) => `
                    <div class="faq-item" data-editable="activity-item-${index}">
                        <p data-editable-field="content">${activity}</p>
                    </div>
                `).join('');
            }
            
            // 주요 일정 렌더링
            const schedulesContainer = document.getElementById('upcoming-schedules');
            if (schedulesContainer) {
                const schedules = [
                    '주민과의 대화 - 매주 토요일 오후 2시',
                    '정책 발표회 - 매월 첫째 주 수요일',
                    '현장 방문 - 매주 평일 오전'
                ];
                
                schedulesContainer.innerHTML = schedules.map((schedule, index) => `
                    <div class="faq-item" data-editable="schedule-item-${index}">
                        <p data-editable-field="content">${schedule}</p>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('소식 렌더링 중 오류:', error);
        }
    }
    
    renderFAQ() {
        const faqContainer = document.getElementById('faq-container');
        if (!faqContainer) return;
        
        try {
            const faqs = [
                {
                    question: 'Q: 더불어민주당 당원으로 가입하려면 어떻게 해야하나요?',
                    answer: '위의 온라인 입당 신청 링크를 통해 간편하게 가입하실 수 있습니다.'
                },
                {
                    question: 'Q: 누구나 더불어민주당 당원으로 가입할 수 있나요?',
                    answer: '만 18세 이상 대한민국 국민이면 누구나 가입 가능합니다.'
                },
                {
                    question: 'Q: 입당 신청 후 처리까지는 얼마나 걸리나요?',
                    answer: '온라인 신청 후 보통 1-2주 내에 처리됩니다.'
                }
            ];
            
            faqContainer.innerHTML = faqs.map((faq, index) => `
                <div class="faq-item" data-editable="faq-item-${index}">
                    <strong data-editable-field="question">${faq.question}</strong>
                    <p data-editable-field="answer">${faq.answer}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('FAQ 렌더링 중 오류:', error);
        }
    }
    
    handleInitialRoute() {
        try {
            const hash = window.location.hash.substring(1);
            if (hash && this.isValidSection(hash)) {
                this.showSection(hash);
            } else {
                this.showSection('home');
            }
        } catch (error) {
            console.error('초기 라우팅 중 오류:', error);
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

    goToPrevSection() {
        const sections = ['home', 'policies', 'about', 'news', 'membership'];
        const currentIndex = sections.indexOf(this.currentSection);
        if (currentIndex > 0) {
            this.showSection(sections[currentIndex - 1]);
        }
    }
    
    showError(message) {
        console.error('에러 메시지:', message);
        
        // 기존 에러 메시지 제거
        const existingError = document.querySelector('.app-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 새 에러 메시지 생성
        const errorDiv = document.createElement('div');
        errorDiv.className = 'app-error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // Public methods for global access
    static getInstance() {
        if (!window.appInstance) {
            window.appInstance = new LeeWooKyuApp();
        }
        return window.appInstance;
    }
}

// Global functions for backward compatibility (CMS와 충돌하지 않도록 수정)
function showSection(sectionName) {
    if (window.appInstance) {
        window.appInstance.showSection(sectionName);
    } else if (window.Navigation) {
        window.Navigation.showSection(sectionName);
    } else {
        console.error('네비게이션 시스템을 사용할 수 없습니다.');
    }
}

function showPolicyDetail(detailId) {
    if (window.PolicyManager) {
        window.PolicyManager.showPolicyDetail(detailId);
    } else {
        console.error('PolicyManager를 사용할 수 없습니다.');
    }
}

function showMainPolicies() {
    if (window.PolicyManager) {
        window.PolicyManager.showMainPolicies();
    } else {
        console.error('PolicyManager를 사용할 수 없습니다.');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 앱 초기화 시작...');
    
    // CMS보다 먼저 앱을 초기화
    const app = LeeWooKyuApp.getInstance();
    app.init().catch(error => {
        console.error('앱 초기화 최종 실패:', error);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeeWooKyuApp;
}