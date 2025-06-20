// Service Worker for PWA functionality
const CACHE_NAME = 'leewookyu-pwa-v1.0.0';
const STATIC_CACHE_NAME = 'leewookyu-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'leewookyu-dynamic-v1.0.0';

// 정적 리소스 (앱 셸)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS
    '/assets/css/main.css',
    '/assets/css/components.css',
    '/assets/css/enhanced_design.css',
    '/assets/css/responsive.css',
    '/assets/css/cms.css',
    '/assets/css/pwa-social.css',
    
    // JavaScript
    '/assets/js/app.js',
    '/assets/js/utils.js',
    '/assets/js/navigation.js',
    '/assets/js/policies.js',
    '/assets/js/popup.js',
    '/assets/js/image-manager.js',
    '/assets/js/cms.js',
    '/assets/js/pwa-manager.js',
    '/assets/js/social-share.js',
    
    // 데이터
    '/assets/data/policies.json',
    '/assets/data/candidate.json',
    
    // 아이콘
    '/assets/images/favicon.ico',
    '/assets/images/apple-touch-icon.png',
    '/assets/images/icon-192x192.png',
    '/assets/images/icon-512x512.png'
];

// 동적으로 캐시할 리소스 패턴
const DYNAMIC_CACHE_PATTERNS = [
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/,
    /^https:\/\/developers\.kakao\.com/,
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /\/assets\/images\//
];

// 네트워크 우선 리소스 (항상 최신 버전 필요)
const NETWORK_FIRST_PATTERNS = [
    /\/assets\/data\//,
    /\.json$/,
    /\/api\//
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker 설치 중...');
    
    event.waitUntil(
        Promise.all([
            // 정적 리소스 캐시
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('[SW] 정적 리소스 캐싱 중...');
                return cache.addAll(STATIC_ASSETS).catch((error) => {
                    console.warn('[SW] 일부 리소스 캐싱 실패:', error);
                    // 실패한 리소스가 있어도 설치는 계속 진행
                    return Promise.resolve();
                });
            }),
            
            // 즉시 활성화
            self.skipWaiting()
        ])
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker 활성화 중...');
    
    event.waitUntil(
        Promise.all([
            // 이전 캐시 삭제
            cleanupOldCaches(),
            
            // 모든 탭에서 즉시 제어
            self.clients.claim()
        ])
    );
});

// 페치 이벤트 (네트워크 요청 가로채기)
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // HTTPS가 아닌 요청은 무시 (개발 환경 제외)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        return;
    }
    
    // POST 요청은 캐시하지 않음
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(handleFetch(request));
});

// 메시지 이벤트 (앱에서 보낸 메시지 처리)
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            console.log('[SW] SKIP_WAITING 메시지 수신');
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        case 'SYNC_DATA':
            console.log('[SW] 데이터 동기화 요청');
            syncOfflineData();
            break;
            
        default:
            console.log('[SW] 알 수 없는 메시지 타입:', type);
    }
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
    console.log('[SW] 백그라운드 동기화:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

// 푸시 알림
self.addEventListener('push', (event) => {
    console.log('[SW] 푸시 알림 수신:', event);
    
    const options = {
        body: event.data ? event.data.text() : '새로운 소식이 있습니다!',
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '확인하기',
                icon: '/assets/images/icon-192x192.png'
            },
            {
                action: 'close',
                title: '닫기'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('민주당원 이우규', options)
    );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 알림 클릭:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 알림만 닫기
        return;
    } else {
        // 기본 동작: 앱 열기
        event.waitUntil(
            clients.matchAll().then((clientList) => {
                if (clientList.length > 0) {
                    return clientList[0].focus();
                }
                return clients.openWindow('/');
            })
        );
    }
});

// 네트워크 요청 처리 함수
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // 1. HTML 문서 (앱 셸)
        if (request.destination === 'document') {
            return await handleDocumentRequest(request);
        }
        
        // 2. 네트워크 우선 리소스
        if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
            return await networkFirst(request);
        }
        
        // 3. 정적 리소스 (캐시 우선)
        if (isStaticAsset(url.pathname)) {
            return await cacheFirst(request);
        }
        
        // 4. 동적 리소스 (캐시 후 네트워크)
        if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
            return await staleWhileRevalidate(request);
        }
        
        // 5. 기본 전략: 네트워크 우선
        return await networkFirst(request);
        
    } catch (error) {
        console.error('[SW] 요청 처리 실패:', error);
        return await handleFallback(request);
    }
}

// 문서 요청 처리 (앱 셸)
async function handleDocumentRequest(request) {
    try {
        // 네트워크에서 최신 버전 시도
        const networkResponse = await fetch(request);
        
        // 성공하면 캐시 업데이트 후 반환
        const cache = await caches.open(STATIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] 네트워크 실패, 캐시에서 문서 반환');
        
        // 네트워크 실패 시 캐시에서 반환
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 캐시도 없으면 오프라인 페이지 반환
        return new Response(getOfflinePage(), {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// 캐시 우선 전략
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        console.log('[SW] 캐시 우선 전략 실패:', request.url);
        throw error;
    }
}

// 네트워크 우선 전략
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // 성공적인 응답만 캐시
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] 네트워크 실패, 캐시에서 시도:', request.url);
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale-While-Revalidate 전략
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    // 백그라운드에서 네트워크 요청
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // 네트워크 실패는 조용히 무시
    });
    
    // 캐시에서 즉시 응답
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // 백그라운드 업데이트는 계속 진행
        fetchPromise;
        return cachedResponse;
    }
    
    // 캐시에 없으면 네트워크 응답 대기
    return await fetchPromise;
}

// 폴백 처리
async function handleFallback(request) {
    const url = new URL(request.url);
    
    // 이미지 요청 실패 시 기본 이미지
    if (request.destination === 'image') {
        return new Response(
            '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="150" fill="#f0f0f0"/><text x="100" y="80" text-anchor="middle" fill="#999">이미지를 불러올 수 없습니다</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
    
    // API 요청 실패 시 빈 응답
    if (url.pathname.includes('/api/')) {
        return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 일반 요청 실패
    return new Response('네트워크에 연결할 수 없습니다.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
    });
}

// 유틸리티 함수들
function isStaticAsset(pathname) {
    return STATIC_ASSETS.some(asset => asset === pathname || asset === pathname + '/');
}

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
    
    return Promise.all(
        cacheNames
            .filter(cacheName => !validCaches.includes(cacheName))
            .map(cacheName => {
                console.log('[SW] 이전 캐시 삭제:', cacheName);
                return caches.delete(cacheName);
            })
    );
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

async function syncOfflineData() {
    console.log('[SW] 오프라인 데이터 동기화 시작');
    
    try {
        // 여기에 오프라인 중 저장된 데이터를 서버와 동기화하는 로직 추가
        // 예: 저장된 폼 데이터, 사용자 액션 등
        
        // 정책 데이터 업데이트
        const policyResponse = await fetch('/assets/data/policies.json');
        if (policyResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put('/assets/data/policies.json', policyResponse.clone());
        }
        
        // 후보자 데이터 업데이트
        const candidateResponse = await fetch('/assets/data/candidate.json');
        if (candidateResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put('/assets/data/candidate.json', candidateResponse.clone());
        }
        
        console.log('[SW] 오프라인 데이터 동기화 완료');
        
    } catch (error) {
        console.error('[SW] 데이터 동기화 실패:', error);
    }
}

// 오프라인 페이지 HTML
function getOfflinePage() {
    return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>오프라인 - 민주당원 이우규</title>
        <style>
            body {
                font-family: 'Segoe UI', 'Malgun Gothic', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
            }
            .offline-container {
                max-width: 400px;
                padding: 2rem;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            h1 {
                margin-bottom: 1rem;
                color: white;
            }
            p {
                margin-bottom: 1.5rem;
                opacity: 0.9;
                line-height: 1.6;
            }
            .retry-btn {
                background: rgba(255,255,255,0.2);
                border: 2px solid rgba(255,255,255,0.3);
                color: white;
                padding: 0.8rem 2rem;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
            }
            .retry-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
            .offline-features {
                margin-top: 2rem;
                text-align: left;
            }
            .offline-features h3 {
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
            .offline-features ul {
                list-style: none;
                padding: 0;
            }
            .offline-features li {
                margin-bottom: 0.5rem;
                padding-left: 1.5rem;
                position: relative;
            }
            .offline-features li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #4ade80;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📶</div>
            <h1>인터넷 연결이 끊어졌습니다</h1>
            <p>
                현재 오프라인 상태입니다. 
                인터넷 연결을 확인한 후 다시 시도해주세요.
            </p>
            
            <a href="/" class="retry-btn" onclick="window.location.reload()">
                다시 시도
            </a>
            
            <div class="offline-features">
                <h3>오프라인에서도 이용 가능:</h3>
                <ul>
                    <li>이전에 방문한 페이지</li>
                    <li>저장된 공약 정보</li>
                    <li>후보자 소개</li>
                    <li>기본 앱 기능</li>
                </ul>
            </div>
        </div>
        
        <script>
            // 온라인 상태 감지
            window.addEventListener('online', () => {
                window.location.reload();
            });
            
            // 주기적으로 연결 상태 확인
            setInterval(() => {
                if (navigator.onLine) {
                    window.location.reload();
                }
            }, 5000);
        </script>
    </body>
    </html>
    `;
}

// 캐시 통계
async function getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats[cacheName] = {
            count: keys.length,
            urls: keys.map(req => req.url)
        };
    }
    
    return stats;
}

// 디버그 정보
async function getDebugInfo() {
    const cacheStats = await getCacheStats();
    
    return {
        version: CACHE_NAME,
        staticCacheName: STATIC_CACHE_NAME,
        dynamicCacheName: DYNAMIC_CACHE_NAME,
        staticAssetsCount: STATIC_ASSETS.length,
        cacheStats: cacheStats,
        timestamp: new Date().toISOString()
    };
}

// 개발자 도구에서 사용할 수 있는 글로벌 함수들
self.addEventListener('message', async (event) => {
    if (event.data.type === 'GET_DEBUG_INFO') {
        const debugInfo = await getDebugInfo();
        event.ports[0].postMessage(debugInfo);
    }
    
    if (event.data.type === 'GET_CACHE_STATS') {
        const stats = await getCacheStats();
        event.ports[0].postMessage(stats);
    }
});

// 에러 핸들링
self.addEventListener('error', (event) => {
    console.error('[SW] Service Worker 에러:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] 처리되지 않은 Promise 거부:', event.reason);
});

console.log('[SW] Service Worker 스크립트 로드 완료 - 버전:', CACHE_NAME);