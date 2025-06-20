// PWA Manager - 프로그레시브 웹 앱 기능 관리
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isStandalone = false;
        this.serviceWorker = null;
        this.updateAvailable = false;
        this.installBannerDismissed = false;
        
        this.init();
    }
    
    init() {
        console.log('PWA Manager 초기화 시작...');
        
        this.checkInstallStatus();
        this.setupEventListeners();
        this.checkNetworkStatus();
        this.setupVisibilityChange();
        
        // PWA 설치 프롬프트 감지
        this.detectInstallPrompt();
        
        // 3초 후 설치 배너 표시 검토
        setTimeout(() => {
            this.checkShowInstallBanner();
        }, 3000);
        
        console.log('PWA Manager 초기화 완료');
    }
    
    checkInstallStatus() {
        // 스탠드얼론 모드 감지
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
        
        // 설치 상태 확인
        this.isInstalled = this.isStandalone || this.getStoredInstallStatus();
        
        if (this.isInstalled) {
            console.log('✅ PWA가 이미 설치되어 있습니다.');
        } else {
            console.log('📱 PWA 설치 가능한 상태입니다.');
        }
        
        // iOS Safari 감지
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    
    setupEventListeners() {
        // 설치 버튼 이벤트
        const installBtn = document.getElementById('pwa-install-btn');
        const dismissBtn = document.getElementById('pwa-dismiss-btn');
        
        if (installBtn) {
            installBtn.addEventListener('click', () => this.installApp());
        }
        
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismissInstallBanner());
        }
        
        // 업데이트 버튼 이벤트
        const updateBtn = document.getElementById('pwa-update-btn');
        const updateDismissBtn = document.getElementById('pwa-update-dismiss');
        
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateApp());
        }
        
        if (updateDismissBtn) {
            updateDismissBtn.addEventListener('click', () => this.hideUpdateNotification());
        }
        
        // PWA 설치 감지
        window.addEventListener('appinstalled', () => {
            this.handleAppInstalled();
        });
        
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    detectInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('💾 PWA 설치 프롬프트 감지됨');
            
            // 기본 프롬프트 방지
            e.preventDefault();
            
            // 나중에 사용할 수 있도록 이벤트 저장
            this.deferredPrompt = e;
            
            // 설치 배너 표시 검토
            this.checkShowInstallBanner();
        });
    }
    
    checkShowInstallBanner() {
        // 이미 설치되어 있거나 배너가 이전에 닫혔다면 표시하지 않음
        if (this.isInstalled || this.installBannerDismissed || this.getStoredBannerDismissed()) {
            return;
        }
        
        // iOS Safari인 경우 다른 메시지 표시
        if (this.isIOS && this.isSafari) {
            this.showIOSInstallInstructions();
            return;
        }
        
        // Android Chrome 또는 지원되는 브라우저에서 설치 프롬프트가 있는 경우에만 표시
        if (this.deferredPrompt) {
            this.showInstallBanner();
        }
    }
    
    showInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('hidden');
            banner.classList.add('animate-slide-in-bottom');
            
            console.log('📱 PWA 설치 배너 표시됨');
            
            // 분석 추적
            this.trackEvent('pwa_install_banner_shown');
        }
    }
    
    hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.add('hidden');
            banner.classList.remove('animate-slide-in-bottom');
        }
    }
    
    dismissInstallBanner() {
        this.hideInstallBanner();
        this.installBannerDismissed = true;
        
        // 배너 닫힘 상태 저장 (24시간)
        const dismissData = {
            dismissed: true,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('pwa_banner_dismissed', JSON.stringify(dismissData));
        } catch (error) {
            console.warn('배너 상태 저장 실패:', error);
        }
        
        this.trackEvent('pwa_install_banner_dismissed');
        console.log('❌ PWA 설치 배너 닫힘');
    }
    
    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('설치 프롬프트를 사용할 수 없습니다.');
            this.showMessage('앱 설치를 사용할 수 없습니다.', 'warning');
            return;
        }
        
        try {
            console.log('🚀 PWA 설치 시작...');
            
            // 설치 프롬프트 표시
            this.deferredPrompt.prompt();
            
            // 사용자 선택 대기
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ 사용자가 PWA 설치에 동의했습니다.');
                this.trackEvent('pwa_install_accepted');
                this.showMessage('앱이 설치되었습니다!', 'success');
            } else {
                console.log('❌ 사용자가 PWA 설치를 거부했습니다.');
                this.trackEvent('pwa_install_rejected');
            }
            
            // 프롬프트 사용 후 제거
            this.deferredPrompt = null;
            this.hideInstallBanner();
            
        } catch (error) {
            console.error('PWA 설치 중 오류:', error);
            this.showMessage('앱 설치 중 오류가 발생했습니다.', 'error');
        }
    }
    
    handleAppInstalled() {
        console.log('🎉 PWA가 성공적으로 설치되었습니다!');
        
        this.isInstalled = true;
        this.hideInstallBanner();
        
        // 설치 상태 저장
        this.storeInstallStatus(true);
        
        // 환영 메시지
        this.showMessage('앱이 성공적으로 설치되었습니다! 홈 화면에서 확인하세요.', 'success');
        
        // 분석 추적
        this.trackEvent('pwa_installed');
        
        // 설치 완료 후 초기 설정
        this.setupInstalledApp();
    }
    
    setupInstalledApp() {
        // 설치된 앱에 특화된 기능 활성화
        document.body.classList.add('pwa-installed');
        
        // 푸시 알림 권한 요청 (선택적)
        this.requestNotificationPermission();
        
        // 백그라운드 동기화 설정
        this.setupBackgroundSync();
    }
    
    showIOSInstallInstructions() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            // iOS 전용 설치 안내 메시지로 변경
            const content = banner.querySelector('.install-banner-text');
            if (content) {
                content.innerHTML = `
                    <strong>홈 화면에 추가</strong>
                    <p>Safari에서 공유 버튼 → "홈 화면에 추가"를 선택하세요</p>
                `;
            }
            
            // 설치 버튼 숨기고 안내 버튼으로 변경
            const installBtn = banner.querySelector('.install-btn');
            if (installBtn) {
                installBtn.textContent = '확인';
                installBtn.onclick = () => this.dismissInstallBanner();
            }
            
            banner.classList.remove('hidden');
            banner.classList.add('animate-slide-in-bottom');
            
            console.log('📱 iOS Safari 설치 안내 표시됨');
        }
    }
    
    // Service Worker 및 업데이트 관리
    showUpdateNotification() {
        const notification = document.getElementById('pwa-update-notification');
        if (notification) {
            notification.classList.remove('hidden');
            notification.classList.add('animate-slide-in-right');
            
            this.updateAvailable = true;
            console.log('🔄 PWA 업데이트 알림 표시됨');
            
            this.trackEvent('pwa_update_available');
        }
    }
    
    hideUpdateNotification() {
        const notification = document.getElementById('pwa-update-notification');
        if (notification) {
            notification.classList.add('hidden');
            notification.classList.remove('animate-slide-in-right');
        }
    }
    
    async updateApp() {
        if (!this.updateAvailable) {
            console.warn('업데이트할 수 없습니다.');
            return;
        }
        
        try {
            console.log('🔄 PWA 업데이트 시작...');
            
            this.hideUpdateNotification();
            this.showMessage('업데이트를 적용하고 있습니다...', 'info');
            
            // Service Worker에 업데이트 메시지 전송
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SKIP_WAITING'
                });
            }
            
            // 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            this.trackEvent('pwa_update_applied');
            
        } catch (error) {
            console.error('PWA 업데이트 중 오류:', error);
            this.showMessage('업데이트 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 네트워크 상태 관리
    checkNetworkStatus() {
        if (navigator.onLine) {
            this.handleOnline();
        } else {
            this.handleOffline();
        }
    }
    
    handleOnline() {
        console.log('🌐 온라인 상태로 변경됨');
        
        const networkStatus = document.getElementById('network-status');
        if (networkStatus) {
            networkStatus.classList.add('hidden');
        }
        
        document.body.classList.remove('offline-mode');
        document.body.classList.add('online-mode');
        
        // 온라인 복귀 시 데이터 동기화
        this.syncOfflineData();
        
        this.trackEvent('network_online');
    }
    
    handleOffline() {
        console.log('📶 오프라인 상태로 변경됨');
        
        const networkStatus = document.getElementById('network-status');
        if (networkStatus) {
            const text = networkStatus.querySelector('#network-text');
            if (text) {
                text.textContent = '오프라인 모드';
            }
            networkStatus.classList.remove('hidden');
        }
        
        document.body.classList.remove('online-mode');
        document.body.classList.add('offline-mode');
        
        this.showMessage('인터넷 연결이 끊어졌습니다. 오프라인 모드로 전환됩니다.', 'warning');
        
        this.trackEvent('network_offline');
    }
    
    // 백그라운드 동기화
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                console.log('🔄 백그라운드 동기화 설정됨');
                // 필요시 백그라운드 동기화 등록
            }).catch((error) => {
                console.warn('백그라운드 동기화 설정 실패:', error);
            });
        }
    }
    
    syncOfflineData() {
        // 오프라인 중 저장된 데이터 동기화
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SYNC_DATA'
            });
        }
    }
    
    // 알림 권한 관리
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('이 브라우저는 알림을 지원하지 않습니다.');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            console.log('✅ 알림 권한이 이미 허용되어 있습니다.');
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    console.log('✅ 알림 권한이 허용되었습니다.');
                    this.trackEvent('notification_permission_granted');
                    return true;
                } else {
                    console.log('❌ 알림 권한이 거부되었습니다.');
                    this.trackEvent('notification_permission_denied');
                    return false;
                }
            } catch (error) {
                console.error('알림 권한 요청 중 오류:', error);
                return false;
            }
        }
        
        return false;
    }
    
    // 가시성 변화 감지
    setupVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 앱이 백그라운드로 이동됨');
                this.trackEvent('app_hidden');
            } else {
                console.log('📱 앱이 포그라운드로 이동됨');
                this.trackEvent('app_visible');
                
                // 포그라운드 복귀 시 데이터 새로고침
                this.refreshData();
            }
        });
    }
    
    refreshData() {
        // 앱이 다시 활성화될 때 데이터 새로고침
        if (window.appInstance && typeof window.appInstance.loadData === 'function') {
            window.appInstance.loadData().catch(error => {
                console.warn('데이터 새로고침 실패:', error);
            });
        }
    }
    
    // 저장소 관리
    storeInstallStatus(installed) {
        try {
            const installData = {
                installed: installed,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            localStorage.setItem('pwa_install_status', JSON.stringify(installData));
        } catch (error) {
            console.warn('설치 상태 저장 실패:', error);
        }
    }
    
    getStoredInstallStatus() {
        try {
            const stored = localStorage.getItem('pwa_install_status');
            if (stored) {
                const data = JSON.parse(stored);
                return data.installed === true;
            }
        } catch (error) {
            console.warn('설치 상태 조회 실패:', error);
        }
        
        return false;
    }
    
    getStoredBannerDismissed() {
        try {
            const stored = localStorage.getItem('pwa_banner_dismissed');
            if (stored) {
                const data = JSON.parse(stored);
                const dismissedTime = new Date(data.timestamp);
                const now = new Date();
                const hoursDiff = (now - dismissedTime) / (1000 * 60 * 60);
                
                // 24시간이 지나면 다시 배너 표시 가능
                return hoursDiff < 24;
            }
        } catch (error) {
            console.warn('배너 상태 조회 실패:', error);
        }
        
        return false;
    }
    
    // 메시지 표시
    showMessage(message, type = 'info') {
        if (window.cmsManager && typeof window.cmsManager.showMessage === 'function') {
            window.cmsManager.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // 간단한 토스트 메시지 생성
            const toast = document.createElement('div');
            toast.className = `pwa-toast pwa-toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${this.getToastColor(type)};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
                font-size: 0.9rem;
            `;
            
            document.body.appendChild(toast);
            
            // 애니메이션
            setTimeout(() => {
                toast.style.transform = 'translateX(0)';
            }, 100);
            
            // 자동 제거
            setTimeout(() => {
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 4000);
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
                event_category: 'pwa',
                ...properties,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`📊 PWA 이벤트 추적: ${eventName}`, properties);
    }
    
    // PWA 기능 상태 확인
    getStatus() {
        return {
            isInstalled: this.isInstalled,
            isStandalone: this.isStandalone,
            isOnline: navigator.onLine,
            hasInstallPrompt: !!this.deferredPrompt,
            hasNotificationPermission: Notification?.permission === 'granted',
            hasServiceWorker: 'serviceWorker' in navigator,
            updateAvailable: this.updateAvailable,
            platform: this.getPlatform()
        };
    }
    
    getPlatform() {
        if (this.isIOS) return 'iOS';
        if (/Android/i.test(navigator.userAgent)) return 'Android';
        if (/Windows/i.test(navigator.userAgent)) return 'Windows';
        if (/Mac/i.test(navigator.userAgent)) return 'macOS';
        return 'Unknown';
    }
    
    // 강제 새로고침
    forceRefresh() {
        window.location.reload(true);
    }
    
    // PWA 제거 (지원되는 경우)
    async uninstall() {
        if ('getInstalledRelatedApps' in navigator) {
            try {
                const relatedApps = await navigator.getInstalledRelatedApps();
                if (relatedApps.length > 0) {
                    console.log('관련 앱이 설치되어 있습니다:', relatedApps);
                }
            } catch (error) {
                console.warn('설치된 앱 확인 실패:', error);
            }
        }
        
        // PWA 제거는 브라우저/OS에서 직접 수행해야 함
        this.showMessage('앱 제거는 기기의 설정에서 수행할 수 있습니다.', 'info');
    }
    
    // 디버그 정보
    debug() {
        const status = this.getStatus();
        console.group('🐛 PWA Manager 디버그 정보');
        console.table(status);
        console.log('User Agent:', navigator.userAgent);
        console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
        console.log('Screen:', `${screen.width}x${screen.height}`);
        console.log('Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
        console.groupEnd();
        
        return status;
    }
}

// 전역 인스턴스 생성
let pwaManager;

document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
    
    // 전역 접근
    window.PWAManager = PWAManager;
    window.pwaManager = pwaManager;
    
    // 개발자 도구용 디버그 함수
    window.pwaDebug = () => pwaManager.debug();
    window.pwaStatus = () => pwaManager.getStatus();
    window.pwaForceRefresh = () => pwaManager.forceRefresh();
});