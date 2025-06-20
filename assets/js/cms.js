// CMS Management System (완전한 수정 버전 - 이미지 첨부 문제 해결)
class CMSManager {
    constructor() {
        this.isAdminMode = false;
        this.isLoggedIn = false;
        this.currentUser = null;
        this.credentials = {
            admin: 'leewookyu2026!',
            editor: 'jinan2026!'
        };
        this.editingElement = null;
        this.originalContent = null;
        this.logoClickCount = 0;
        this.isInitialized = false;
        
        // 충돌 방지를 위한 타이머
        this.logoClickTimer = null;
    }
    
    init() {
        if (this.isInitialized) return;
        
        try {
            console.log('🔧 CMS 초기화 시작...');
            
            // App 초기화 완료를 기다림
            this.waitForAppInitialization();
            
            this.setupAdminToggle();
            this.setupLoginModal();
            this.setupContentEditor();
            this.checkLoginStatus();
            this.setupEventListeners();
            
            // 디버깅 모드 활성화
            this.debugMode = localStorage.getItem('cms_debug_mode') === 'true';
            if (this.debugMode) {
                console.log('🐛 CMS 디버깅 모드 활성화');
                this.enableDebugLogging();
            }
            
            this.isInitialized = true;
            console.log('✅ CMS 초기화 완료');
        } catch (error) {
            console.error('❌ CMS 초기화 실패:', error);
        }
    }
    
    waitForAppInitialization() {
        // App이 초기화될 때까지 대기 (최대 5초)
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkApp = () => {
            if (window.appInstance && window.appInstance.isInitialized) {
                console.log('✅ App 초기화 확인됨, CMS 초기화 진행');
                return true;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkApp, 100);
            } else {
                console.warn('⚠️ App 초기화를 기다리다 타임아웃, CMS 단독 초기화 진행');
            }
        };
        
        checkApp();
    }
    
    setupAdminToggle() {
        // Logo click handler - App.js와 충돌하지 않도록 수정
        const logo = document.getElementById('app-logo');
        
        if (logo) {
            // 기존 이벤트 리스너 제거 방지를 위해 capture phase 사용
            logo.addEventListener('click', (e) => {
                this.handleLogoClick(e);
            }, true); // capture phase로 먼저 처리
        }
        
        // Admin mode button
        const adminBtn = document.getElementById('admin-mode-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.isLoggedIn) {
                    this.showLoginModal();
                } else {
                    this.toggleAdminMode();
                }
            });
        }
    }
    
    handleLogoClick(e) {
        // 관리자 모드가 이미 활성화되어 있으면 일반 네비게이션 허용
        if (this.isAdminMode) {
            return; // 이벤트를 중단하지 않고 App.js가 처리하도록 함
        }
        
        this.logoClickCount++;
        console.log(`로고 클릭 횟수: ${this.logoClickCount}`);
        
        // 타이머 초기화
        if (this.logoClickTimer) {
            clearTimeout(this.logoClickTimer);
        }
        
        if (this.logoClickCount >= 3) {
            // 3번째 클릭에서 관리자 토글 표시
            e.preventDefault();
            e.stopPropagation();
            this.showAdminToggle();
            this.logoClickCount = 0;
            return false;
        }
        
        // 3초 후 카운터 리셋
        this.logoClickTimer = setTimeout(() => {
            this.logoClickCount = 0;
        }, 3000);
    }
    
    setupLoginModal() {
        const loginForm = document.getElementById('admin-login-form');
        const cancelBtn = document.getElementById('admin-login-cancel');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }
    }
    
    setupContentEditor() {
        const saveBtn = document.getElementById('save-content');
        const cancelBtn = document.getElementById('cancel-edit');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveContent();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelEdit();
            });
        }
    }
    
    setupEventListeners() {
        console.log('🔧 CMS 이벤트 리스너 설정...');
        
        // Click outside to close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-overlay')) {
                if (e.target.id === 'admin-login-modal') {
                    this.hideLoginModal();
                } else if (e.target.id === 'content-editor-modal') {
                    this.cancelEdit();
                }
            }
        });
        
        // 이미지 클릭 핸들러 (수정됨 - 더 강력한 이벤트 처리)
        this.setupImageClickHandler();
        
        // 편집 가능한 콘텐츠 클릭 핸들러
        this.setupContentClickHandler();
        
        // 키보드 이벤트 핸들러
        this.setupKeyboardHandler();
        
        console.log('✅ CMS 이벤트 리스너 설정 완료');
    }
    
    setupImageClickHandler() {
        console.log('🖼️ 이미지 클릭 핸들러 설정...');
        
        // 이미지 클릭을 위한 전용 핸들러
        this.imageClickHandler = (e) => {
            // CMS 모드가 아니면 처리하지 않음
            if (!this.isAdminMode) {
                return;
            }
            
            // cms-image-trigger 클래스를 가진 요소 찾기
            const imageTarget = e.target.closest('.cms-image-trigger');
            if (imageTarget) {
                console.log('🖼️ 이미지 트리거 클릭 감지:', imageTarget);
                
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                this.handleImageClick(imageTarget);
                return false;
            }
        };
        
        // 캡처 단계에서 이벤트 처리 (최우선)
        document.addEventListener('click', this.imageClickHandler, true);
        
        // 추가로 일반 단계에서도 처리 (이중 보장)
        document.addEventListener('click', this.imageClickHandler, false);
        
        console.log('✅ 이미지 클릭 핸들러 설정 완료');
    }
    
    setupContentClickHandler() {
        console.log('📝 콘텐츠 클릭 핸들러 설정...');
        
        // 편집 가능한 콘텐츠 클릭 처리
        this.contentClickHandler = (e) => {
            if (!this.isAdminMode) return;
            
            // 이미지 트리거는 별도 처리하므로 제외
            if (e.target.closest('.cms-image-trigger')) {
                return;
            }
            
            const editableElement = e.target.closest('[data-editable]');
            if (editableElement) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📝 편집 가능한 요소 클릭됨:', editableElement);
                this.editContent(editableElement);
                return false;
            }
        };
        
        document.addEventListener('click', this.contentClickHandler, true);
        console.log('✅ 콘텐츠 클릭 핸들러 설정 완료');
    }
    
    setupKeyboardHandler() {
        // 키보드 단축키 처리
        document.addEventListener('keydown', (e) => {
            // CMS 모달이 열려있을 때만 처리
            if (this.editingElement) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.cancelEdit();
                    return false;
                }
                
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.saveContent();
                    return false;
                }
            }
            
            // 로그인 모달이 열려있을 때
            const loginModal = document.getElementById('admin-login-modal');
            if (loginModal && !loginModal.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideLoginModal();
                    return false;
                }
            }
        });
    }
    
    // 이미지 클릭 핸들러 (수정됨)
    handleImageClick(imageElement) {
        const imageType = imageElement.getAttribute('data-image-type');
        const imageId = imageElement.getAttribute('data-image-id');
        
        console.log('🖼️ 이미지 클릭 처리:', { 
            element: imageElement,
            imageType, 
            imageId,
            imageManager: !!window.imageManager
        });
        
        if (!window.imageManager) {
            this.showMessage('이미지 매니저를 찾을 수 없습니다. 페이지를 새로고침해주세요.', 'error');
            console.error('❌ 이미지 매니저가 없습니다.');
            return;
        }
        
        // 이미지 매니저가 초기화되어 있는지 확인
        if (!window.imageManager.isInitialized) {
            console.log('🔄 이미지 매니저 재초기화 시도...');
            try {
                window.imageManager.init();
                this.showMessage('이미지 매니저를 재초기화했습니다.', 'info');
            } catch (error) {
                console.error('❌ 이미지 매니저 재초기화 실패:', error);
                this.showMessage('이미지 매니저 초기화 실패: ' + error.message, 'error');
                return;
            }
        }
        
        // 이미지 매니저에 타입과 ID 정보 전달
        const editableContainer = imageElement.closest('[data-editable]') || imageElement;
        
        // 컨테이너에 이미지 정보 설정
        editableContainer.setAttribute('data-image-type', imageType);
        editableContainer.setAttribute('data-image-id', imageId);
        
        console.log('🚀 이미지 매니저 호출:', {
            container: editableContainer,
            type: imageType,
            id: imageId
        });
        
        try {
            // 이미지 매니저 열기
            window.imageManager.openImageManager(editableContainer);
            console.log('✅ 이미지 매니저 열기 성공');
        } catch (error) {
            console.error('❌ 이미지 매니저 열기 실패:', error);
            this.showMessage(`이미지 매니저 오류: ${error.message}`, 'error');
        }
    }
    
    showAdminToggle() {
        const toggle = document.getElementById('admin-toggle');
        if (toggle) {
            toggle.classList.remove('hidden');
            
            // Animation
            toggle.style.transform = 'scale(0)';
            toggle.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                toggle.style.transform = 'scale(1)';
            }, 10);
            
            console.log('관리자 토글 표시됨');
            this.showMessage('관리자 토글이 활성화되었습니다. 버튼을 클릭하여 로그인하세요.', 'info');
        }
    }
    
    showLoginModal() {
        const modal = document.getElementById('admin-login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const usernameInput = document.getElementById('admin-username');
            if (usernameInput) {
                usernameInput.focus();
            }
        }
    }
    
    hideLoginModal() {
        const modal = document.getElementById('admin-login-modal');
        if (modal) {
            modal.classList.add('hidden');
            const form = document.getElementById('admin-login-form');
            if (form) {
                form.reset();
            }
        }
    }
    
    handleLogin() {
        const username = document.getElementById('admin-username')?.value?.trim();
        const password = document.getElementById('admin-password')?.value;
        
        if (!username || !password) {
            this.showMessage('아이디와 비밀번호를 입력해주세요.', 'error');
            return;
        }
        
        if (this.credentials[username] === password) {
            this.isLoggedIn = true;
            this.currentUser = username;
            
            // 세션 저장
            const loginData = {
                user: username,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            try {
                sessionStorage.setItem('cms_login', JSON.stringify(loginData));
            } catch (error) {
                console.warn('세션 저장 실패:', error);
            }
            
            this.hideLoginModal();
            this.showMessage('로그인 성공!', 'success');
            this.updateAdminButton();
            this.enableAdminMode();
        } else {
            this.showMessage('아이디 또는 비밀번호가 잘못되었습니다.', 'error');
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) {
                passwordInput.value = '';
            }
        }
    }
    
    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.disableAdminMode();
        this.updateAdminButton();
        
        try {
            sessionStorage.removeItem('cms_login');
        } catch (error) {
            console.warn('세션 제거 실패:', error);
        }
        
        if (this.editingElement) {
            this.cancelEdit();
        }
        
        this.showMessage('로그아웃되었습니다.', 'info');
    }
    
    toggleAdminMode() {
        if (this.isAdminMode) {
            this.disableAdminMode();
        } else {
            this.enableAdminMode();
        }
    }
    
    enableAdminMode() {
        console.log('🔓 관리자 모드 활성화...');
        
        this.isAdminMode = true;
        document.body.classList.add('admin-mode');
        
        const adminNav = document.getElementById('admin-nav');
        if (adminNav) {
            adminNav.classList.remove('hidden');
        }
        
        this.updateAdminButton();
        this.renderAdminPanel();
        this.highlightEditableElements();
        this.makeDynamicContentEditable();
        
        // 정책 관련 편집 요소 추가
        this.addPolicyEditableAttributes();
        
        // Header 이미지 영역 활성화
        this.activateHeaderImageArea();
        
        // 모든 이미지 영역 활성화
        this.activateAllImageAreas();
        
        // CMS 모드 변경 이벤트 발생
        document.dispatchEvent(new CustomEvent('cms-mode-changed', {
            detail: { isAdminMode: true }
        }));
        
        this.showMessage('관리자 모드가 활성화되었습니다. 파란색 영역을 클릭하여 이미지를 추가하고, 텍스트를 클릭하여 편집하세요.', 'success');
        console.log('✅ 관리자 모드 활성화 완료');
    }
    
    disableAdminMode() {
        console.log('🔒 관리자 모드 비활성화...');
        
        this.isAdminMode = false;
        document.body.classList.remove('admin-mode');
        
        const adminNav = document.getElementById('admin-nav');
        if (adminNav) {
            adminNav.classList.add('hidden');
        }
        
        this.updateAdminButton();
        this.removeEditableHighlight();
        
        // Go back to home if in admin section
        if (window.appInstance && window.appInstance.currentSection === 'admin') {
            window.appInstance.showSection('home');
        }
        
        this.showMessage('관리자 모드가 비활성화되었습니다.', 'info');
        console.log('✅ 관리자 모드 비활성화 완료');
    }
    
    // Header 이미지 영역 활성화
    activateHeaderImageArea() {
        const headerImage = document.querySelector('.header-top-image');
        if (headerImage) {
            const placeholder = headerImage.querySelector('.image-placeholder');
            if (placeholder) {
                placeholder.style.border = '3px dashed rgba(0, 123, 255, 0.6)';
                placeholder.style.cursor = 'pointer';
                placeholder.setAttribute('title', '클릭하여 헤더 이미지 추가');
                console.log('📌 Header 이미지 영역 활성화됨');
            }
        }
    }
    
    // 모든 이미지 영역 활성화
    activateAllImageAreas() {
        console.log('🖼️ 모든 이미지 영역 활성화...');
        
        // 모든 이미지 트리거 요소 찾기
        const imageAreas = document.querySelectorAll('.cms-image-trigger');
        
        imageAreas.forEach((area, index) => {
            // 시각적 표시 추가
            area.style.border = '3px dashed rgba(0, 123, 255, 0.6)';
            area.style.cursor = 'pointer';
            area.style.transition = 'all 0.3s ease';
            area.setAttribute('title', '클릭하여 이미지 추가/변경');
            
            // 호버 효과 추가
            const originalBorder = area.style.border;
            
            area.addEventListener('mouseenter', () => {
                area.style.border = '3px solid rgba(0, 123, 255, 1)';
                area.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
                area.style.transform = 'scale(1.02)';
            });
            
            area.addEventListener('mouseleave', () => {
                area.style.border = originalBorder;
                area.style.backgroundColor = '';
                area.style.transform = 'scale(1)';
            });
            
            console.log(`이미지 영역 ${index + 1} 활성화:`, {
                type: area.dataset.imageType,
                id: area.dataset.imageId
            });
        });
        
        console.log(`✅ 총 ${imageAreas.length}개 이미지 영역 활성화 완료`);
    }
    
    updateAdminButton() {
        const btn = document.getElementById('admin-mode-btn');
        const span = btn?.querySelector('span');
        
        if (span) {
            if (!this.isLoggedIn) {
                span.textContent = '관리자';
            } else if (this.isAdminMode) {
                span.textContent = '종료';
            } else {
                span.textContent = '관리';
            }
        }
    }
    
    editContent(element) {
        if (!element) {
            console.error('편집할 요소가 없습니다.');
            return;
        }
        
        this.editingElement = element;
        this.originalContent = this.getElementContent(element);
        
        const modal = document.getElementById('content-editor-modal');
        const title = document.getElementById('editor-title');
        const content = document.getElementById('editor-content');
        
        if (!modal || !title || !content) {
            console.error('편집 모달 요소를 찾을 수 없습니다.');
            return;
        }
        
        title.textContent = `${this.getElementLabel(element)} 편집`;
        content.innerHTML = this.generateEditor(element);
        
        modal.classList.remove('hidden');
        
        // Focus first input
        const firstInput = content.querySelector('input, textarea');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }
    
    getElementLabel(element) {
        const editableType = element.getAttribute('data-editable');
        const labels = {
            'hero': '메인 히어로',
            'main-message': '메인 메시지',
            'about': '소개',
            'news': '소식',
            'policy': '정책',
            'header-top-image': 'Header 이미지'
        };
        return labels[editableType] || '콘텐츠';
    }
    
    getElementContent(element) {
        const fields = element.querySelectorAll('[data-editable-field]');
        const content = {};
        
        if (fields.length === 0) {
            const textContent = element.textContent || element.innerText || '';
            const htmlContent = element.innerHTML || '';
            
            return {
                text: textContent.trim(),
                html: htmlContent.trim()
            };
        }
        
        fields.forEach((field, index) => {
            const fieldName = field.getAttribute('data-editable-field') || `field_${index}`;
            
            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                content[fieldName] = field.value;
            } else {
                content[fieldName] = field.innerHTML || field.textContent || '';
            }
        });
        
        return content;
    }
    
    generateEditor(element) {
        const fields = element.querySelectorAll('[data-editable-field]');
        let html = '<form class="admin-form">';
        
        if (fields.length === 0) {
            const content = element.innerHTML || element.textContent || '';
            const isLongText = content.length > 100;
            
            html += `
                <div class="form-group">
                    <label for="edit-content">내용:</label>
                    ${isLongText ? 
                        `<textarea id="edit-content" name="content" rows="5">${this.escapeHtml(content)}</textarea>` :
                        `<input type="text" id="edit-content" name="content" value="${this.escapeHtml(content)}">`
                    }
                </div>
            `;
        } else {
            fields.forEach((field, index) => {
                const fieldName = field.getAttribute('data-editable-field') || `field_${index}`;
                const fieldContent = field.innerHTML || field.textContent || '';
                const isTextarea = fieldContent.length > 100 || fieldContent.includes('<br>');
                
                html += `
                    <div class="form-group">
                        <label for="edit-${fieldName}">${this.getFieldLabel(fieldName)}:</label>
                        ${isTextarea ? 
                            `<textarea id="edit-${fieldName}" name="${fieldName}" rows="4">${this.escapeHtml(fieldContent)}</textarea>` :
                            `<input type="text" id="edit-${fieldName}" name="${fieldName}" value="${this.escapeHtml(fieldContent)}">`
                        }
                    </div>
                `;
            });
        }
        
        html += '</form>';
        return html;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    getFieldLabel(fieldName) {
        const labels = {
            'title': '제목',
            'subtitle': '부제목',
            'heading': '제목',
            'content': '내용',
            'description': '설명',
            'question': '질문',
            'answer': '답변'
        };
        return labels[fieldName] || fieldName;
    }
    
    saveContent() {
        if (!this.editingElement) return;
        
        const form = document.querySelector('#editor-content form');
        if (!form) return;
        
        const formData = new FormData(form);
        const fields = this.editingElement.querySelectorAll('[data-editable-field]');
        
        if (fields.length === 0) {
            const newContent = formData.get('content');
            if (newContent !== null) {
                this.editingElement.innerHTML = newContent;
            }
        } else {
            fields.forEach((field, index) => {
                const fieldName = field.getAttribute('data-editable-field') || `field_${index}`;
                const newValue = formData.get(fieldName);
                
                if (newValue !== null) {
                    if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                        field.value = newValue;
                    } else {
                        field.innerHTML = newValue;
                    }
                }
            });
        }
        
        this.saveToStorage();
        this.hideContentEditor();
        this.showMessage('내용이 저장되었습니다.', 'success');
    }
    
    cancelEdit() {
        this.hideContentEditor();
        this.editingElement = null;
        this.originalContent = null;
    }
    
    hideContentEditor() {
        const modal = document.getElementById('content-editor-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    saveToStorage() {
        try {
            const contentData = this.extractAllContent();
            localStorage.setItem('cms_content_latest', JSON.stringify(contentData));
            console.log('💾 CMS 콘텐츠 저장 완료');
        } catch (error) {
            console.error('❌ 저장 실패:', error);
            this.showMessage('저장 중 오류가 발생했습니다.', 'error');
        }
    }
    
    extractAllContent() {
        const content = {};
        
        document.querySelectorAll('[data-editable]').forEach(element => {
            const type = element.getAttribute('data-editable');
            content[type] = this.getElementContent(element);
        });
        
        return {
            timestamp: new Date().toISOString(),
            user: this.currentUser,
            content: content
        };
    }
    
    checkLoginStatus() {
        try {
            const savedLogin = sessionStorage.getItem('cms_login');
            if (savedLogin) {
                const loginData = JSON.parse(savedLogin);
                if (loginData?.user && loginData?.timestamp) {
                    const loginTime = new Date(loginData.timestamp);
                    const now = new Date();
                    const diffHours = (now - loginTime) / (1000 * 60 * 60);
                    
                    if (diffHours < 24) {
                        this.isLoggedIn = true;
                        this.currentUser = loginData.user;
                        this.updateAdminButton();
                        console.log('✅ 로그인 상태 복원:', loginData.user);
                    } else {
                        sessionStorage.removeItem('cms_login');
                        console.log('🕐 로그인 세션 만료');
                    }
                }
            }
        } catch (error) {
            console.error('❌ 로그인 상태 확인 중 오류:', error);
        }
    }
    
    makeDynamicContentEditable() {
        console.log('📝 동적 편집 요소 생성...');
        
        // 정책 카드들에 편집 속성 추가
        document.querySelectorAll('.policy-card').forEach((card, index) => {
            if (!card.hasAttribute('data-editable')) {
                card.setAttribute('data-editable', `policy-card-${index}`);
                
                const title = card.querySelector('h4');
                const summary = card.querySelector('p');
                
                if (title && !title.hasAttribute('data-editable-field')) {
                    title.setAttribute('data-editable-field', 'title');
                }
                if (summary && !summary.hasAttribute('data-editable-field')) {
                    summary.setAttribute('data-editable-field', 'summary');
                }
            }
        });
        
        // FAQ 아이템들에 편집 속성 추가
        document.querySelectorAll('#faq-container .faq-item').forEach((item, index) => {
            if (!item.hasAttribute('data-editable')) {
                item.setAttribute('data-editable', `faq-item-${index}`);
                
                const question = item.querySelector('strong');
                const answer = item.querySelector('p');
                
                if (question && !question.hasAttribute('data-editable-field')) {
                    question.setAttribute('data-editable-field', 'question');
                }
                if (answer && !answer.hasAttribute('data-editable-field')) {
                    answer.setAttribute('data-editable-field', 'answer');
                }
            }
        });
        
        console.log('✅ 동적 편집 요소 생성 완료');
    }
    
    highlightEditableElements() {
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.style.position = 'relative';
            element.style.cursor = 'pointer';
            element.setAttribute('title', '클릭하여 편집');
        });
        
        console.log(`✅ ${editableElements.length}개의 편집 가능한 요소 하이라이트 완료`);
    }
    
    removeEditableHighlight() {
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.style.cursor = '';
            element.removeAttribute('title');
        });
        
        // 이미지 영역 스타일 제거
        const imageAreas = document.querySelectorAll('.cms-image-trigger');
        imageAreas.forEach(area => {
            area.style.border = '';
            area.style.cursor = '';
            area.style.backgroundColor = '';
            area.style.transform = '';
            area.removeAttribute('title');
        });
        
        console.log('🧹 편집 요소 하이라이트 제거 완료');
    }
    
    renderAdminPanel() {
        const panel = document.getElementById('admin-panel');
        if (!panel) return;
        
        panel.innerHTML = `
            <div class="admin-dashboard">
                <div class="admin-card content">
                    <h3>콘텐츠 관리</h3>
                    <p>페이지의 텍스트 내용을 편집할 수 있습니다.</p>
                    <button class="admin-btn" onclick="window.cmsManager.refreshEditableElements()">편집 요소 새로고침</button>
                    <button class="admin-btn" onclick="window.cmsManager.addPolicyEditableAttributes()">정책 편집 활성화</button>
                </div>
                
                <div class="admin-card policies">
                    <h3>정책 관리</h3>
                    <p>6대 비전과 면단위 공약을 수정할 수 있습니다.</p>
                    <button class="admin-btn" onclick="window.cmsManager.goToPoliciesAndEdit()">정책 섹션으로 이동</button>
                    <button class="admin-btn" onclick="window.cmsManager.enablePolicyDetailEdit()">상세 페이지 편집 활성화</button>
                </div>
                
                <div class="admin-card images">
                    <h3>이미지 관리</h3>
                    <p>Header, Hero, 정책, 면단위 비전에 이미지를 추가하고 관리합니다.</p>
                    <button class="admin-btn" onclick="window.imageManager?.openImageManager()">이미지 관리자 열기</button>
                    <button class="admin-btn" onclick="window.cmsManager.testHeaderImage()">Header 이미지 테스트</button>
                    <button class="admin-btn" onclick="window.cmsManager.addImagePlaceholders()">이미지 영역 활성화</button>
                    <button class="admin-btn" onclick="window.cmsManager.debugImageSystem()">이미지 시스템 진단</button>
                </div>
                
                <div class="admin-card settings">
                    <h3>설정</h3>
                    <p>관리자 설정 및 백업 관리</p>
                    <button class="admin-btn success" onclick="window.cmsManager.createBackup()">백업 생성</button>
                    <button class="admin-btn warning" onclick="window.imageManager?.exportImages()">이미지 내보내기</button>
                    <button class="admin-btn" onclick="window.cmsManager.forceImageManagerReset()">이미지 매니저 강제 재설정</button>
                    <button class="admin-btn danger" onclick="window.cmsManager.logout()">로그아웃</button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="number">${this.getEditableCount()}</div>
                    <div class="label">편집 가능한 요소</div>
                </div>
                <div class="stat-card">
                    <div class="number">${this.getPolicyEditableCount()}</div>
                    <div class="label">정책 편집 요소</div>
                </div>
                <div class="stat-card">
                    <div class="number">${this.getImageCount()}</div>
                    <div class="label">업로드된 이미지</div>
                </div>
                <div class="stat-card">
                    <div class="number">${this.getImageAreaCount()}</div>
                    <div class="label">이미지 영역</div>
                </div>
            </div>
            
            <div class="admin-message info">
                <strong>사용법:</strong><br>
                • <strong>텍스트 편집:</strong> 편집하려는 텍스트 영역을 클릭<br>
                • <strong>이미지 업로드:</strong> 파란색 점선 영역을 클릭<br>
                • <strong>정책 상세:</strong> 정책 섹션 → 상세보기 → 이미지/텍스트 편집<br>
                • <strong>면단위 비전:</strong> 면 이름 버튼 클릭 → 상세 페이지에서 편집<br><br>
                
                <strong>문제 해결:</strong><br>
                • 이미지 업로드가 안 되면: <strong>'이미지 시스템 진단'</strong> 버튼 클릭<br>
                • 이미지 영역이 안 보이면: <strong>'이미지 영역 활성화'</strong> 버튼 클릭<br>
                • 모든 것이 안 되면: <strong>'이미지 매니저 강제 재설정'</strong> 버튼 클릭<br>
                • 그래도 안 되면: 페이지 새로고침 후 다시 로그인
            </div>
        `;
    }
    
    // 이미지 시스템 진단 (새로 추가)
    debugImageSystem() {
        console.group('🔍 이미지 시스템 진단');
        
        const imageManager = window.imageManager;
        const imageAreas = document.querySelectorAll('.cms-image-trigger');
        const modal = document.getElementById('image-manager-modal');
        
        const diagnostic = {
            imageManager: {
                exists: !!imageManager,
                initialized: imageManager?.isInitialized,
                uploadedCount: imageManager ? Object.keys(imageManager.uploadedImages || {}).length : 0,
                debugMethod: typeof imageManager?.debug === 'function'
            },
            imageAreas: {
                count: imageAreas.length,
                areas: Array.from(imageAreas).map(area => ({
                    type: area.dataset.imageType,
                    id: area.dataset.imageId,
                    visible: area.offsetParent !== null,
                    hasClickHandler: !!area.onclick
                }))
            },
            modal: {
                exists: !!modal,
                hidden: modal?.classList.contains('hidden'),
                parentElement: modal?.parentElement?.tagName
            },
            cmsState: {
                adminMode: this.isAdminMode,
                loggedIn: this.isLoggedIn,
                currentUser: this.currentUser
            }
        };
        
        console.log('진단 결과:', diagnostic);
        console.groupEnd();
        
        // 자동 수정 시도
        let fixed = [];
        
        if (!imageManager) {
            this.showMessage('❌ 이미지 매니저가 없습니다. 페이지를 새로고침해주세요.', 'error');
        } else if (!imageManager.isInitialized) {
            this.showMessage('🔄 이미지 매니저 재초기화를 시도합니다...', 'info');
            try {
                imageManager.init();
                fixed.push('이미지 매니저 재초기화');
                this.showMessage('✅ 이미지 매니저 재초기화 완료', 'success');
            } catch (error) {
                this.showMessage('❌ 이미지 매니저 초기화 실패: ' + error.message, 'error');
            }
        }
        
        if (imageAreas.length === 0) {
            this.showMessage('⚠️ 이미지 영역을 찾을 수 없습니다. 이미지 영역 활성화를 시도합니다...', 'warning');
            this.addImagePlaceholders();
            fixed.push('이미지 영역 활성화');
        }
        
        if (!modal) {
            this.showMessage('⚠️ 이미지 모달이 없습니다. 이미지 매니저 강제 재설정을 권장합니다.', 'warning');
        }
        
        if (fixed.length === 0) {
            this.showMessage('✅ 이미지 시스템이 정상 작동 중입니다.', 'success');
        } else {
            this.showMessage(`🔧 수정 완료: ${fixed.join(', ')}`, 'success');
        }
        
        return diagnostic;
    }
    
    // 이미지 매니저 강제 재설정
    forceImageManagerReset() {
        console.log('🔄 이미지 매니저 강제 재설정...');
        
        try {
            // 기존 이미지 매니저 제거
            if (window.imageManager) {
                window.imageManager = null;
            }
            
            // 기존 모달 제거
            const existingModal = document.getElementById('image-manager-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // 새 이미지 매니저 생성
            window.imageManager = new window.ImageManager();
            window.imageManager.init();
            
            // 이미지 영역 재활성화
            if (this.isAdminMode) {
                this.activateAllImageAreas();
            }
            
            this.showMessage('✅ 이미지 매니저가 강제로 재설정되었습니다.', 'success');
            console.log('✅ 이미지 매니저 강제 재설정 완료');
            
        } catch (error) {
            console.error('❌ 이미지 매니저 강제 재설정 실패:', error);
            this.showMessage('❌ 이미지 매니저 재설정 실패: ' + error.message, 'error');
        }
    }
    
    // Header 이미지 테스트
    testHeaderImage() {
        console.log('🧪 Header 이미지 테스트 실행');
        
        const headerImage = document.querySelector('.header-top-image .cms-image-trigger');
        if (headerImage && window.imageManager) {
            this.handleImageClick(headerImage);
        } else if (!headerImage) {
            this.showMessage('❌ Header 이미지 영역을 찾을 수 없습니다. 이미지 영역 활성화를 시도합니다.', 'error');
            this.addImagePlaceholders();
        } else {
            this.showMessage('❌ 이미지 매니저를 찾을 수 없습니다.', 'error');
        }
    }
    
    // 통계 메서드들
    getEditableCount() {
        return document.querySelectorAll('[data-editable]').length;
    }
    
    getPolicyEditableCount() {
        return document.querySelectorAll('.policy-detail [data-editable], .policy-card [data-editable], .vision-button [data-editable]').length;
    }
    
    getImageCount() {
        return window.imageManager ? Object.keys(window.imageManager.getUploadedImages()).length : 0;
    }
    
    getImageAreaCount() {
        return document.querySelectorAll('.cms-image-trigger').length;
    }
    
    // 정책 관련 메서드들
    goToPoliciesAndEdit() {
        // 정책 섹션으로 이동
        if (window.appInstance) {
            window.appInstance.showSection('policies');
        }
        
        // 잠시 후 편집 속성 추가
        setTimeout(() => {
            this.refreshEditableElements();
            this.showMessage('정책 섹션으로 이동했습니다. 정책 카드와 비전 버튼을 클릭하여 편집하세요.', 'info');
        }, 500);
    }
    
    enablePolicyDetailEdit() {
        // 모든 정책 상세 페이지에 편집 속성 추가
        this.addPolicyEditableAttributes();
        
        // 현재 열려있는 상세 페이지가 있다면 강제로 편집 속성 추가
        if (window.PolicyManager && window.PolicyManager.currentDetailId) {
            const currentDetail = document.getElementById(window.PolicyManager.currentDetailId);
            if (currentDetail && currentDetail.classList.contains('active')) {
                this.addDetailPageEditingAttributes(currentDetail);
                this.showMessage('현재 열린 상세 페이지의 편집이 활성화되었습니다.', 'success');
            }
        } else {
            this.showMessage('정책 상세 페이지 편집이 활성화되었습니다. 정책 상세보기를 열어서 편집하세요.', 'info');
        }
    }
    
    addImagePlaceholders() {
        console.log('🖼️ 이미지 플레이스홀더 추가...');
        
        // Hero section에 이미지 영역이 없다면 추가
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && !heroSection.querySelector('.hero-background')) {
            const heroBackground = document.createElement('div');
            heroBackground.className = 'hero-background';
            heroBackground.setAttribute('data-editable', 'hero-background');
            heroBackground.innerHTML = `
                <div class="hero-overlay"></div>
                <div class="image-placeholder cms-image-trigger" data-image-type="hero" data-image-id="hero-background" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.3); text-align: center; cursor: pointer;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,12L11,14.5L15,9.5L20,15H4M2,6H14L16,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6Z"/>
                    </svg>
                    <p style="margin-top: 0.5rem;">Hero 배경 이미지 추가</p>
                </div>
            `;
            heroSection.insertBefore(heroBackground, heroSection.firstChild);
            console.log('✅ Hero 배경 이미지 영역 추가됨');
        }
        
        // 관리자 모드가 활성화되어 있다면 이미지 영역들 활성화
        if (this.isAdminMode) {
            this.activateAllImageAreas();
        }
        
        this.showMessage('이미지 영역이 활성화되었습니다. 파란색 점선 영역을 클릭하여 이미지를 추가하세요.', 'success');
    }
    
    refreshEditableElements() {
        console.log('🔄 편집 요소 새로고침...');
        
        this.makeDynamicContentEditable();
        this.addPolicyEditableAttributes();
        this.highlightEditableElements();
        
        // 관리자 모드가 활성화되어 있다면 이미지 영역도 활성화
        if (this.isAdminMode) {
            this.activateAllImageAreas();
        }
        
        // PolicyManager의 편집 속성도 업데이트
        if (window.PolicyManager && window.PolicyManager.isInitialized) {
            window.PolicyManager.addEditableAttributesToPolicies();
            window.PolicyManager.addEditableAttributesToVisions();
            
            // 현재 열려있는 상세 페이지가 있다면 편집 속성 추가
            if (window.PolicyManager.currentDetailId) {
                window.PolicyManager.addEditableAttributesToDetailPage(window.PolicyManager.currentDetailId);
            }
        }
        
        this.showMessage('편집 요소가 새로고침되었습니다.', 'success');
        console.log('✅ 모든 편집 요소 새로고침 완료');
    }
    
    addPolicyEditableAttributes() {
        // 정책 편집 속성 추가 (상세 구현은 PolicyManager에서 처리)
        console.log('📋 정책 편집 속성 추가');
    }
    
    createBackup() {
        try {
            const content = this.extractAllContent();
            const backupKey = `cms_backup_${new Date().toISOString()}`;
            localStorage.setItem(backupKey, JSON.stringify(content));
            this.showMessage('백업이 생성되었습니다.', 'success');
            console.log('💾 백업 생성 완료:', backupKey);
        } catch (error) {
            console.error('❌ 백업 실패:', error);
            this.showMessage('백업 생성 중 오류가 발생했습니다.', 'error');
        }
    }
    
    showMessage(message, type = 'info') {
        console.log(`💬 CMS 메시지 [${type}]: ${message}`);
        
        const messageEl = document.createElement('div');
        messageEl.className = `admin-message ${type}`;
        messageEl.textContent = message;
        
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.insertBefore(messageEl, adminPanel.firstChild);
        } else {
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 350px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 1rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                opacity: 0;
                transition: opacity 0.3s ease;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            `;
            document.body.appendChild(messageEl);
            
            // 애니메이션
            setTimeout(() => messageEl.style.opacity = '1', 10);
        }
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    enableDebugLogging() {
        console.log('🐛 CMS 디버그 로깅 활성화');
        
        // 주요 메서드에 로깅 추가
        const originalEditContent = this.editContent;
        this.editContent = function(element) {
            console.log('🐛 editContent 호출:', element);
            return originalEditContent.call(this, element);
        };
        
        const originalHandleImageClick = this.handleImageClick;
        this.handleImageClick = function(element) {
            console.log('🐛 handleImageClick 호출:', element);
            return originalHandleImageClick.call(this, element);
        };
    }
    
    // 디버깅 도구
    debug() {
        console.group('🔍 CMS 매니저 디버그 정보');
        console.log('초기화 상태:', this.isInitialized);
        console.log('로그인 상태:', this.isLoggedIn);
        console.log('관리자 모드:', this.isAdminMode);
        console.log('현재 사용자:', this.currentUser);
        console.log('편집 중인 요소:', this.editingElement);
        
        const stats = {
            editableElements: this.getEditableCount(),
            policyElements: this.getPolicyEditableCount(),
            imageAreas: this.getImageAreaCount(),
            uploadedImages: this.getImageCount()
        };
        
        console.log('통계:', stats);
        console.groupEnd();
        
        return {
            isInitialized: this.isInitialized,
            isLoggedIn: this.isLoggedIn,
            isAdminMode: this.isAdminMode,
            currentUser: this.currentUser,
            editingElement: this.editingElement,
            stats: stats
        };
    }
}

// Initialize CMS Manager when DOM is ready
let cmsManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 CMS DOMContentLoaded 초기화 시작...');
    
    // App 초기화를 기다린 후 CMS 초기화 (충돌 방지)
    setTimeout(() => {
        cmsManager = new CMSManager();
        cmsManager.init();
        
        // Global access
        window.CMSManager = CMSManager;
        window.cmsManager = cmsManager;
        
        // 디버깅 도구 전역 노출
        window.debugCMS = () => cmsManager.debug();
        
        console.log('✅ CMS 전역 설정 완료');
    }, 300); // App보다 늦게 초기화
});