// CMS 디버깅 및 진단 도구
class CMSDebugger {
    constructor() {
        this.debugMode = false;
        this.logs = [];
    }
    
    init() {
        // 개발자 도구에서 사용할 수 있는 전역 함수들
        window.cmsDebug = {
            enable: () => this.enableDebugMode(),
            disable: () => this.disableDebugMode(),
            checkElements: () => this.debugEditableElements(),
            diagnose: () => this.runDiagnostic(),
            quickFix: () => this.quickFix(),
            showLogs: () => this.showLogs(),
            clearLogs: () => this.clearLogs()
        };
        
        console.log('🔧 CMS 디버거 초기화 완료');
        console.log('사용법: cmsDebug.enable() - 디버그 모드 활성화');
        console.log('       cmsDebug.diagnose() - 시스템 진단');
        console.log('       cmsDebug.quickFix() - 빠른 수정');
    }
    
    enableDebugMode() {
        this.debugMode = true;
        localStorage.setItem('cms_debug_mode', 'true');
        
        // CSS 스타일 추가로 편집 가능한 요소를 더 명확하게 표시
        this.addDebugStyles();
        
        console.log('🐛 디버그 모드 활성화됨');
        this.log('debug', '디버그 모드 활성화');
        
        return '디버그 모드가 활성화되었습니다.';
    }
    
    disableDebugMode() {
        this.debugMode = false;
        localStorage.removeItem('cms_debug_mode');
        
        // 디버그 스타일 제거
        this.removeDebugStyles();
        
        console.log('디버그 모드 비활성화됨');
        this.log('info', '디버그 모드 비활성화');
        
        return '디버그 모드가 비활성화되었습니다.';
    }
    
    addDebugStyles() {
        const debugStyle = document.createElement('style');
        debugStyle.id = 'cms-debug-styles';
        debugStyle.textContent = `
            [data-editable] {
                outline: 2px dashed rgba(255, 0, 0, 0.3) !important;
                position: relative !important;
            }
            
            [data-editable]:hover {
                outline: 2px solid red !important;
                background: rgba(255, 0, 0, 0.1) !important;
            }
            
            [data-editable]::before {
                content: attr(data-editable);
                position: absolute;
                top: -20px;
                left: 0;
                background: red;
                color: white;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
                z-index: 10000;
                pointer-events: none;
            }
            
            [data-editable-field] {
                border: 1px dotted blue !important;
            }
        `;
        
        document.head.appendChild(debugStyle);
    }
    
    removeDebugStyles() {
        const debugStyle = document.getElementById('cms-debug-styles');
        if (debugStyle) {
            debugStyle.remove();
        }
    }
    
    debugEditableElements() {
        const editableElements = document.querySelectorAll('[data-editable]');
        
        console.group('=== 편집 가능한 요소 분석 ===');
        console.log(`총 ${editableElements.length}개의 편집 가능한 요소 발견`);
        
        const results = [];
        
        editableElements.forEach((element, index) => {
            const editableType = element.getAttribute('data-editable');
            const fields = element.querySelectorAll('[data-editable-field]');
            const hasContent = element.innerHTML.trim().length > 0;
            
            const info = {
                index: index + 1,
                type: editableType,
                element: element,
                fieldsCount: fields.length,
                hasContent: hasContent,
                fields: []
            };
            
            fields.forEach(field => {
                const fieldName = field.getAttribute('data-editable-field');
                const fieldContent = field.innerHTML || field.textContent || field.value || '';
                
                info.fields.push({
                    name: fieldName,
                    tag: field.tagName,
                    content: fieldContent.substring(0, 50) + (fieldContent.length > 50 ? '...' : ''),
                    isEmpty: !fieldContent.trim()
                });
            });
            
            results.push(info);
            
            console.log(`${index + 1}. [${editableType}]`, {
                element: element,
                fields: info.fields,
                hasContent: hasContent
            });
        });
        
        console.groupEnd();
        
        if (editableElements.length === 0) {
            console.warn('❌ 편집 가능한 요소가 없습니다!');
            console.log('해결책: HTML에 data-editable 속성을 추가하세요.');
        }
        
        this.log('check', `편집 가능한 요소 ${editableElements.length}개 확인`);
        
        return results;
    }
    
    runDiagnostic() {
        console.group('🔍 CMS 시스템 진단');
        
        const diagnostic = {
            modules: this.checkModules(),
            elements: this.checkElements(),
            data: this.checkData(),
            storage: this.checkStorage(),
            errors: this.checkForErrors()
        };
        
        // 점수 계산
        const scores = {
            modules: diagnostic.modules.loaded / diagnostic.modules.total * 100,
            elements: diagnostic.elements.editable > 0 ? 100 : 0,
            data: diagnostic.data.policies && diagnostic.data.candidate ? 100 : 50,
            storage: diagnostic.storage.available ? 100 : 0
        };
        
        const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
        
        console.log('진단 결과:', diagnostic);
        console.log(`전체 점수: ${overallScore.toFixed(1)}/100`);
        
        // 권장사항
        const recommendations = [];
        if (scores.modules < 100) recommendations.push('일부 모듈이 로드되지 않았습니다.');
        if (scores.elements < 100) recommendations.push('편집 가능한 요소를 추가하세요.');
        if (scores.data < 100) recommendations.push('데이터 파일을 확인하세요.');
        if (scores.storage < 100) recommendations.push('브라우저 저장소를 확인하세요.');
        
        if (recommendations.length > 0) {
            console.group('📋 권장사항');
            recommendations.forEach(rec => console.log('•', rec));
            console.groupEnd();
        }
        
        console.groupEnd();
        
        this.log('diagnostic', `시스템 진단 완료 (${overallScore.toFixed(1)}/100)`);
        
        return {
            score: overallScore,
            diagnostic: diagnostic,
            recommendations: recommendations
        };
    }
    
    checkModules() {
        const modules = {
            'window.Navigation': !!window.Navigation,
            'window.PolicyManager': !!window.PolicyManager,
            'window.PopupManager': !!window.PopupManager,
            'window.CMSManager': !!window.CMSManager,
            'window.cmsManager': !!window.cmsManager,
            'window.appInstance': !!window.appInstance,
            'window.Utils': !!window.Utils
        };
        
        const loaded = Object.values(modules).filter(Boolean).length;
        const total = Object.keys(modules).length;
        
        console.log('모듈 상태:', modules);
        console.log(`로드된 모듈: ${loaded}/${total}`);
        
        return { modules, loaded, total };
    }
    
    checkElements() {
        const editableElements = document.querySelectorAll('[data-editable]').length;
        const editableFields = document.querySelectorAll('[data-editable-field]').length;
        const sections = document.querySelectorAll('.app-section').length;
        const navLinks = document.querySelectorAll('.nav-link').length;
        
        const elements = {
            editable: editableElements,
            fields: editableFields,
            sections: sections,
            navLinks: navLinks
        };
        
        console.log('요소 상태:', elements);
        
        return elements;
    }
    
    checkData() {
        const data = {
            policies: !!(window.appInstance?.data?.policies),
            candidate: !!(window.appInstance?.data?.candidate),
            policiesCount: window.appInstance?.data?.policies?.mainPolicies?.length || 0,
            visionCount: window.appInstance?.data?.policies?.visionByArea?.length || 0
        };
        
        console.log('데이터 상태:', data);
        
        return data;
    }
    
    checkStorage() {
        const storage = {
            available: this.isStorageAvailable(),
            cmsContent: !!localStorage.getItem('cms_content_latest'),
            cmsLogin: !!sessionStorage.getItem('cms_login'),
            storageSize: this.getStorageSize()
        };
        
        console.log('저장소 상태:', storage);
        
        return storage;
    }
    
    checkForErrors() {
        const errors = this.logs.filter(log => log.type === 'error');
        
        console.log(`발견된 오류: ${errors.length}개`);
        if (errors.length > 0) {
            console.table(errors);
        }
        
        return errors;
    }
    
    quickFix() {
        console.group('🔧 빠른 수정 실행');
        
        const fixes = [];
        
        // 1. 편집 가능한 요소에 속성 추가
        const fixedElements = this.addMissingEditableAttributes();
        if (fixedElements > 0) {
            fixes.push(`${fixedElements}개 요소에 편집 속성 추가`);
        }
        
        // 2. 네비게이션 링크 수정
        const fixedNavigation = this.fixNavigationLinks();
        if (fixedNavigation) {
            fixes.push('네비게이션 링크 수정');
        }
        
        // 3. 이벤트 리스너 재설정
        const fixedEvents = this.resetEventListeners();
        if (fixedEvents) {
            fixes.push('이벤트 리스너 재설정');
        }
        
        // 4. CMS 모드 재초기화
        if (window.cmsManager && window.cmsManager.isAdminMode) {
            window.cmsManager.makeDynamicContentEditable();
            window.cmsManager.highlightEditableElements();
            fixes.push('CMS 편집 모드 새로고침');
        }
        
        console.log('수정 완료:', fixes);
        console.groupEnd();
        
        this.log('fix', `빠른 수정 완료: ${fixes.length}개 항목`);
        
        return fixes;
    }
    
    addMissingEditableAttributes() {
        let count = 0;
        
        // 정책 카드
        document.querySelectorAll('.policy-card:not([data-editable])').forEach((card, index) => {
            card.setAttribute('data-editable', `policy-card-${index}`);
            count++;
        });
        
        // FAQ 아이템
        document.querySelectorAll('.faq-item:not([data-editable])').forEach((item, index) => {
            item.setAttribute('data-editable', `faq-item-${index}`);
            count++;
        });
        
        return count;
    }
    
    fixNavigationLinks() {
        const navLinks = document.querySelectorAll('.nav-link');
        let fixed = false;
        
        navLinks.forEach(link => {
            if (!link.hasAttribute('data-section')) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    link.setAttribute('data-section', href.substring(1));
                    fixed = true;
                }
            }
        });
        
        return fixed;
    }
    
    resetEventListeners() {
        // 기본 클릭 이벤트 재설정
        document.querySelectorAll('.nav-link').forEach(link => {
            if (!link.hasAttribute('data-event-set')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = e.target.dataset.section;
                    if (section && window.appInstance) {
                        window.appInstance.showSection(section);
                    }
                });
                link.setAttribute('data-event-set', 'true');
            }
        });
        
        return true;
    }
    
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    getStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length;
                }
            }
            return `${(total / 1024).toFixed(2)} KB`;
        } catch (e) {
            return 'Unknown';
        }
    }
    
    log(type, message) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message
        };
        
        this.logs.push(logEntry);
        
        // 로그가 너무 많아지지 않도록 최근 100개만 유지
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(-100);
        }
    }
    
    showLogs() {
        console.group('📋 CMS 로그');
        console.table(this.logs);
        console.groupEnd();
        
        return this.logs;
    }
    
    clearLogs() {
        this.logs = [];
        console.log('로그가 삭제되었습니다.');
        return '로그가 삭제되었습니다.';
    }
    
    // 실시간 모니터링
    startMonitoring() {
        if (this.monitoringInterval) {
            console.log('모니터링이 이미 실행 중입니다.');
            return;
        }
        
        console.log('🔍 실시간 모니터링 시작');
        
        this.monitoringInterval = setInterval(() => {
            const errors = this.checkForConsoleErrors();
            if (errors.length > 0) {
                console.warn('새로운 오류 감지:', errors);
            }
        }, 5000);
        
        return '실시간 모니터링이 시작되었습니다.';
    }
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('실시간 모니터링 중지');
            return '실시간 모니터링이 중지되었습니다.';
        }
        
        return '모니터링이 실행 중이 아닙니다.';
    }
    
    checkForConsoleErrors() {
        // 콘솔 오류를 가로채서 수집
        const errors = [];
        
        if (window.lastError) {
            errors.push(window.lastError);
            window.lastError = null;
        }
        
        return errors;
    }
    
    // 성능 측정
    measurePerformance() {
        console.group('⚡ 성능 측정');
        
        const start = performance.now();
        
        // DOM 쿼리 성능 측정
        const domStart = performance.now();
        document.querySelectorAll('[data-editable]');
        const domTime = performance.now() - domStart;
        
        // 렌더링 성능 측정
        const renderStart = performance.now();
        if (window.appInstance) {
            window.appInstance.renderPolicies();
        }
        const renderTime = performance.now() - renderStart;
        
        const total = performance.now() - start;
        
        const results = {
            domQuery: `${domTime.toFixed(2)}ms`,
            rendering: `${renderTime.toFixed(2)}ms`,
            total: `${total.toFixed(2)}ms`,
            memory: this.getMemoryUsage()
        };
        
        console.log('성능 측정 결과:', results);
        console.groupEnd();
        
        return results;
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
            };
        }
        return 'Memory API not available';
    }
    
    // 자동 복구 기능
    autoRecover() {
        console.group('🔄 자동 복구 시도');
        
        const recoverySteps = [];
        
        try {
            // 1. 앱 인스턴스 재초기화
            if (!window.appInstance) {
                const app = LeeWooKyuApp.getInstance();
                app.init();
                recoverySteps.push('앱 인스턴스 재초기화');
            }
            
            // 2. CMS 매니저 재초기화
            if (!window.cmsManager) {
                const cms = new CMSManager();
                cms.init();
                window.cmsManager = cms;
                recoverySteps.push('CMS 매니저 재초기화');
            }
            
            // 3. 이벤트 리스너 재설정
            this.resetEventListeners();
            recoverySteps.push('이벤트 리스너 재설정');
            
            // 4. 편집 가능한 요소 재설정
            this.addMissingEditableAttributes();
            recoverySteps.push('편집 가능한 요소 재설정');
            
            console.log('복구 완료:', recoverySteps);
            
        } catch (error) {
            console.error('자동 복구 실패:', error);
            recoverySteps.push(`오류: ${error.message}`);
        }
        
        console.groupEnd();
        
        this.log('recovery', `자동 복구 시도: ${recoverySteps.length}개 단계`);
        
        return recoverySteps;
    }
    
    // 테스트 실행
    runTests() {
        console.group('🧪 기능 테스트');
        
        const tests = [
            this.testNavigation(),
            this.testPolicyDisplay(),
            this.testCMSFunctionality(),
            this.testDataLoading(),
            this.testResponsiveness()
        ];
        
        const passed = tests.filter(test => test.passed).length;
        const total = tests.length;
        
        console.log(`테스트 결과: ${passed}/${total} 통과`);
        
        if (passed < total) {
            console.warn('실패한 테스트:', tests.filter(test => !test.passed));
        }
        
        console.groupEnd();
        
        return { passed, total, tests };
    }
    
    testNavigation() {
        try {
            const sections = ['home', 'policies', 'about', 'news', 'membership'];
            const allSectionsExist = sections.every(section => 
                document.getElementById(section) !== null
            );
            
            return {
                name: 'Navigation Test',
                passed: allSectionsExist && !!window.appInstance,
                details: `모든 섹션 존재: ${allSectionsExist}`
            };
        } catch (error) {
            return {
                name: 'Navigation Test',
                passed: false,
                error: error.message
            };
        }
    }
    
    testPolicyDisplay() {
        try {
            const policyGrid = document.getElementById('main-policies-grid');
            const hasPolicies = policyGrid && policyGrid.children.length > 0;
            
            return {
                name: 'Policy Display Test',
                passed: hasPolicies,
                details: `정책 카드 수: ${policyGrid ? policyGrid.children.length : 0}`
            };
        } catch (error) {
            return {
                name: 'Policy Display Test',
                passed: false,
                error: error.message
            };
        }
    }
    
    testCMSFunctionality() {
        try {
            const cmsAvailable = !!window.cmsManager;
            const editableElements = document.querySelectorAll('[data-editable]').length;
            
            return {
                name: 'CMS Functionality Test',
                passed: cmsAvailable && editableElements > 0,
                details: `CMS 사용 가능: ${cmsAvailable}, 편집 가능한 요소: ${editableElements}`
            };
        } catch (error) {
            return {
                name: 'CMS Functionality Test',
                passed: false,
                error: error.message
            };
        }
    }
    
    testDataLoading() {
        try {
            const hasData = !!(window.appInstance?.data?.policies && window.appInstance?.data?.candidate);
            
            return {
                name: 'Data Loading Test',
                passed: hasData,
                details: `데이터 로드됨: ${hasData}`
            };
        } catch (error) {
            return {
                name: 'Data Loading Test',
                passed: false,
                error: error.message
            };
        }
    }
    
    testResponsiveness() {
        try {
            const isMobile = window.innerWidth <= 768;
            const hasResponsiveClasses = document.querySelector('.app-container') !== null;
            
            return {
                name: 'Responsiveness Test',
                passed: hasResponsiveClasses,
                details: `모바일: ${isMobile}, 반응형 컨테이너: ${hasResponsiveClasses}`
            };
        } catch (error) {
            return {
                name: 'Responsiveness Test',
                passed: false,
                error: error.message
            };
        }
    }
}

// 전역 오류 핸들러 설정
window.addEventListener('error', (event) => {
    if (window.cmsDebugger) {
        window.cmsDebugger.log('error', `${event.error?.message || event.message} at ${event.filename}:${event.lineno}`);
    }
    window.lastError = {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        timestamp: new Date().toISOString()
    };
});

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.cmsDebugger = new CMSDebugger();
    window.cmsDebugger.init();
});