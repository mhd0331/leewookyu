// Policy Management Module
class PolicyManager {
    constructor() {
        this.policies = null;
        this.currentDetailId = null;
        this.isInitialized = false;
    }
    
    init(policiesData) {
        this.policies = policiesData;
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('PolicyManager 초기화 완료');
    }
    
    setupEventListeners() {
        // Detail buttons - 이벤트 위임 사용
        document.addEventListener('click', (e) => {
            // CMS 모드일 때와 일반 모드일 때 다르게 처리
            const isAdminMode = window.cmsManager && window.cmsManager.isAdminMode;
            
            if (e.target.classList.contains('detail-button')) {
                const detailId = e.target.dataset.detail;
                if (detailId) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (isAdminMode) {
                        console.log('관리자 모드: 상세보기로 이동하여 편집 모드 활성화');
                    }
                    
                    this.showPolicyDetail(detailId);
                }
            }
            
            if (e.target.classList.contains('back-button')) {
                e.preventDefault();
                e.stopPropagation();
                this.showMainPolicies();
            }
            
            // Vision button 처리
            if (e.target.classList.contains('vision-button') || e.target.closest('.vision-button')) {
                const visionButton = e.target.classList.contains('vision-button') ? e.target : e.target.closest('.vision-button');
                const detailId = visionButton.dataset.detail;
                
                if (detailId) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('비전 버튼 클릭됨, 상세 페이지로 이동:', detailId);
                    this.showPolicyDetail(detailId);
                }
            }
        });
    }
    
    renderMainPolicies() {
        if (!this.policies?.mainPolicies) return;
        
        const container = document.getElementById('main-policies-grid');
        if (!container) return;
        
        container.innerHTML = this.policies.mainPolicies.map((policy, index) => `
            <div class="policy-card animate-fade-in-up" data-editable="main-policy-${index}" data-policy-id="${policy.id}">
                <div class="policy-card-content">
                    <h4 data-editable-field="title">${policy.title}</h4>
                    <p data-editable-field="summary">${policy.summary}</p>
                    <button class="detail-button" data-detail="${policy.id}">상세보기</button>
                </div>
            </div>
        `).join('');
        
        // 정책 상세 내용 렌더링
        this.renderPolicyDetails();
        
        // CMS가 활성화되어 있다면 편집 속성 추가 (카드는 편집 불가, 상세보기만 편집 가능)
        this.addEditableAttributesToPolicies();
        
        console.log('메인 정책 렌더링 완료');
    }
    
    renderVisionByArea() {
        if (!this.policies?.visionByArea) return;
        
        const container = document.getElementById('vision-grid');
        if (!container) return;
        
        // 기존 버튼 방식으로 되돌리되 스타일링은 유지
        container.innerHTML = this.policies.visionByArea.map((vision, index) => `
            <button class="vision-button" data-detail="${vision.id}" data-editable="vision-button-${index}">
                <span data-editable-field="name">${vision.name}</span>
            </button>
        `).join('');
        
        // 비전 상세 내용 렌더링
        this.renderVisionDetails();
        
        // CMS가 활성화되어 있다면 편집 속성 추가
        this.addEditableAttributesToVisions();
        this.setupImageClickHandlers();
        this.addVisionCardClickHandlers();
        
        // 디버깅: 생성된 버튼들 확인
        setTimeout(() => {
            const buttons = document.querySelectorAll('.vision-button');
            console.log(`총 ${buttons.length}개의 비전 버튼 생성됨:`);
            buttons.forEach((btn, i) => {
                console.log(`${i+1}. ${btn.textContent.trim()} -> ${btn.dataset.detail}`);
            });
        }, 100);
        
        console.log('지역별 비전 렌더링 완료');
    }
    
    renderPolicyDetails() {
        if (!this.policies?.mainPolicies) return;
        
        const container = document.getElementById('policy-details-container');
        if (!container) return;
        
        const detailsHTML = this.policies.mainPolicies.map((policy, policyIndex) => {
            return `
                <div id="${policy.id}" class="policy-detail" data-editable="policy-detail-${policyIndex}" data-policy-id="${policy.id}">
                    <div class="policy-detail-image" data-editable="policy-detail-image-${policyIndex}">
                        <div class="image-placeholder cms-image-trigger" data-image-type="policy-detail" data-image-id="policy-detail-${policyIndex}" style="height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; margin-bottom: 2rem; color: rgba(255,255,255,0.7); cursor: pointer;">
                            <div style="text-align: center;">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9,12L11,14.5L15,9.5L20,15H4M2,6H14L16,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6Z"/>
                                </svg>
                                <p style="margin-top: 0.5rem;">정책 이미지 추가</p>
                            </div>
                        </div>
                    </div>
                    <h4 data-editable-field="detail-title">${policy.title} 상세</h4>
                    <div class="policy-sections" data-editable="policy-sections-${policyIndex}">
                        ${this.renderPolicySections(policy.details.sections, policyIndex)}
                    </div>
                    <button class="back-button">돌아가기</button>
                </div>
            `;
        }).join('');
        
        container.innerHTML = detailsHTML;
        console.log('정책 상세 내용 렌더링 완료');
    }
    
    renderVisionDetails() {
        if (!this.policies?.visionByArea) return;
        
        const container = document.getElementById('policy-details-container');
        if (!container) return;
        
        const visionDetailsHTML = this.policies.visionByArea.map((vision, visionIndex) => {
            return `
                <div id="${vision.id}" class="policy-detail vision-detail" data-editable="vision-detail-${visionIndex}" data-vision-id="${vision.id}">
                    <div class="vision-detail-image" data-editable="vision-detail-image-${visionIndex}">
                        <div class="image-placeholder cms-image-trigger" data-image-type="vision-detail" data-image-id="vision-detail-${visionIndex}" style="height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #20bf6b 0%, #26d0ce 100%); border-radius: 15px; margin-bottom: 2rem; color: rgba(255,255,255,0.7); cursor: pointer;">
                            <div style="text-align: center;">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9,12L11,14.5L15,9.5L20,15H4M2,6H14L16,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6Z"/>
                                </svg>
                                <p style="margin-top: 0.5rem;">${vision.name} 이미지 추가</p>
                            </div>
                        </div>
                    </div>
                    <h4 data-editable-field="vision-title">${vision.title}</h4>
                    <div class="vision-info" data-editable="vision-info-${visionIndex}">
                        ${vision.budget > 0 ? `<p data-editable-field="budget"><strong>총 예산:</strong> ${vision.budget}억원</p>` : ''}
                    </div>
                    <div class="vision-plans" data-editable="vision-plans-${visionIndex}">
                        <h5 data-editable-field="plans-title">주요 계획</h5>
                        <ul>
                            ${vision.plans.map((plan, planIndex) => {
                                let planText = plan.name || plan;
                                if (plan.budget && plan.budget > 0) {
                                    planText += ` (${plan.budget}억원)`;
                                }
                                if (plan.period) {
                                    planText += ` - ${plan.period}`;
                                }
                                return `<li data-editable="vision-plan-${visionIndex}-${planIndex}" data-editable-field="plan-text">${planText}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                    <button class="back-button">돌아가기</button>
                </div>
            `;
        }).join('');
        
        // 기존 내용에 추가
        container.innerHTML += visionDetailsHTML;
        console.log('비전 상세 내용 렌더링 완료');
    }
    
    renderPolicySections(sections, policyIndex) {
        if (!sections || !Array.isArray(sections)) return '';
        
        return sections.map((section, sectionIndex) => `
            <div class="policy-section" data-editable="policy-section-${policyIndex}-${sectionIndex}">
                <h5 data-editable-field="section-title">${section.title}</h5>
                ${section.goal ? `<p data-editable="policy-goal-${policyIndex}-${sectionIndex}"><strong data-editable-field="goal-label">목표:</strong> <span data-editable-field="goal-text">${section.goal}</span></p>` : ''}
                ${section.plans ? `
                    <div data-editable="policy-plans-${policyIndex}-${sectionIndex}">
                        <p><strong data-editable-field="plans-label">세부추진방안:</strong></p>
                        <ul>
                            ${section.plans.map((plan, planIndex) => `
                                <li data-editable="policy-plan-${policyIndex}-${sectionIndex}-${planIndex}" data-editable-field="plan-text">${plan}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    showPolicyDetail(detailId) {
        console.log(`상세 페이지 표시 요청: ${detailId}`);
        
        // Hide main policies
        const mainPolicies = document.getElementById('main-policies');
        if (mainPolicies) {
            mainPolicies.style.display = 'none';
        }
        
        // Hide all details
        document.querySelectorAll('.policy-detail').forEach(detail => {
            detail.classList.remove('active');
        });

        // Show selected detail
        const targetDetail = document.getElementById(detailId);
        if (targetDetail) {
            targetDetail.classList.add('active');
            this.currentDetailId = detailId;
            
            console.log(`상세 페이지 표시 성공: ${detailId}`);
            
            // 상세 페이지에 편집 속성 추가 (관리자 모드일 때만)
            setTimeout(() => {
                if (window.cmsManager && window.cmsManager.isAdminMode) {
                    this.enableDetailPageEditing(detailId);
                }
                
                // 이미지 클릭 핸들러도 다시 설정
                this.setupImageClickHandlers();
            }, 100);
            
            // Scroll to top
            targetDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } else {
            console.error(`정책 상세를 찾을 수 없습니다: ${detailId}`);
            
            // 사용 가능한 모든 상세 페이지 ID 로그
            const availableDetails = Array.from(document.querySelectorAll('.policy-detail')).map(el => el.id);
            console.log('사용 가능한 상세 페이지 ID들:', availableDetails);
        }
    }
    
    enableDetailPageEditing(detailId) {
        const detailElement = document.getElementById(detailId);
        if (!detailElement) return;
        
        console.log(`상세 페이지 편집 모드 활성화: ${detailId}`);
        
        // 모든 텍스트 요소에 편집 속성 추가
        const editableElements = detailElement.querySelectorAll('h4, h5, p, li, strong, span');
        editableElements.forEach((element, index) => {
            if (!element.hasAttribute('data-editable') && !element.closest('[data-editable]')) {
                const tagName = element.tagName.toLowerCase();
                element.setAttribute('data-editable', `${detailId}-${tagName}-${index}`);
                element.setAttribute('data-editable-field', 'content');
                
                // 편집 가능 표시
                element.style.border = '1px dashed rgba(0, 123, 255, 0.3)';
                element.style.cursor = 'pointer';
                element.setAttribute('title', '클릭하여 편집');
                element.style.padding = '2px 4px';
                element.style.margin = '1px';
            }
        });
        
        // 상세 페이지 전체에 편집 모드 표시
        detailElement.style.border = '2px solid rgba(0, 123, 255, 0.5)';
        detailElement.style.borderRadius = '10px';
        
        if (window.cmsManager) {
            window.cmsManager.showMessage(`${detailId} 상세 페이지 편집 모드 활성화됨`, 'success');
        }
        
        console.log(`상세 페이지 편집 요소 ${editableElements.length}개 활성화 완료`);
    }
    
    showMainPolicies() {
        // Hide all details
        document.querySelectorAll('.policy-detail').forEach(detail => {
            detail.classList.remove('active');
            
            // 편집 모드 스타일 제거
            detail.style.border = '';
            detail.style.borderRadius = '';
            
            // 편집 요소들의 스타일 제거
            const editableElements = detail.querySelectorAll('[data-editable]');
            editableElements.forEach(element => {
                element.style.border = '';
                element.style.cursor = '';
                element.style.padding = '';
                element.style.margin = '';
                element.removeAttribute('title');
            });
        });

        // Show main policies
        const mainPolicies = document.getElementById('main-policies');
        if (mainPolicies) {
            mainPolicies.style.display = 'block';
            this.currentDetailId = null;
            
            // Scroll to top of policies section
            const policiesSection = document.getElementById('policies');
            if (policiesSection) {
                policiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            console.log('메인 정책 페이지로 돌아감');
        }
    }
    
    // CMS 관련 메서드들
    addEditableAttributesToPolicies() {
        // 정책 카드들은 편집하지 않음 (상세보기에서만 편집)
        document.querySelectorAll('.policy-card').forEach((card, index) => {
            // 편집 속성 제거 (상세보기 버튼만 작동하도록)
            card.removeAttribute('data-editable');
            
            // 제목과 요약도 편집 불가
            const title = card.querySelector('h4');
            const summary = card.querySelector('p');
            
            if (title) {
                title.removeAttribute('data-editable-field');
            }
            if (summary) {
                summary.removeAttribute('data-editable-field');
            }
        });
        
        console.log('정책 카드 편집 속성 제거 완료 (상세보기에서만 편집 가능)');
    }
    
    addEditableAttributesToVisions() {
        // 비전 버튼들은 편집하지 않음 (상세보기에서만 편집)
        document.querySelectorAll('.vision-button').forEach((button, index) => {
            // 편집 속성 제거 (상세보기 이동만 가능하도록)
            button.removeAttribute('data-editable');
            
            // 텍스트도 편집 불가
            const span = button.querySelector('span');
            if (span) {
                span.removeAttribute('data-editable-field');
            }
            button.removeAttribute('data-editable-field');
        });
        
        console.log('비전 버튼 편집 속성 제거 완료 (상세보기에서만 편집 가능)');
    }
    
    setupImageClickHandlers() {
        console.log('이미지 클릭 핸들러 설정 중...');
        
        // 기존 리스너 제거 후 새로 추가
        document.removeEventListener('click', this.imageClickHandler);
        
        this.imageClickHandler = (e) => {
            console.log('클릭 이벤트 감지:', e.target);
            
            // CMS 모드가 아니면 이미지 업로드 불가
            if (!window.cmsManager || !window.cmsManager.isAdminMode) {
                console.log('CMS 모드가 아님');
                return;
            }
            
            // cms-image-trigger 클래스를 가진 요소 찾기
            const imageTarget = e.target.closest('.cms-image-trigger');
            if (imageTarget) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('이미지 트리거 클릭됨:', imageTarget);
                
                const imageType = imageTarget.dataset.imageType;
                const imageId = imageTarget.dataset.imageId;
                
                console.log('이미지 타입:', imageType, '이미지 ID:', imageId);
                
                if (window.imageManager) {
                    // 이미지 매니저에 타입과 ID 정보 전달
                    const editableContainer = imageTarget.closest('[data-editable]');
                    if (editableContainer) {
                        editableContainer.setAttribute('data-image-type', imageType);
                        editableContainer.setAttribute('data-image-id', imageId);
                        window.imageManager.openImageManager(editableContainer);
                    }
                } else {
                    console.error('ImageManager를 찾을 수 없습니다.');
                    if (window.cmsManager) {
                        window.cmsManager.showMessage('이미지 매니저를 사용할 수 없습니다.', 'error');
                    }
                }
                
                return false;
            }
        };
        
        document.addEventListener('click', this.imageClickHandler, true);
        console.log('이미지 클릭 핸들러 설정 완료');
    }
    
    addVisionCardClickHandlers() {
        console.log('비전 버튼 클릭 핸들러 설정 중...');
        
        // 모든 비전 버튼에 대해 개별적으로 이벤트 리스너 추가
        document.querySelectorAll('.vision-button').forEach((button, index) => {
            const detailId = button.dataset.detail;
            console.log(`비전 버튼 ${index}: ${button.textContent.trim()} -> ${detailId}`);
            
            // 기존 리스너 제거 (중복 방지)
            button.removeEventListener('click', button._visionClickHandler);
            
            // 새 클릭 핸들러 생성 (편집 모드 체크 제거 - 항상 상세 페이지로 이동)
            button._visionClickHandler = (e) => {
                console.log(`비전 버튼 클릭됨: ${button.textContent.trim()}, detailId: ${detailId}`);
                
                // 상세 페이지로 이동 (편집 모드 상관없이)
                if (detailId) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('상세 페이지로 이동:', detailId);
                    this.showPolicyDetail(detailId);
                } else {
                    console.error('detailId가 없습니다:', button);
                }
            };
            
            // 이벤트 리스너 추가
            button.addEventListener('click', button._visionClickHandler);
        });
        
        console.log('비전 버튼 클릭 핸들러 설정 완료');
    }
    
    addEditableAttributesToDetailPage(detailId) {
        const detailElement = document.getElementById(detailId);
        if (!detailElement) return;
        
        // 상세 페이지의 모든 요소에 편집 속성이 있는지 확인
        const elementsToCheck = [
            'h4', 'h5', 'p', 'li', 'strong', 'span'
        ];
        
        elementsToCheck.forEach(tag => {
            const elements = detailElement.querySelectorAll(tag);
            elements.forEach((element, index) => {
                if (!element.hasAttribute('data-editable') && !element.hasAttribute('data-editable-field')) {
                    // 가장 가까운 편집 가능한 부모 찾기
                    const editableParent = element.closest('[data-editable]');
                    if (!editableParent) {
                        // 독립적인 편집 요소로 만들기
                        element.setAttribute('data-editable', `detail-${detailId}-${tag}-${index}`);
                        element.setAttribute('data-editable-field', 'content');
                    }
                }
            });
        });
        
        // CMS가 활성화되어 있다면 하이라이트 추가
        if (window.cmsManager && window.cmsManager.isAdminMode) {
            this.highlightDetailPageElements(detailElement);
        }
        
        console.log(`상세 페이지 편집 속성 추가 완료: ${detailId}`);
    }
    
    highlightDetailPageElements(detailElement) {
        const editableElements = detailElement.querySelectorAll('[data-editable], [data-editable-field]');
        editableElements.forEach(element => {
            element.style.position = 'relative';
            element.style.cursor = 'pointer';
            element.setAttribute('title', '클릭하여 편집');
        });
        
        console.log(`상세 페이지 요소 하이라이트 완료: ${editableElements.length}개`);
    }
    
    // 데이터 업데이트 메서드들
    updatePolicyData(policyId, field, value) {
        if (!this.policies) return false;
        
        // 메인 정책에서 찾기
        const mainPolicy = this.policies.mainPolicies.find(p => p.id === policyId);
        if (mainPolicy) {
            if (field === 'title') {
                mainPolicy.title = value;
            } else if (field === 'summary') {
                mainPolicy.summary = value;
            }
            return true;
        }
        
        // 비전에서 찾기
        const vision = this.policies.visionByArea.find(v => v.id === policyId);
        if (vision) {
            if (field === 'name') {
                vision.name = value;
            } else if (field === 'title') {
                vision.title = value;
            }
            return true;
        }
        
        return false;
    }
    
    updateVisionPlan(visionId, planIndex, value) {
        if (!this.policies) return false;
        
        const vision = this.policies.visionByArea.find(v => v.id === visionId);
        if (vision && vision.plans[planIndex]) {
            if (typeof vision.plans[planIndex] === 'string') {
                vision.plans[planIndex] = value;
            } else {
                vision.plans[planIndex].name = value;
            }
            return true;
        }
        
        return false;
    }
    
    // 전체 재렌더링 메서드
    reRenderAll() {
        this.renderMainPolicies();
        this.renderVisionByArea();
        
        // 현재 상세 페이지가 표시되고 있다면 다시 표시
        if (this.currentDetailId) {
            setTimeout(() => {
                this.showPolicyDetail(this.currentDetailId);
            }, 100);
        }
        
        console.log('전체 정책 콘텐츠 재렌더링 완료');
    }
    
    // Getter 메서드들
    getCurrentDetailId() {
        return this.currentDetailId;
    }
    
    getPolicyById(id) {
        if (!this.policies) return null;
        
        return [...this.policies.mainPolicies, ...this.policies.visionByArea]
            .find(policy => policy.id === id);
    }
    
    getPoliciesData() {
        return this.policies;
    }
    
    // 검색 기능
    searchPolicies(query) {
        if (!this.policies || !query) return [];
        
        const allPolicies = [
            ...this.policies.mainPolicies,
            ...this.policies.visionByArea
        ];
        
        return allPolicies.filter(policy => {
            const searchText = `${policy.title} ${policy.summary || ''} ${policy.name || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
    }
    
    // 통계 정보
    getStatistics() {
        if (!this.policies) return null;
        
        const totalBudget = this.policies.visionByArea.reduce((total, vision) => {
            return total + (vision.budget || 0);
        }, 0);
        
        return {
            mainPoliciesCount: this.policies.mainPolicies.length,
            visionsCount: this.policies.visionByArea.length,
            totalBudget: totalBudget,
            editableElementsCount: document.querySelectorAll('[data-editable]').length
        };
    }
}

// Create global instance
const policyManager = new PolicyManager();

// Global access
window.PolicyManager = policyManager;

// CMS와의 연동을 위한 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    // CMS 모드 변경 감지
    document.addEventListener('cms-mode-changed', (e) => {
        if (e.detail.isAdminMode && window.PolicyManager.isInitialized) {
            // 관리자 모드가 활성화되면 모든 정책 요소에 편집 속성 추가
            setTimeout(() => {
                window.PolicyManager.addEditableAttributesToPolicies();
                window.PolicyManager.addEditableAttributesToVisions();
                
                // 현재 상세 페이지가 열려있다면 편집 속성 추가
                if (window.PolicyManager.currentDetailId) {
                    window.PolicyManager.addEditableAttributesToDetailPage(window.PolicyManager.currentDetailId);
                }
            }, 500);
        }
    });
});