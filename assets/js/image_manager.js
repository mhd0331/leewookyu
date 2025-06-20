// Image Management System (수정된 버전 - 이미지 첨부 문제 해결)
class ImageManager {
    constructor() {
        this.uploadedImages = {};
        this.currentEditingElement = null;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.isInitialized = false;
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🔧 이미지 매니저 초기화 시작...');
        
        this.createImageModal();
        this.setupEventListeners();
        this.loadSavedImages();
        this.isInitialized = true;
        
        console.log('✅ 이미지 매니저 초기화 완료');
    }
    
    createImageModal() {
        // 기존 모달이 있으면 제거
        const existingModal = document.getElementById('image-manager-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'image-manager-modal';
        modal.className = 'popup-overlay hidden';
        modal.innerHTML = `
            <div class="popup-content image-manager-content">
                <h3 id="image-modal-title">이미지 관리</h3>
                
                <div class="image-upload-section">
                    <h4>새 이미지 업로드</h4>
                    <div class="upload-area" id="image-upload-area">
                        <div class="upload-placeholder">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            <p>이미지를 드래그하거나 클릭하여 업로드</p>
                            <p class="upload-hint">JPG, PNG, GIF, WEBP (최대 5MB)</p>
                        </div>
                        <input type="file" id="image-file-input" accept="image/*" multiple style="display: none;">
                    </div>
                    
                    <div class="upload-preview" id="upload-preview"></div>
                </div>
                
                <div class="image-gallery-section">
                    <h4>업로드된 이미지 (<span id="image-count">0</span>개)</h4>
                    <div class="image-gallery" id="image-gallery">
                        <div class="no-images">업로드된 이미지가 없습니다.</div>
                    </div>
                </div>
                
                <div class="image-settings-section hidden" id="image-settings">
                    <h4>이미지 설정</h4>
                    <div class="form-group">
                        <label for="image-alt">대체 텍스트 (Alt):</label>
                        <input type="text" id="image-alt" placeholder="이미지 설명">
                    </div>
                    <div class="form-group">
                        <label for="image-size">크기:</label>
                        <select id="image-size">
                            <option value="small">작게 (200px)</option>
                            <option value="medium" selected>보통 (400px)</option>
                            <option value="large">크게 (600px)</option>
                            <option value="full">전체 너비</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="image-position">위치:</label>
                        <select id="image-position">
                            <option value="left">왼쪽</option>
                            <option value="center" selected>가운데</option>
                            <option value="right">오른쪽</option>
                        </select>
                    </div>
                </div>
                
                <div class="popup-buttons">
                    <button id="insert-image-btn" class="popup-button agree-button hidden">이미지 삽입</button>
                    <button id="create-test-image" class="popup-button agree-button">테스트 이미지 생성</button>
                    <button id="close-image-manager" class="popup-button disagree-button">닫기</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('이미지 모달 생성 완료');
    }
    
    setupEventListeners() {
        console.log('🔧 이미지 매니저 이벤트 리스너 설정...');
        
        const modal = document.getElementById('image-manager-modal');
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('image-file-input');
        const closeBtn = document.getElementById('close-image-manager');
        const insertBtn = document.getElementById('insert-image-btn');
        const testBtn = document.getElementById('create-test-image');
        
        if (!modal || !uploadArea || !fileInput) {
            console.error('❌ 필수 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 드래그 앤 드롭 이벤트 (수정됨)
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('drag-over');
            console.log('드래그 오버 감지');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 자식 요소로의 이동은 무시
            if (!uploadArea.contains(e.relatedTarget)) {
                uploadArea.classList.remove('drag-over');
                console.log('드래그 리브 감지');
            }
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
            
            console.log('파일 드롭 감지:', e.dataTransfer.files.length + '개');
            const files = Array.from(e.dataTransfer.files);
            this.processFiles(files);
        });
        
        // 클릭 업로드 (수정됨)
        uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('업로드 영역 클릭됨');
            fileInput.click();
        });
        
        // 파일 선택 이벤트 (수정됨)
        fileInput.addEventListener('change', (e) => {
            console.log('파일 선택됨:', e.target.files.length + '개');
            const files = Array.from(e.target.files);
            this.processFiles(files);
            // 파일 인풋 초기화 (같은 파일 재선택 가능하도록)
            fileInput.value = '';
        });
        
        // 버튼 이벤트들
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('이미지 매니저 닫기');
                this.hideImageModal();
            });
        }
        
        if (insertBtn) {
            insertBtn.addEventListener('click', () => {
                console.log('이미지 삽입 버튼 클릭됨');
                this.insertSelectedImage();
            });
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                console.log('테스트 이미지 생성 버튼 클릭됨');
                this.createTestImage();
            });
        }
        
        // 모달 외부 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('모달 외부 클릭으로 닫기');
                this.hideImageModal();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                console.log('ESC 키로 모달 닫기');
                this.hideImageModal();
            }
        });
        
        console.log('✅ 이미지 매니저 이벤트 리스너 설정 완료');
    }
    
    showImageModal(editingElement = null) {
        console.log('🖼️ 이미지 모달 표시:', editingElement);
        
        this.currentEditingElement = editingElement;
        const modal = document.getElementById('image-manager-modal');
        const title = document.getElementById('image-modal-title');
        
        if (!modal) {
            console.error('❌ 이미지 모달을 찾을 수 없습니다.');
            return;
        }
        
        if (editingElement) {
            const imageType = editingElement.getAttribute('data-image-type') || '일반';
            const imageId = editingElement.getAttribute('data-image-id') || '';
            title.textContent = `${imageType} 이미지 추가/변경 (${imageId})`;
            console.log(`이미지 타입: ${imageType}, ID: ${imageId}`);
        } else {
            title.textContent = '이미지 관리';
        }
        
        modal.classList.remove('hidden');
        this.refreshImageGallery();
        
        // 포커스 설정
        const uploadArea = document.getElementById('image-upload-area');
        if (uploadArea) {
            uploadArea.focus();
        }
        
        console.log('✅ 이미지 모달 표시 완료');
    }
    
    hideImageModal() {
        const modal = document.getElementById('image-manager-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentEditingElement = null;
        this.clearSelection();
        console.log('이미지 모달 숨김');
    }
    
    processFiles(files) {
        console.log(`📁 파일 처리 시작: ${files.length}개`);
        
        if (files.length === 0) {
            console.warn('선택된 파일이 없습니다.');
            return;
        }
        
        const validFiles = files.filter(file => {
            const isValid = this.validateFile(file);
            console.log(`파일 검증: ${file.name} - ${isValid ? '유효' : '유효하지 않음'}`);
            return isValid;
        });
        
        console.log(`유효한 파일: ${validFiles.length}개`);
        
        if (validFiles.length === 0) {
            this.showMessage('유효한 이미지 파일이 없습니다.', 'error');
            return;
        }
        
        // 각 파일을 순차적으로 업로드
        validFiles.forEach((file, index) => {
            console.log(`파일 업로드 시작 ${index + 1}/${validFiles.length}: ${file.name}`);
            this.uploadFile(file);
        });
    }
    
    validateFile(file) {
        console.log(`파일 검증 중: ${file.name}, 타입: ${file.type}, 크기: ${file.size}`);
        
        if (!this.allowedTypes.includes(file.type)) {
            this.showMessage(`지원하지 않는 파일 형식: ${file.name} (${file.type})`, 'error');
            return false;
        }
        
        if (file.size > this.maxFileSize) {
            this.showMessage(`파일 크기가 너무 큽니다: ${file.name} (${this.formatFileSize(file.size)})`, 'error');
            return false;
        }
        
        return true;
    }
    
    async uploadFile(file) {
        const fileId = this.generateFileId();
        console.log(`📤 파일 업로드 시작: ${file.name} (ID: ${fileId})`);
        
        const preview = this.createUploadPreview(file, fileId);
        
        try {
            const dataUrl = await this.fileToDataUrl(file);
            
            const imageData = {
                id: fileId,
                name: file.name,
                dataUrl: dataUrl,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString()
            };
            
            this.uploadedImages[fileId] = imageData;
            console.log(`✅ 이미지 데이터 저장 완료: ${file.name}`);
            
            this.saveToStorage();
            this.refreshImageGallery();
            this.removeUploadPreview(fileId);
            
            this.showMessage(`이미지 업로드 완료: ${file.name}`, 'success');
            
        } catch (error) {
            console.error('❌ 이미지 업로드 실패:', error);
            this.showMessage(`업로드 실패: ${file.name} - ${error.message}`, 'error');
            this.removeUploadPreview(fileId);
        }
    }
    
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                console.log(`📖 파일 읽기 완료: ${file.name}`);
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                console.error(`❌ 파일 읽기 실패: ${file.name}`, e);
                reject(new Error('파일을 읽을 수 없습니다.'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    createUploadPreview(file, fileId) {
        const preview = document.getElementById('upload-preview');
        if (!preview) return null;
        
        const previewItem = document.createElement('div');
        previewItem.className = 'upload-preview-item';
        previewItem.id = `preview-${fileId}`;
        previewItem.innerHTML = `
            <div class="preview-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
            <div class="upload-progress">
                <div class="progress-bar"></div>
            </div>
        `;
        
        preview.appendChild(previewItem);
        console.log(`📋 업로드 미리보기 생성: ${file.name}`);
        return previewItem;
    }
    
    removeUploadPreview(fileId) {
        const preview = document.getElementById(`preview-${fileId}`);
        if (preview) {
            preview.remove();
            console.log(`🗑️ 업로드 미리보기 제거: ${fileId}`);
        }
    }
    
    refreshImageGallery() {
        const gallery = document.getElementById('image-gallery');
        const imageCount = document.getElementById('image-count');
        
        if (!gallery) return;
        
        const images = Object.values(this.uploadedImages);
        console.log(`🖼️ 이미지 갤러리 새로고침: ${images.length}개`);
        
        // 이미지 개수 업데이트
        if (imageCount) {
            imageCount.textContent = images.length;
        }
        
        if (images.length === 0) {
            gallery.innerHTML = '<div class="no-images">업로드된 이미지가 없습니다.</div>';
            return;
        }
        
        gallery.innerHTML = images.map(image => `
            <div class="gallery-item" data-image-id="${image.id}">
                <div class="image-wrapper">
                    <img src="${image.dataUrl}" alt="${image.name}" loading="lazy">
                    <div class="image-overlay">
                        <button class="image-action select-btn" data-action="select" title="이미지 선택">선택</button>
                        <button class="image-action delete-btn" data-action="delete" title="이미지 삭제">삭제</button>
                    </div>
                </div>
                <div class="image-info">
                    <div class="image-name" title="${image.name}">${image.name}</div>
                    <div class="image-meta">${this.formatFileSize(image.size)} • ${new Date(image.uploadDate).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
        
        // 이벤트 리스너 추가
        gallery.querySelectorAll('.image-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleImageAction(e);
            });
        });
        
        console.log('✅ 이미지 갤러리 새로고침 완료');
    }
    
    handleImageAction(e) {
        const action = e.target.dataset.action;
        const imageId = e.target.closest('.gallery-item').dataset.imageId;
        
        console.log(`🎬 이미지 액션: ${action}, ID: ${imageId}`);
        
        if (action === 'select') {
            this.selectImage(imageId);
        } else if (action === 'delete') {
            this.deleteImage(imageId);
        }
    }
    
    selectImage(imageId) {
        console.log(`✅ 이미지 선택: ${imageId}`);
        
        // 이전 선택 해제
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 새 선택
        const selectedItem = document.querySelector(`[data-image-id="${imageId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            this.showImageSettings(imageId);
            
            const imageData = this.uploadedImages[imageId];
            if (imageData) {
                console.log(`이미지 선택됨: ${imageData.name}`);
            }
        }
    }
    
    showImageSettings(imageId) {
        const settings = document.getElementById('image-settings');
        const insertBtn = document.getElementById('insert-image-btn');
        const altInput = document.getElementById('image-alt');
        
        if (settings && insertBtn) {
            settings.classList.remove('hidden');
            insertBtn.classList.remove('hidden');
            insertBtn.dataset.imageId = imageId;
            
            // 기본 alt 텍스트 설정
            const imageData = this.uploadedImages[imageId];
            if (imageData && altInput) {
                altInput.value = imageData.name.replace(/\.[^/.]+$/, ""); // 확장자 제거
            }
            
            console.log('이미지 설정 패널 표시');
        }
    }
    
    clearSelection() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const settings = document.getElementById('image-settings');
        const insertBtn = document.getElementById('insert-image-btn');
        
        if (settings) settings.classList.add('hidden');
        if (insertBtn) {
            insertBtn.classList.add('hidden');
            insertBtn.removeAttribute('data-image-id');
        }
        
        console.log('이미지 선택 해제');
    }
    
    insertSelectedImage() {
        const insertBtn = document.getElementById('insert-image-btn');
        const imageId = insertBtn?.dataset.imageId;
        
        if (!imageId || !this.uploadedImages[imageId]) {
            this.showMessage('선택된 이미지가 없습니다.', 'error');
            return;
        }
        
        const imageData = this.uploadedImages[imageId];
        const alt = document.getElementById('image-alt')?.value || imageData.name;
        const size = document.getElementById('image-size')?.value || 'medium';
        const position = document.getElementById('image-position')?.value || 'center';
        
        console.log(`🖼️ 이미지 삽입 시작: ${imageData.name}`);
        
        this.insertImageIntoElement(this.currentEditingElement, imageData, alt, size, position);
        this.hideImageModal();
    }
    
    insertImageIntoElement(element, imageData, alt, size, position) {
        if (!element) {
            this.showMessage('삽입할 위치를 찾을 수 없습니다.', 'error');
            return;
        }
        
        console.log('🔧 이미지 삽입 처리:', {
            element: element.tagName,
            imageType: element.getAttribute('data-image-type'),
            imageId: element.getAttribute('data-image-id'),
            imageName: imageData.name
        });
        
        const imageType = element.getAttribute('data-image-type');
        
        try {
            // 이미지 타입에 따라 다른 삽입 방식 사용
            switch (imageType) {
                case 'header-top':
                    this.insertHeaderTopImage(element, imageData, alt);
                    break;
                case 'hero':
                    this.insertHeroImage(element, imageData, alt);
                    break;
                case 'candidate':
                    this.insertCandidateImage(element, imageData, alt);
                    break;
                case 'policy':
                case 'policy-detail':
                    this.insertPolicyImage(element, imageData, alt, size, position);
                    break;
                case 'vision':
                case 'vision-detail':
                    this.insertVisionImage(element, imageData, alt, size, position);
                    break;
                default:
                    this.insertGenericImage(element, imageData, alt, size, position);
            }
            
            this.showMessage(`이미지가 삽입되었습니다: ${imageData.name}`, 'success');
            console.log('✅ 이미지 삽입 완료');
            
        } catch (error) {
            console.error('❌ 이미지 삽입 실패:', error);
            this.showMessage(`이미지 삽입 실패: ${error.message}`, 'error');
        }
    }
    
    // Header Top 이미지 삽입
    insertHeaderTopImage(element, imageData, alt) {
        console.log('📌 Header top 이미지 삽입');
        
        const imagePlaceholder = element.querySelector('.image-placeholder');
        
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
        
        // 기존 이미지 제거
        const existingImg = element.querySelector('.header-top-img');
        if (existingImg) {
            existingImg.remove();
        }
        
        // 새 이미지 추가
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.alt = alt;
        img.className = 'header-top-img';
        img.style.cssText = `
            width: 100%;
            height: 120px;
            object-fit: cover;
            display: block;
            border-radius: 0 0 10px 10px;
        `;
        
        element.insertBefore(img, element.firstChild);
        console.log('✅ Header top 이미지 삽입 완료');
    }
    
    // Hero 이미지 삽입
    insertHeroImage(element, imageData, alt) {
        console.log('🦸 Hero 이미지 삽입');
        
        const imagePlaceholder = element.querySelector('.image-placeholder');
        
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
        
        // 기존 이미지 제거
        const existingImg = element.querySelector('.hero-bg-image');
        if (existingImg) {
            existingImg.remove();
        }
        
        // 새 이미지 추가
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.alt = alt;
        img.className = 'hero-bg-image';
        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
            opacity: 0.7;
        `;
        
        element.insertBefore(img, element.firstChild);
        console.log('✅ Hero 이미지 삽입 완료');
    }
    
    // 후보자 이미지 삽입
    insertCandidateImage(element, imageData, alt) {
        console.log('👤 후보자 이미지 삽입');
        
        const imagePlaceholder = element.querySelector('.image-placeholder');
        
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
        
        // 기존 이미지 제거
        const existingImg = element.querySelector('.candidate-bg-image');
        if (existingImg) {
            existingImg.remove();
        }
        
        // 새 이미지 추가
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.alt = alt;
        img.className = 'candidate-bg-image';
        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 15px;
            opacity: 0.4;
            z-index: 1;
        `;
        
        element.insertBefore(img, element.firstChild);
        console.log('✅ 후보자 이미지 삽입 완료');
    }
    
    // 정책 이미지 삽입
    insertPolicyImage(element, imageData, alt, size, position) {
        console.log('📋 정책 이미지 삽입');
        
        const imagePlaceholder = element.querySelector('.image-placeholder');
        
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
        
        // 기존 이미지 제거
        const existingImg = element.querySelector('.policy-detail-img');
        if (existingImg) {
            existingImg.remove();
        }
        
        // 새 이미지 추가
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.alt = alt;
        img.className = 'policy-detail-img';
        img.style.cssText = `
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 1rem;
        `;
        
        element.insertBefore(img, element.firstChild);
        console.log('✅ 정책 이미지 삽입 완료');
    }
    
    // 비전 이미지 삽입
    insertVisionImage(element, imageData, alt, size, position) {
        console.log('🎯 비전 이미지 삽입');
        
        const imagePlaceholder = element.querySelector('.image-placeholder');
        
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
        
        // 기존 이미지 제거
        const existingImg = element.querySelector('.vision-detail-img');
        if (existingImg) {
            existingImg.remove();
        }
        
        // 새 이미지 추가
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.alt = alt;
        img.className = 'vision-detail-img';
        img.style.cssText = `
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 1rem;
        `;
        
        element.insertBefore(img, element.firstChild);
        console.log('✅ 비전 이미지 삽입 완료');
    }
    
    // 일반 이미지 삽입
    insertGenericImage(element, imageData, alt, size, position) {
        console.log('🖼️ 일반 이미지 삽입');
        
        const imageContainer = this.createImageContainer(imageData, alt, size, position);
        
        // 기존 이미지가 있다면 교체, 없다면 추가
        const existingImage = element.querySelector('.content-image-container');
        if (existingImage) {
            existingImage.replaceWith(imageContainer);
        } else {
            // 텍스트 앞에 이미지 삽입
            element.insertBefore(imageContainer, element.firstChild);
        }
        
        console.log('✅ 일반 이미지 삽입 완료');
    }
    
    createImageContainer(imageData, alt, size, position) {
        const container = document.createElement('div');
        container.className = `content-image-container size-${size} position-${position}`;
        container.innerHTML = `
            <img src="${imageData.dataUrl}" alt="${alt}" class="content-image">
            <div class="image-caption">${alt}</div>
        `;
        
        return container;
    }
    
    // 테스트 이미지 생성 (개선됨)
    createTestImage() {
        console.log('🧪 테스트 이미지 생성 시작');
        
        const imageType = this.currentEditingElement?.getAttribute('data-image-type') || 'generic';
        
        // Create a test image using canvas
        const canvas = document.createElement('canvas');
        
        // 이미지 타입에 따라 다른 크기 설정
        if (imageType === 'header-top') {
            canvas.width = 1200;
            canvas.height = 120;
        } else if (imageType === 'hero') {
            canvas.width = 800;
            canvas.height = 400;
        } else {
            canvas.width = 600;
            canvas.height = 300;
        }
        
        const ctx = canvas.getContext('2d');
        
        // 타입별 그라데이션 색상
        const gradients = {
            'header-top': ['#1e3c72', '#2a5298'],
            'hero': ['#667eea', '#764ba2'],
            'candidate': ['#f093fb', '#f5576c'],
            'policy': ['#20bf6b', '#26d0ce'],
            'policy-detail': ['#667eea', '#764ba2'],
            'vision': ['#ff9a9e', '#fecfef'],
            'vision-detail': ['#20bf6b', '#26d0ce'],
            'default': ['#667eea', '#764ba2']
        };
        
        const colors = gradients[imageType] || gradients.default;
        
        // 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 패턴 추가
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 텍스트 추가
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(canvas.height / 8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(`테스트 ${imageType} 이미지`, canvas.width / 2, canvas.height / 2 - 10);
        
        // 부제목
        ctx.font = `${Math.floor(canvas.height / 12)}px Arial`;
        ctx.fillText(`${canvas.width}x${canvas.height} - ${new Date().toLocaleTimeString()}`, canvas.width / 2, canvas.height / 2 + 20);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // 테스트 이미지 데이터 생성
        const testImageData = {
            id: this.generateFileId(),
            name: `test_${imageType}_${Date.now()}.png`,
            dataUrl: dataUrl,
            size: Math.floor(canvas.width * canvas.height * 0.1), // 대략적인 크기
            type: 'image/png',
            uploadDate: new Date().toISOString()
        };
        
        // 업로드된 이미지 목록에 추가
        this.uploadedImages[testImageData.id] = testImageData;
        this.saveToStorage();
        this.refreshImageGallery();
        
        console.log(`✅ 테스트 이미지 생성 완료: ${testImageData.name}`);
        
        // 바로 삽입
        if (this.currentEditingElement) {
            this.insertImageIntoElement(this.currentEditingElement, testImageData, `테스트 ${imageType} 이미지`, 'medium', 'center');
            this.hideImageModal();
        }
        
        this.showMessage(`테스트 ${imageType} 이미지가 생성되어 삽입되었습니다.`, 'success');
    }
    
    deleteImage(imageId) {
        const imageData = this.uploadedImages[imageId];
        if (!imageData) return;
        
        if (confirm(`'${imageData.name}' 이미지를 삭제하시겠습니까?`)) {
            delete this.uploadedImages[imageId];
            this.saveToStorage();
            this.refreshImageGallery();
            this.clearSelection();
            this.showMessage(`이미지가 삭제되었습니다: ${imageData.name}`, 'success');
            console.log(`🗑️ 이미지 삭제: ${imageData.name}`);
        }
    }
    
    saveToStorage() {
        try {
            const dataToSave = JSON.stringify(this.uploadedImages);
            localStorage.setItem('cms_images', dataToSave);
            console.log(`💾 이미지 데이터 저장 완료: ${Object.keys(this.uploadedImages).length}개`);
        } catch (error) {
            console.error('❌ 이미지 저장 실패:', error);
            this.showMessage('이미지 저장 중 오류가 발생했습니다.', 'error');
        }
    }
    
    loadSavedImages() {
        try {
            const saved = localStorage.getItem('cms_images');
            if (saved) {
                this.uploadedImages = JSON.parse(saved);
                console.log(`📂 저장된 이미지 로드: ${Object.keys(this.uploadedImages).length}개`);
            } else {
                console.log('저장된 이미지가 없습니다.');
            }
        } catch (error) {
            console.error('❌ 저장된 이미지 로드 실패:', error);
            this.uploadedImages = {};
        }
    }
    
    generateFileId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showMessage(message, type = 'info') {
        console.log(`💬 메시지 [${type}]: ${message}`);
        
        if (window.cmsManager && typeof window.cmsManager.showMessage === 'function') {
            window.cmsManager.showMessage(message, type);
        } else {
            // Fallback 메시지 표시
            const messageEl = document.createElement('div');
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                padding: 1rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                max-width: 300px;
                opacity: 0;
                transition: opacity 0.3s ease;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            `;
            messageEl.textContent = message;
            document.body.appendChild(messageEl);
            
            // 애니메이션
            setTimeout(() => messageEl.style.opacity = '1', 10);
            setTimeout(() => {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    // 공개 API 메서드들
    openImageManager(editingElement = null) {
        console.log('🚀 이미지 매니저 열기 요청');
        this.showImageModal(editingElement);
    }
    
    getUploadedImages() {
        return this.uploadedImages;
    }
    
    exportImages() {
        const dataStr = JSON.stringify(this.uploadedImages, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cms_images_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('이미지 데이터가 내보내기되었습니다.', 'success');
    }
    
    importImages(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedImages = JSON.parse(e.target.result);
                this.uploadedImages = { ...this.uploadedImages, ...importedImages };
                this.saveToStorage();
                this.refreshImageGallery();
                this.showMessage('이미지 데이터가 가져오기되었습니다.', 'success');
            } catch (error) {
                this.showMessage('이미지 데이터 가져오기 실패', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // 디버깅 도구
    debug() {
        console.group('🔍 이미지 매니저 디버그 정보');
        console.log('초기화 상태:', this.isInitialized);
        console.log('업로드된 이미지 수:', Object.keys(this.uploadedImages).length);
        console.log('현재 편집 요소:', this.currentEditingElement);
        console.log('허용된 파일 타입:', this.allowedTypes);
        console.log('최대 파일 크기:', this.formatFileSize(this.maxFileSize));
        
        // DOM 요소 확인
        const modal = document.getElementById('image-manager-modal');
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('image-file-input');
        const gallery = document.getElementById('image-gallery');
        
        console.log('DOM 요소 상태:', {
            modal: !!modal,
            uploadArea: !!uploadArea,
            fileInput: !!fileInput,
            gallery: !!gallery
        });
        
        console.groupEnd();
        
        return {
            isInitialized: this.isInitialized,
            imageCount: Object.keys(this.uploadedImages).length,
            currentElement: this.currentEditingElement,
            domElements: {
                modal: !!modal,
                uploadArea: !!uploadArea,
                fileInput: !!fileInput,
                gallery: !!gallery
            }
        };
    }
}

// 전역 인스턴스 생성 및 초기화
let imageManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 이미지 매니저 DOMContentLoaded 초기화');
    
    imageManager = new ImageManager();
    imageManager.init();
    
    // 전역 접근
    window.ImageManager = ImageManager;
    window.imageManager = imageManager;
    
    // 디버깅 도구 전역 노출
    window.debugImageManager = () => imageManager.debug();
    
    console.log('✅ 이미지 매니저 전역 설정 완료');
});