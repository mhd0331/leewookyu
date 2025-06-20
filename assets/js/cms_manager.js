// CMS Management System (수정된 버전 - 이미지 클릭 문제 해결)
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
        
        // 추가로 일반 단계에서도 처리
        document.addEventListener('click', this.imageClickHandler, false);
        
        console.log('✅ 이미지 클릭 핸들러 설정 완료');
    }
    
    setupContentClickHandler() {
        // 편집 가능한 콘텐츠 클릭 처리
        this.contentClickHandler = (e) => {
            if (!this.isAdminMode) return;
            
            // 이미지 트리거는 별도 처리
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
            return;
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
        
        this.showMessage('관리자 모드가 활성화되었습니다. 이미지 영역과 텍스트를 클릭하여 편집하세요.', 'success');
        console.log('✅ 관리자 모드 활성화됨');
    }
    
    disableAdminMode() {
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
    }
    
    // Header 이미지 영역 활성화
    activateHeaderImageArea() {
        const headerImage = document.querySelector('.header-top-image');
        if (headerImage) {
            const placeholder = headerImage.querySelector('.image-placeholder');
            if (placeholder) {
                placeholder.style.border = '2px dashed rgba(255,255,255,0.5)';
                placeholder.setAttribute('title', '클릭하여 헤더 이미지 추가');
                console.log('📌 Header 이미지 영역 활성화됨');
            }
        }
    }
    
    // 모든 이미지 영역 활성화
    activateAllImageAreas() {
        console.log('🖼️ 모든 이미지 영역 활성화...');
        
        // 모든 이미지 트리거 찾기
        const imageTargets = document.querySelectorAll('.cms-image-trigger');
        console.log(`발견된 이미지 트리거: ${imageTargets.length}개`);
        
        imageTargets.forEach((target, index) => {
            // 시각적 표시 추가
            target.style.border = '2px dashed rgba(0, 123, 255, 0.3)';
            target.style.transition = 'all 0.3s ease';
            target.setAttribute('title', '클릭하여 이미지 추가/변경');
            
            // 호버 효과 추가
            target.addEventListener('mouseenter', () => {
                if (this.isAdminMode) {
                    target.style.borderColor = 'rgba(0, 123, 255, 0.8)';
                    target.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
                }
            });
            
            target.addEventListener('mouseleave', () => {
                if (this.isAdminMode) {
                    target.style.borderColor = 'rgba(0, 123, 255, 0.3)';
                    target.style.backgroundColor = '';
                }
            });
            
            console.log(`이미지 트리거 ${index + 1} 활성화:`, {
                type: target.dataset.imageType,
                id: target.dataset.imageId
            });
        });
        
        console.log('✅ 모든 이미지 영역 활성화 완료');
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
        } catch (error) {
            console.error('저장 실패:', error);
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
                    } else {
                        sessionStorage.removeItem('cms_login');
                    }
                }
            }
        } catch (error) {
            console.error('로그인 상태 확인 중 오류:', error);
        }
    }
    
    makeDynamicContentEditable() {
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
    }
    
    highlightEditableElements() {
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.style.position = 'relative';
            element.style.cursor = 'pointer';
            element.setAttribute('title', '클릭하여 편집');
        });
        
        console.log(`${editableElements.length}개의 편집 가능한 요소를 찾았습니다.`);
    }
    
    removeEditableHighlight() {
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.style.cursor = '';
            element.removeAttribute('title');
        });
        
        // 이미지 영역 하이라이트도 제거
        const imageTargets = document.querySelectorAll('.cms-image-trigger');
        imageTargets.forEach(target => {
            target.style.border = '';
            target.style.backgroundColor = '';
            target.removeAttribute('title');
        });
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
                    <button class="admin-btn" onclick="window.cmsManager.testAllImageTypes()">모든 이미지 영역 테스트</button>
                    <button class="admin-btn" onclick="window.cmsManager.addImagePlaceholders()">이미지 영역 활성화</button>
                </div>
                
                <div class="admin-card settings">
                    <h3>설정</h3>
                    <p>관리자 설정 및 백업 관리</p>
                    <button class="admin-btn success" onclick="window.cmsManager.createBackup()">백업 생성</button>
                    <button class="admin-btn warning" onclick="window.imageManager?.exportImages()">이미지 내보내기</button>
                    <button class="admin-btn" onclick="window.cmsManager.debugImageSystem()">이미지 시스템 진단</button>
                    <button class="admin-btn danger" onclick="window.cmsManager.logout()">로그아웃</button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="number">${this.getEditableCount()}</div>
                    <div class="label">편집 가능한 요소</div>
                </div>
                <div class="stat-card">
                    <div class="number">${this.getImageTriggerCount()}</div>
                    <div class="label">이미지 영역</div>
                </div>
                <div class="stat-card">
                    <div class="number">${this.getImageCount()}</div>
                    <div class="label">업로드된 이미지</div>
                </div>
                <div class="stat-card">
                    <div class="number">${this.currentUser || '없음'}</div>
                    <div class="label">현재 사용자</div>
                </div>
            </div>
            
            <div class="admin-message info">
                <strong>사용법:</strong><br>
                • 일반 콘텐츠: 편집하려는 요소를 클릭<br>
                • 이미지 영역: 파란색 점선 테두리가 있는 영역을 클릭<br>
                • Header 이미지: Header 상단의 이미지 플레이스홀더 클릭<br>
                • Hero 이미지: 메인 Hero 섹션의 이미지 플레이스홀더 클릭<br>
                • 정책 상세: 정책 섹션으로 이동 후 상세보기를 열고 편집<br>
                • 면단위 비전: 면 이름 카드를 클릭한 후 상세 내용 편집
            </div>
        `;
    }
    
    // 이미지 시스템 진단
    debugImageSystem() {
        console.group('🔍 이미지 시스템 진단');
        
        const imageManager = window.imageManager;
        const imageTargets = document.querySelectorAll('.cms-image-trigger');
        const uploadedImages = imageManager ? Object.keys(imageManager.getUploadedImages()).length : 0;
        
        console.log('이미지 매니저 상태:', {
            존재: !!imageManager,
            초기화: imageManager?.isInitialized,
            업로드된이미지: uploadedImages
        });
        
        console.log('이미지 트리거 영역:', imageTargets.length + '개');
        imageTargets.forEach((target, index) => {
            console.log(`${index + 1}. 타입: ${target.dataset.imageType}, ID: ${target.dataset.imageId}`);
        });
        
        // 이벤트 리스너 테스트
        console.log('이벤트 리스너 테스트...');
        if (imageTargets.length > 0) {
            const testTarget = imageTargets[0];
            console.log('테스트 대상:', testTarget);
            
            // 임시 클릭 이벤트 발생
            const testEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            console.log('테스트 클릭 이벤트 발생...');
            testTarget.dispatchEvent(testEvent);
        }
        
        console.groupEnd();
        
        this.showMessage(`이미지 시스템 진단: 매니저=${!!imageManager}, 트리거=${imageTargets.length}개, 이미지=${uploadedImages}개`, 'info');
    }
    
    // Header 이미지 테스트
    testHeaderImage() {
        const headerImage = document.querySelector('.header-top-image .cms-image-trigger');
        if (headerImage && window.imageManager) {
            console.log('🧪 Header 이미지 테스트 실행');
            this.handleImageClick(headerImage);
        } else if (!headerImage) {
            this.showMessage('Header 이미지 영역을 찾을 수 없습니다.', 'error');
        } else {
            this.showMessage('이미지 매니저를 찾을 수 없습니다.', 'error');
        }
    }
    
    // 모든 이미지 타입 테스트
    testAllImageTypes() {
        console.log('🎨 모든 이미지 타입 테스트');
        
        const imageTypes = [
            { selector: '.header-top-image .cms-image-trigger', name: 'Header Top' },
            { selector: '.hero-background .cms-image-trigger', name: 'Hero Background' },
            { selector: '[data-image-type="candidate"] .cms-image-trigger', name: 'Candidate' },
            { selector: '[data-image-type="policy-detail"] .cms-image-trigger', name: 'Policy Detail' },
            { selector: '[data-image-type="vision-detail"] .cms-image-trigger', name: 'Vision Detail' }
        ];
        
        let foundCount = 0;
        imageTypes.forEach(({ selector, name }) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                foundCount++;
                console.log(`✅ ${name}: ${elements.length}개 발견`);
            } else {
                console.log(`❌ ${name}: 없음`);
            }
        });
        
        this.showMessage(`이미지 영역 테스트: ${foundCount}/${imageTypes.length}개 타입 발견`, 'info');
    }
    
    getEditableCount() {
        return document.querySelectorAll('[data-editable]').length;
    }
    
    getImageTriggerCount() {
        return document.querySelectorAll('.cms-image-trigger').length;
    }
    
    getPolicyEditableCount() {
        return document.querySelectorAll('.policy-detail [data-editable], .policy-card [data-editable], .vision-button [data-editable]').length;
    }
    
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
    
    getImageCount() {
        return window.imageManager ? Object.keys(window.imageManager.getUploadedImages()).length : 0;
    }
    
    addImagePlaceholders() {
        // Hero section에 이미지 영역이 없다면 추가
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && !heroSection.querySelector('.hero-background')) {
            const heroBackground = document.createElement('div');
            heroBackground.className = 'hero-background';
            heroBackground.setAttribute('data-editable', 'hero-background');
            heroBackground.innerHTML = `
                <div class="hero-overlay"></div>
                <div class="image-placeholder cms-image-trigger" data-image-type="hero" data-image-id="hero-background" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.3); text-align: center;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,12L11,14.5L15,9.5L20,15H4M2,6H14L16,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6Z"/>
                    </svg>
                    <p style="margin-top: 0.5rem;">배경 이미지 추가</p>
                </div>
            `;
            heroSection.insertBefore(heroBackground, heroSection.firstChild);
        }
        
        // 새로 추가된 이미지 영역들 활성화
        this.activateAllImageAreas();
        this.showMessage('이미지 영역이 활성화되었습니다. 파란색 점선 테두리 영역을 클릭하여 이미지를 추가하세요.', 'success');
    }
    
    refreshEditableElements() {
        this.makeDynamicContentEditable();
        this.addPolicyEditableAttributes();
        this.highlightEditableElements();
        this.activateAllImageAreas();
        
        // PolicyManager가 있다면 편집 속성도 업데이트
        if (window.PolicyManager && window.PolicyManager.isInitialized) {
            window.PolicyManager.addEditableAttributesToPolicies();
            window.PolicyManager.addEditableAttributesToVisions();
            
            // 현재 열려있는 상세 페이지가 있다면 편집 속성 추가
            if (window.PolicyManager.currentDetailId) {
                window.PolicyManager.addEditableAttributesToDetailPage(window.PolicyManager.currentDetailId);
            }
        }
        
        this.showMessage('편집 요소가 새로고침되었습니다.', 'success');
        console.log('모든 편집 요소 새로고침 완료');
    }
    
    addPolicyEditableAttributes() {
        // 기존 정책 편집 속성 추가 로직
        console.log('정책 편집 속성 추가 완료');
    }
    
    createBackup() {
        try {
            const content = this.extractAllContent();
            const backupKey = `cms_backup_${new Date().toISOString()}`;
            localStorage.setItem(backupKey, JSON.stringify(content));
            this.showMessage('백업이 생성되었습니다.', 'success');
        } catch (error) {
            console.error('백업 실패:', error);
            this.showMessage('백업 생성 중 오류가 발생했습니다.', 'error');
        }
    }
    
    showMessage(message, type = 'info') {
        console.log(`CMS 메시지 [${type}]: ${message}`);
        
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
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 1rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            `;
            document.body.appendChild(messageEl);
        }
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
    
    enableDebugLogging() {
        console.log('CMS 디버그 로깅 활성화');
        
        // 주요 메서드에 로깅 추가
        const originalEditContent = this.editContent;
        this.editContent = function(element) {
            console.log('🐛 editContent 호출:', element);
            return originalEditContent.call(this, element);
        };
        
        const originalHandleImageClick = this.handleImageClick;
        this.handleImageClick = function(imageElement) {
            console.log('🐛 handleImageClick 호출:', imageElement);
            return originalHandleImageClick.call(this, imageElement);
        };
    }
}

// Initialize CMS Manager when DOM is ready
let cmsManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('CMS 초기화 시작...');
    
    // App 초기화를 기다린 후 CMS 초기화 (충돌 방지)
    setTimeout(() => {
        cmsManager = new CMSManager();
        cmsManager.init();
        
        // Global access
        window.CMSManager = CMSManager;
        window.cmsManager = cmsManager;
        
        // 디버깅 도구
        window.debugCMS = () => {
            console.group('🔍 CMS 디버그 정보');
            console.log('CMS 매니저:', cmsManager);
            console.log('이미지 매니저:', window.imageManager);
            console.log('관리자 모드:', cmsManager.isAdminMode);
            console.log('로그인 상태:', cmsManager.isLoggedIn);
            console.log('편집 가능한 요소:', document.querySelectorAll('[data-editable]').length + '개');
            console.log('이미지 트리거:', document.querySelectorAll('.cms-image-trigger').length + '개');
            console.groupEnd();
        };
        
    }, 300); // App보다 늦게 초기화
});