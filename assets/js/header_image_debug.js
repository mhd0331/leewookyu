// Header 이미지 디버깅 및 강제 테스트 (개선된 버전)
class HeaderImageDebugger {
    constructor() {
        this.isInitialized = false;
    }
    
    init() {
        if (this.isInitialized) return;
        
        // 디버깅 함수를 전역으로 노출
        window.headerDebug = {
            checkElements: () => this.checkHeaderElements(),
            testImageUpload: () => this.testImageUpload(),
            forceImageInsert: () => this.forceImageInsert(),
            checkImageManager: () => this.checkImageManager(),
            fixHeaderImage: () => this.fixHeaderImage(),
            testAllImageTypes: () => this.testAllImageTypes(),
            checkCMSMode: () => this.checkCMSMode(),
            runFullDiagnostic: () => this.runFullDiagnostic()
        };
        
        console.log('🔧 Header 이미지 디버거 초기화 완료');
        console.log('사용법: headerDebug.runFullDiagnostic() - 전체 진단');
        console.log('       headerDebug.testImageUpload() - 이미지 업로드 테스트');
        console.log('       headerDebug.testAllImageTypes() - 모든 이미지 타입 테스트');
        
        this.isInitialized = true;
    }
    
    checkHeaderElements() {
        console.group('🔍 Header 요소 상세 확인');
        
        const headerTopImage = document.querySelector('.header-top-image');
        const imagePlaceholder = document.querySelector('.header-top-image .image-placeholder');
        const imageManager = window.imageManager;
        const cmsManager = window.cmsManager;
        const headerImg = document.querySelector('.header-top-img');
        
        console.log('Header Top Image 컨테이너:', headerTopImage);
        console.log('이미지 플레이스홀더:', imagePlaceholder);
        console.log('기존 Header 이미지:', headerImg);
        console.log('이미지 매니저:', imageManager);
        console.log('CMS 매니저:', cmsManager);
        console.log('관리자 모드:', cmsManager?.isAdminMode);
        
        if (imagePlaceholder) {
            console.log('플레이스홀더 속성:', {
                className: imagePlaceholder.className,
                dataset: imagePlaceholder.dataset,
                style: imagePlaceholder.style.cssText,
                dataImageType: imagePlaceholder.getAttribute('data-image-type'),
                dataImageId: imagePlaceholder.getAttribute('data-image-id')
            });
        }
        
        if (headerTopImage) {
            console.log('Header 컨테이너 속성:', {
                className: headerTopImage.className,
                dataset: headerTopImage.dataset,
                dataEditable: headerTopImage.getAttribute('data-editable')
            });
        }
        
        // 이벤트 리스너 확인
        this.checkEventListeners();
        
        console.groupEnd();
        
        return {
            headerTopImage,
            imagePlaceholder,
            headerImg,
            imageManager,
            cmsManager
        };
    }
    
    checkEventListeners() {
        console.group('🎯 이벤트 리스너 확인');
        
        const placeholder = document.querySelector('.header-top-image .cms-image-trigger');
        if (placeholder) {
            console.log('CMS 이미지 트리거 요소 존재:', true);
            
            // 클릭 이벤트 테스트
            const testClick = () => {
                console.log('테스트 클릭 이벤트 발생');
                if (window.cmsManager && window.cmsManager.isAdminMode) {
                    console.log('관리자 모드에서 클릭됨');
                } else {
                    console.log('관리자 모드가 아님');
                }
            };
            
            // 임시 이벤트 리스너 추가
            placeholder.addEventListener('click', testClick, { once: true });
            console.log('테스트 이벤트 리스너 추가됨');
        } else {
            console.error('CMS 이미지 트리거를 찾을 수 없음');
        }
        
        console.groupEnd();
    }
    
    testImageUpload() {
        console.group('🧪 이미지 업로드 테스트');
        
        const { headerTopImage, imagePlaceholder, imageManager, cmsManager } = this.checkHeaderElements();
        
        if (!cmsManager || !cmsManager.isAdminMode) {
            console.warn('⚠️ 관리자 모드가 아닙니다.');
            console.log('해결 방법:');
            console.log('1. 로고를 3번 클릭');
            console.log('2. admin/leewookyu2026! 또는 editor/jinan2026!로 로그인');
            console.log('3. 관리자 모드 활성화');
            console.groupEnd();
            return false;
        }
        
        if (!imageManager) {
            console.error('❌ 이미지 매니저가 없습니다.');
            console.groupEnd();
            return false;
        }
        
        if (!headerTopImage) {
            console.error('❌ Header top image 컨테이너가 없습니다.');
            console.groupEnd();
            return false;
        }
        
        // 강제로 이미지 매니저 열기
        console.log('✅ 이미지 매니저 강제 실행...');
        headerTopImage.setAttribute('data-image-type', 'header-top');
        headerTopImage.setAttribute('data-image-id', 'header-top-image');
        
        try {
            imageManager.openImageManager(headerTopImage);
            console.log('✅ 이미지 매니저가 성공적으로 열렸습니다.');
        } catch (error) {
            console.error('❌ 이미지 매니저 열기 실패:', error);
        }
        
        console.groupEnd();
        return true;
    }
    
    forceImageInsert() {
        console.group('🔧 강제 이미지 삽입 테스트');
        
        const headerTopImage = document.querySelector('.header-top-image');
        if (!headerTopImage) {
            console.error('❌ Header top image 컨테이너가 없습니다.');
            console.groupEnd();
            return;
        }
        
        // 테스트 이미지 데이터 생성 (개선된 버전)
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        
        // 더 화려한 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, 1200, 120);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(0.5, '#2a5298');
        gradient.addColorStop(1, '#667eea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 120);
        
        // 패턴 추가
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 1200, Math.random() * 120, Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 메인 텍스트
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText('민주당원 이우규 - Header 이미지', 600, 50);
        
        // 부제목
        ctx.font = '16px Arial';
        ctx.fillText(`생성 시간: ${new Date().toLocaleString()}`, 600, 80);
        ctx.fillText('테스트 이미지 - 1200x120px', 600, 100);
        
        const testImageData = {
            id: 'test-header-image-' + Date.now(),
            name: 'test-header-image.png',
            dataUrl: canvas.toDataURL('image/png'),
            size: 50000, // 대략적인 크기
            type: 'image/png'
        };
        
        // 강제 이미지 삽입
        if (window.imageManager && typeof window.imageManager.insertHeaderTopImage === 'function') {
            headerTopImage.setAttribute('data-image-type', 'header-top');
            headerTopImage.setAttribute('data-image-id', 'header-top-image');
            
            try {
                window.imageManager.insertHeaderTopImage(headerTopImage, testImageData, '테스트 헤더 이미지');
                console.log('✅ 테스트 이미지 삽입 완료');
                
                // 삽입된 이미지 확인
                setTimeout(() => {
                    const insertedImg = document.querySelector('.header-top-img');
                    if (insertedImg) {
                        console.log('✅ 이미지가 성공적으로 삽입됨:', insertedImg.src);
                    } else {
                        console.error('❌ 이미지 삽입 후 요소를 찾을 수 없음');
                    }
                }, 100);
                
            } catch (error) {
                console.error('❌ 이미지 삽입 실패:', error);
            }
        } else {
            console.error('❌ insertHeaderTopImage 메서드를 찾을 수 없습니다.');
            if (window.imageManager) {
                console.log('사용 가능한 메서드:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.imageManager)));
            }
        }
        
        console.groupEnd();
    }
    
    checkImageManager() {
        console.group('🔍 이미지 매니저 상태 상세 확인');
        
        const imageManager = window.imageManager;
        
        if (!imageManager) {
            console.error('❌ 이미지 매니저가 로드되지 않았습니다.');
            console.log('해결책:');
            console.log('1. 페이지를 새로고침');
            console.log('2. image-manager.js 파일이 올바르게 로드되었는지 확인');
            console.log('3. 콘솔에서 스크립트 로딩 오류 확인');
            console.groupEnd();
            return false;
        }
        
        console.log('✅ 이미지 매니저 상태:', {
            isInitialized: imageManager.isInitialized,
            uploadedImages: Object.keys(imageManager.uploadedImages || {}).length,
            currentEditingElement: imageManager.currentEditingElement,
            allowedTypes: imageManager.allowedTypes,
            maxFileSize: imageManager.maxFileSize
        });
        
        // 메서드 존재 확인
        const requiredMethods = [
            'openImageManager',
            'insertHeaderTopImage',
            'createTestImage',
            'showImageModal',
            'hideImageModal'
        ];
        
        console.group('메서드 존재 확인');
        requiredMethods.forEach(method => {
            const exists = typeof imageManager[method] === 'function';
            console.log(`${exists ? '✅' : '❌'} ${method}: ${exists ? '존재' : '없음'}`);
        });
        console.groupEnd();
        
        // 이미지 매니저 모달 확인
        const modal = document.getElementById('image-manager-modal');
        console.log('이미지 매니저 모달:', modal ? '존재' : '없음');
        
        console.groupEnd();
        return true;
    }
    
    fixHeaderImage() {
        console.group('🔧 Header 이미지 구조 수정');
        
        // Header 구조 확인 및 수정
        const header = document.querySelector('.app-header');
        if (!header) {
            console.error('❌ Header가 없습니다.');
            console.groupEnd();
            return;
        }
        
        let headerTopImage = header.querySelector('.header-top-image');
        if (!headerTopImage) {
            console.log('📝 Header top image 영역이 없어서 생성합니다.');
            
            headerTopImage = document.createElement('div');
            headerTopImage.className = 'header-top-image';
            headerTopImage.setAttribute('data-editable', 'header-top-image');
            headerTopImage.innerHTML = `
                <div class="image-placeholder cms-image-trigger" data-image-type="header-top" data-image-id="header-top-image" style="height: 120px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.3s ease;">
                    <div style="text-align: center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,12L11,14.5L15,9.5L20,15H4M2,6H14L16,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6Z"/>
                        </svg>
                        <p style="margin-top: 0.5rem; font-size: 0.9rem;">헤더 이미지 추가</p>
                    </div>
                </div>
            `;
            
            header.insertBefore(headerTopImage, header.firstChild);
            console.log('✅ Header top image 영역 생성 완료');
        }
        
        // 이벤트 리스너 강제 재설정
        const placeholder = headerTopImage.querySelector('.image-placeholder');
        if (placeholder) {
            // 기존 이벤트 리스너 제거
            const newPlaceholder = placeholder.cloneNode(true);
            placeholder.parentNode.replaceChild(newPlaceholder, placeholder);
            
            // 새 이벤트 리스너 추가
            newPlaceholder.addEventListener('click', (e) => {
                console.log('🖱️ Header 이미지 플레이스홀더 클릭 - 강제 이벤트');
                
                if (!window.cmsManager || !window.cmsManager.isAdminMode) {
                    console.warn('관리자 모드가 아닙니다.');
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                if (window.imageManager) {
                    headerTopImage.setAttribute('data-image-type', 'header-top');
                    headerTopImage.setAttribute('data-image-id', 'header-top-image');
                    window.imageManager.openImageManager(headerTopImage);
                    console.log('✅ 이미지 매니저 열기 성공');
                } else {
                    console.error('❌ 이미지 매니저를 찾을 수 없습니다.');
                }
            });
            
            console.log('✅ Header 이미지 클릭 이벤트 리스너 재설정 완료');
        }
        
        console.groupEnd();
        return headerTopImage;
    }
    
    testAllImageTypes() {
        console.group('🎨 모든 이미지 타입 테스트');
        
        const imageTypes = [
            { type: 'header-top', selector: '.header-top-image', name: 'Header Top' },
            { type: 'hero', selector: '.hero-background', name: 'Hero Background' },
            { type: 'candidate', selector: '[data-image-type="candidate"]', name: 'Candidate' }
        ];
        
        imageTypes.forEach(({ type, selector, name }) => {
            console.group(`🔧 ${name} 이미지 테스트`);
            
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ ${name} 요소 발견:`, element);
                
                // 테스트 이미지 생성
                this.createTestImageForType(type, element, name);
                
            } else {
                console.warn(`❌ ${name} 요소를 찾을 수 없음 (${selector})`);
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
    }
    
    createTestImageForType(type, element, name) {
        const canvas = document.createElement('canvas');
        
        // 타입별 캔버스 크기 설정
        const dimensions = {
            'header-top': { width: 1200, height: 120 },
            'hero': { width: 800, height: 400 },
            'candidate': { width: 600, height: 300 },
            'default': { width: 600, height: 300 }
        };
        
        const { width, height } = dimensions[type] || dimensions.default;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // 타입별 색상 설정
        const colors = {
            'header-top': ['#1e3c72', '#2a5298'],
            'hero': ['#667eea', '#764ba2'],
            'candidate': ['#f093fb', '#f5576c'],
            'default': ['#20bf6b', '#26d0ce']
        };
        
        const [color1, color2] = colors[type] || colors.default;
        
        // 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 텍스트 추가
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(height / 8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${name} 테스트 이미지`, width / 2, height / 2 - 10);
        
        ctx.font = `${Math.floor(height / 12)}px Arial`;
        ctx.fillText(`${width}x${height} - ${new Date().toLocaleTimeString()}`, width / 2, height / 2 + 20);
        
        const testImageData = {
            id: `test-${type}-${Date.now()}`,
            name: `test-${type}.png`,
            dataUrl: canvas.toDataURL('image/png'),
            size: Math.floor(width * height * 0.1),
            type: 'image/png'
        };
        
        // 이미지 삽입 시도
        if (window.imageManager) {
            try {
                element.setAttribute('data-image-type', type);
                element.setAttribute('data-image-id', `${type}-test`);
                
                window.imageManager.insertImageIntoElement(element, testImageData, `${name} 테스트 이미지`, 'full', 'center');
                console.log(`✅ ${name} 테스트 이미지 삽입 성공`);
                
            } catch (error) {
                console.error(`❌ ${name} 이미지 삽입 실패:`, error);
            }
        }
    }
    
    checkCMSMode() {
        console.group('🔍 CMS 모드 상태 확인');
        
        const cmsManager = window.cmsManager;
        
        if (!cmsManager) {
            console.error('❌ CMS 매니저가 없습니다.');
            console.groupEnd();
            return false;
        }
        
        console.log('CMS 매니저 상태:', {
            isInitialized: cmsManager.isInitialized,
            isLoggedIn: cmsManager.isLoggedIn,
            isAdminMode: cmsManager.isAdminMode,
            currentUser: cmsManager.currentUser
        });
        
        // 관리자 모드 활성화 가이드
        if (!cmsManager.isLoggedIn) {
            console.group('📝 로그인 가이드');
            console.log('1. 로고를 3번 연속 클릭');
            console.log('2. 나타나는 관리자 버튼 클릭');
            console.log('3. 로그인 정보 입력:');
            console.log('   - admin / leewookyu2026!');
            console.log('   - editor / jinan2026!');
            console.groupEnd();
        } else if (!cmsManager.isAdminMode) {
            console.log('💡 관리자 버튼을 클릭하여 관리자 모드를 활성화하세요.');
        }
        
        // Body 클래스 확인
        const hasAdminClass = document.body.classList.contains('admin-mode');
        console.log('Body admin-mode 클래스:', hasAdminClass ? '있음' : '없음');
        
        console.groupEnd();
        return cmsManager.isAdminMode;
    }
    
    runFullDiagnostic() {
        console.group('🔬 Header 이미지 전체 진단');
        
        const results = {
            headerElements: this.checkHeaderElements(),
            imageManager: this.checkImageManager(),
            cmsMode: this.checkCMSMode(),
            eventListeners: this.checkEventListeners()
        };
        
        // 종합 진단 결과
        console.group('📊 진단 결과 요약');
        
        const issues = [];
        const recommendations = [];
        
        if (!results.headerElements.headerTopImage) {
            issues.push('Header 이미지 컨테이너가 없음');
            recommendations.push('headerDebug.fixHeaderImage() 실행');
        }
        
        if (!results.headerElements.imagePlaceholder) {
            issues.push('이미지 플레이스홀더가 없음');
            recommendations.push('headerDebug.fixHeaderImage() 실행');
        }
        
        if (!results.imageManager) {
            issues.push('이미지 매니저가 로드되지 않음');
            recommendations.push('페이지 새로고침 후 image-manager.js 확인');
        }
        
        if (!results.cmsMode) {
            issues.push('CMS 관리자 모드가 비활성화됨');
            recommendations.push('로고 3번 클릭 후 로그인');
        }
        
        if (issues.length === 0) {
            console.log('✅ 모든 시스템이 정상적으로 작동합니다!');
            console.log('💡 headerDebug.testImageUpload()로 이미지 업로드를 테스트하세요.');
        } else {
            console.group('❌ 발견된 문제점');
            issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
            console.groupEnd();
            
            console.group('🔧 권장 해결책');
            recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
        console.groupEnd();
        
        return {
            success: issues.length === 0,
            issues,
            recommendations,
            results
        };
    }
    
    // 자동 수정 기능
    autoFix() {
        console.group('🔄 자동 수정 실행');
        
        const diagnostic = this.runFullDiagnostic();
        
        if (diagnostic.success) {
            console.log('✅ 수정할 항목이 없습니다.');
            console.groupEnd();
            return;
        }
        
        // Header 이미지 구조 수정
        if (!diagnostic.results.headerElements.headerTopImage) {
            console.log('🔧 Header 이미지 구조 수정 중...');
            this.fixHeaderImage();
        }
        
        // 이미지 매니저 재초기화
        if (!diagnostic.results.imageManager && window.ImageManager) {
            console.log('🔧 이미지 매니저 재초기화 중...');
            try {
                window.imageManager = new window.ImageManager();
                window.imageManager.init();
                console.log('✅ 이미지 매니저 재초기화 완료');
            } catch (error) {
                console.error('❌ 이미지 매니저 재초기화 실패:', error);
            }
        }
        
        console.log('🔄 자동 수정 완료. 다시 진단을 실행하세요.');
        console.groupEnd();
        
        // 3초 후 재진단
        setTimeout(() => {
            console.log('🔍 재진단 실행...');
            this.runFullDiagnostic();
        }, 3000);
    }
    
    // 성능 테스트
    performanceTest() {
        console.group('⚡ Header 이미지 성능 테스트');
        
        const testSizes = [
            { width: 800, height: 120, name: 'Small' },
            { width: 1200, height: 120, name: 'Medium' },
            { width: 1920, height: 120, name: 'Large' }
        ];
        
        testSizes.forEach(({ width, height, name }) => {
            const start = performance.now();
            
            // 테스트 이미지 생성
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // 간단한 그라데이션
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(1, '#2a5298');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/png');
            const end = performance.now();
            
            console.log(`${name} (${width}x${height}): ${(end - start).toFixed(2)}ms, 크기: ${Math.round(dataUrl.length / 1024)}KB`);
        });
        
        console.groupEnd();
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const debugger = new HeaderImageDebugger();
    debugger.init();
    
    // 전역 접근
    window.HeaderImageDebugger = HeaderImageDebugger;
    window.headerImageDebugger = debugger;
});