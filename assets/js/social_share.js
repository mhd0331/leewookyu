// Social Share Manager - SNS 공유 기능 관리
class SocialShareManager {
    constructor() {
        this.kakaoApiKey = 'YOUR_KAKAO_API_KEY'; // 실제 카카오 API 키로 교체 필요
        this.currentShareData = null;
        this.isInitialized = false;
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('Social Share Manager 초기화 시작...');
        
        this.initializeKakao();
        this.setupEventListeners();
        this.setupNativeSharing();
        
        this.isInitialized = true;
        console.log('Social Share Manager 초기화 완료');
    }
    
    initializeKakao() {
        // 카카오 SDK 초기화 - 개발 환경에서는 테스트 키 사용
        const testApiKey = 'YOUR_KAKAO_API_KEY'; // 실제 키로 교체하거나 환경변수 사용
        
        if (typeof Kakao !== 'undefined') {
            try {
                // 이미 초기화되어 있다면 cleanup 후 재초기화
                if (Kakao.isInitialized()) {
                    Kakao.cleanup();
                }
                
                // 실제 API 키가 설정되어 있으면 사용, 아니면 테스트 모드
                if (this.kakaoApiKey !== 'YOUR_KAKAO_API_KEY') {
                    Kakao.init(this.kakaoApiKey);
                    console.log('✅ 카카오 SDK 초기화 완료 (실제 키)');
                } else {
                    // 테스트 모드: 실제 API 없이도 UI 동작
                    console.log('⚠️ 카카오 테스트 모드 (실제 공유 불가)');
                    window.kakaoTestMode = true;
                }
            } catch (error) {
                console.warn('카카오 SDK 초기화 실패:', error);
                window.kakaoTestMode = true;
            }
        } else {
            console.warn('⚠️ 카카오 SDK가 로드되지 않았습니다.');
            // SDK가 없어도 UI는 표시하고 테스트 모드로 동작
            window.kakaoTestMode = true;
        }
    }
    
    setupEventListeners() {
        // Floating Action Button
        const shareFab = document.getElementById('share-main-btn');
        const shareMenu = document.getElementById('share-menu');
        
        if (shareFab && shareMenu) {
            shareFab.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleShareMenu();
            });
            
            // 메뉴 외부 클릭 시 닫기
            document.addEventListener('click', () => {
                this.hideShareMenu();
            });
            
            shareMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Share menu buttons
        document.querySelectorAll('.share-btn[data-platform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const platform = e.currentTarget.dataset.platform;
                this.shareToplatform(platform);
            });
        });
        
        // Section share buttons (개선된 이벤트 처리)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.share-section-btn') || e.target.closest('.share-section-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.matches('.share-section-btn') ? e.target : e.target.closest('.share-section-btn');
                const section = btn.dataset.section;
                if (section) {
                    this.shareSection(section);
                }
            }
        });
        
        // Hero share button (개선된 이벤트 처리)
        document.addEventListener('click', (e) => {
            if (e.target.matches('#share-page-btn') || e.target.closest('#share-page-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.sharePage();
            }
        });
        
        // SNS 팔로우 섹션의 공유 버튼 (새로 추가)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.share-trigger') || e.target.closest('.share-trigger')) {
                e.preventDefault();
                e.stopPropagation();
                this.sharePage();
            }
        });
        
        // Share modal events
        const shareModal = document.getElementById('share-modal');
        const closeShareModal = document.getElementById('close-share-modal');
        
        if (closeShareModal) {
            closeShareModal.addEventListener('click', () => {
                this.hideShareModal();
            });
        }
        
        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target === shareModal) {
                    this.hideShareModal();
                }
            });
        }
        
        // Share modal platform buttons
        document.querySelectorAll('.share-option[data-platform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = e.currentTarget.dataset.platform;
                this.shareToplatform(platform, this.currentShareData);
                this.hideShareModal();
            });
        });
    }
    
    // Control Panel 설정 제거 (사용하지 않음)
    
    setupNativeSharing() {
        // Web Share API 지원 확인
        this.nativeShareSupported = navigator.share && navigator.canShare;
        
        if (this.nativeShareSupported) {
            console.log('✅ 네이티브 공유 API 지원됨');
        } else {
            console.log('📱 네이티브 공유 API 미지원, 커스텀 공유 사용');
        }
    }
    
    // 공유 메뉴 토글
    toggleShareMenu() {
        const shareMenu = document.getElementById('share-menu');
        if (shareMenu) {
            shareMenu.classList.toggle('hidden');
            
            if (!shareMenu.classList.contains('hidden')) {
                this.trackEvent('share_menu_opened');
            }
        }
    }
    
    hideShareMenu() {
        const shareMenu = document.getElementById('share-menu');
        if (shareMenu && !shareMenu.classList.contains('hidden')) {
            shareMenu.classList.add('hidden');
        }
    }
    
    // 공유 모달 관리
    showShareModal(shareData) {
        this.currentShareData = shareData;
        
        const modal = document.getElementById('share-modal');
        const title = document.getElementById('share-modal-title');
        
        if (modal && title) {
            title.textContent = shareData.title || '공유하기';
            modal.classList.remove('hidden');
            
            this.trackEvent('share_modal_opened', { type: shareData.type });
        }
    }
    
    hideShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.currentShareData = null;
        }
    }
    
    // 섹션별 공유
    shareSection(sectionName) {
        const shareData = this.getSectionShareData(sectionName);
        
        // 네이티브 공유 API 시도
        if (this.nativeShareSupported) {
            this.tryNativeShare(shareData).then(success => {
                if (!success) {
                    this.showShareModal(shareData);
                }
            });
        } else {
            this.showShareModal(shareData);
        }
    }
    
    // 전체 페이지 공유
    sharePage() {
        const shareData = this.getPageShareData();
        
        if (this.nativeShareSupported) {
            this.tryNativeShare(shareData).then(success => {
                if (!success) {
                    this.showShareModal(shareData);
                }
            });
        } else {
            this.showShareModal(shareData);
        }
    }
    
    // 플랫폼별 공유
    async shareToplatform(platform, shareData = null) {
        if (!shareData) {
            shareData = this.getPageShareData();
        }
        
        this.hideShareMenu();
        
        console.log(`${platform}으로 공유 시도:`, shareData);
        
        try {
            switch (platform) {
                case 'kakao':
                    await this.shareToKakao(shareData);
                    break;
                case 'facebook':
                    this.shareToFacebook(shareData);
                    break;
                case 'twitter':
                    this.shareToTwitter(shareData);
                    break;
                case 'copy':
                    await this.copyToClipboard(shareData);
                    break;
                default:
                    console.warn('지원하지 않는 플랫폼:', platform);
            }
            
            this.trackEvent('share_completed', { 
                platform: platform, 
                type: shareData.type || 'page' 
            });
            
        } catch (error) {
            console.error(`${platform} 공유 실패:`, error);
            this.showMessage(`${platform} 공유 중 오류가 발생했습니다.`, 'error');
        }
    }
    
    // 네이티브 공유 시도
    async tryNativeShare(shareData) {
        if (!this.nativeShareSupported) {
            return false;
        }
        
        try {
            const sharePayload = {
                title: shareData.title,
                text: shareData.description,
                url: shareData.url
            };
            
            if (navigator.canShare && !navigator.canShare(sharePayload)) {
                return false;
            }
            
            await navigator.share(sharePayload);
            
            this.trackEvent('native_share_completed', { type: shareData.type });
            return true;
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('네이티브 공유 실패:', error);
            }
            return false;
        }
    }
    
    // 카카오톡 공유
    async shareToKakao(shareData) {
        // 테스트 모드일 때 시뮬레이션
        if (window.kakaoTestMode || typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
            this.simulateKakaoShare(shareData);
            return;
        }
        
        try {
            Kakao.Link.sendDefault({
                objectType: 'feed',
                content: {
                    title: shareData.title,
                    description: shareData.description,
                    imageUrl: shareData.imageUrl || `${window.location.origin}/assets/images/og-image.jpg`,
                    link: {
                        mobileWebUrl: shareData.url,
                        webUrl: shareData.url
                    }
                },
                buttons: [
                    {
                        title: '자세히 보기',
                        link: {
                            mobileWebUrl: shareData.url,
                            webUrl: shareData.url
                        }
                    }
                ]
            });
            
            this.showMessage('카카오톡으로 공유했습니다!', 'success');
            
        } catch (error) {
            console.error('카카오톡 공유 실패:', error);
            this.simulateKakaoShare(shareData);
        }
    }
    
    // 카카오톡 공유 시뮬레이션 (개발/테스트용)
    simulateKakaoShare(shareData) {
        // 모바일에서는 카카오톡 앱으로 직접 링크
        if (this.isMobile()) {
            const kakaoUrl = `kakaolink://send?msg=${encodeURIComponent(shareData.title + '\n' + shareData.description + '\n' + shareData.url)}`;
            
            // 카카오톡 앱 실행 시도
            window.location.href = kakaoUrl;
            
            // 3초 후 앱이 실행되지 않으면 링크 복사로 대체
            setTimeout(() => {
                this.copyToClipboard(shareData).then(() => {
                    this.showMessage('카카오톡 앱을 찾을 수 없어 링크를 복사했습니다. 카카오톡에서 붙여넣기 해주세요.', 'info');
                });
            }, 3000);
            
        } else {
            // 데스크톱에서는 링크 복사 후 안내
            this.copyToClipboard(shareData).then(() => {
                this.showMessage('링크가 복사되었습니다. 카카오톡에서 붙여넣기 해주세요.\n\n(카카오톡 개발자 키 설정 후 직접 공유 가능)', 'info');
            });
        }
    }
    
    // 모바일 기기 감지
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 페이스북 공유
    shareToFacebook(shareData) {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
        this.openShareWindow(url, 'facebook');
        this.showMessage('페이스북으로 공유했습니다!', 'success');
    }
    
    // 트위터 공유
    shareToTwitter(shareData) {
        const text = `${shareData.title}\n${shareData.description}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareData.url)}`;
        this.openShareWindow(url, 'twitter');
        this.showMessage('트위터로 공유했습니다!', 'success');
    }
    
    // 링크 복사
    async copyToClipboard(shareData) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareData.url);
                this.showMessage('링크가 클립보드에 복사되었습니다!', 'success');
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(shareData.url);
            }
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            this.fallbackCopyToClipboard(shareData.url);
        }
    }
    
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showMessage('링크가 클립보드에 복사되었습니다!', 'success');
            } else {
                this.showMessage('링크 복사에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Fallback 복사 실패:', error);
            this.showMessage('링크 복사에 실패했습니다.', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }
    
    // 공유 창 열기
    openShareWindow(url, platform) {
        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        const popup = window.open(
            url,
            `share-${platform}`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        if (popup) {
            popup.focus();
        } else {
            // 팝업이 차단된 경우 새 탭에서 열기
            window.open(url, '_blank');
        }
    }
    
    // 공유 데이터 생성
    getPageShareData() {
        return {
            type: 'page',
            title: '민주당원 이우규 - 진안군수 후보',
            description: '진안군의 새로운 변화를 함께 만들어갑니다. 6대 비전과 면단위 정책을 확인하세요.',
            url: window.location.href,
            imageUrl: `${window.location.origin}/assets/images/og-image.jpg`
        };
    }
    
    getSectionShareData(sectionName) {
        const sectionData = {
            'policies': {
                type: 'policies',
                title: '이우규 후보 공약 - 진안군 6대 비전',
                description: '농촌형 기본소득, 공공의료 개선, 교통약자 해소 등 진안군 발전을 위한 구체적인 공약을 확인하세요.',
                url: `${window.location.origin}/#policies`
            },
            'about': {
                type: 'about',
                title: '이우규 후보 소개',
                description: '제8대 진안군의회 의원 출신, 더불어민주당 정책위부의장 이우규 후보를 소개합니다.',
                url: `${window.location.origin}/#about`
            },
            'membership': {
                type: 'membership',
                title: '더불어민주당 입당 신청',
                description: '이재명과 함께 새로운 시대로! 더불어민주당 친위 당원 모집 중입니다.',
                url: `${window.location.origin}/#membership`
            }
        };
        
        return sectionData[sectionName] || this.getPageShareData();
    }
    
    // 정책별 개별 공유 데이터
    getPolicyShareData(policyId) {
        // 정책 데이터가 있다면 해당 정책 정보로 공유 데이터 생성
        if (window.PolicyManager && window.PolicyManager.getPolicyById) {
            const policy = window.PolicyManager.getPolicyById(policyId);
            if (policy) {
                return {
                    type: 'policy',
                    title: `${policy.title} - 이우규 후보 공약`,
                    description: policy.summary || policy.description || '이우규 후보의 주요 공약을 확인하세요.',
                    url: `${window.location.origin}/#policies`,
                    imageUrl: `${window.location.origin}/assets/images/og-image.jpg`
                };
            }
        }
        
        return this.getSectionShareData('policies');
    }
    
    // 메시지 표시
    showMessage(message, type = 'info') {
        if (window.cmsManager && typeof window.cmsManager.showMessage === 'function') {
            window.cmsManager.showMessage(message, type);
        } else if (window.pwaManager && typeof window.pwaManager.showMessage === 'function') {
            window.pwaManager.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // 간단한 토스트 메시지
            const toast = document.createElement('div');
            toast.className = `social-toast social-toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${this.getToastColor(type)};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
                font-size: 0.9rem;
                font-weight: 500;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    getToastColor(type) {
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        };
        return colors[type] || colors.info;
    }
    
    // 분석 추적
    trackEvent(eventName, properties = {}) {
        // Google Analytics 추적
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'social_share',
                ...properties,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`📊 Social Share 이벤트 추적: ${eventName}`, properties);
    }
    
    // 공유 통계
    getShareStats() {
        // localStorage에서 공유 통계 조회
        try {
            const stats = localStorage.getItem('social_share_stats');
            return stats ? JSON.parse(stats) : {};
        } catch (error) {
            console.warn('공유 통계 조회 실패:', error);
            return {};
        }
    }
    
    updateShareStats(platform, type) {
        try {
            const stats = this.getShareStats();
            const key = `${platform}_${type}`;
            stats[key] = (stats[key] || 0) + 1;
            stats.lastShared = new Date().toISOString();
            
            localStorage.setItem('social_share_stats', JSON.stringify(stats));
        } catch (error) {
            console.warn('공유 통계 업데이트 실패:', error);
        }
    }
    
    // 공유 상태 확인
    getStatus() {
        return {
            kakaoInitialized: typeof Kakao !== 'undefined' && Kakao.isInitialized(),
            nativeShareSupported: this.nativeShareSupported,
            clipboardSupported: !!(navigator.clipboard && window.isSecureContext),
            shareStats: this.getShareStats(),
            currentUrl: window.location.href,
            isInitialized: this.isInitialized
        };
    }
    
    // 디버그 정보
    debug() {
        const status = this.getStatus();
        console.group('🐛 Social Share Manager 디버그 정보');
        console.table(status);
        console.log('User Agent:', navigator.userAgent);
        console.log('Referrer:', document.referrer);
        console.groupEnd();
        
        return status;
    }
}

// 전역 인스턴스 생성
let socialShareManager;

document.addEventListener('DOMContentLoaded', () => {
    socialShareManager = new SocialShareManager();
    socialShareManager.init();
    
    // 전역 접근
    window.SocialShareManager = SocialShareManager;
    window.socialShareManager = socialShareManager;
    
    // 개발자 도구용 디버그 함수
    window.socialDebug = () => socialShareManager.debug();
    window.socialStatus = () => socialShareManager.getStatus();
    window.socialStats = () => socialShareManager.getShareStats();
});