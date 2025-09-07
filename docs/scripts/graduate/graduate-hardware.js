/**
 * Graduate Hardware Module
 * 하드웨어 인터랙션, 모달, 로봇 파트 관리
 */

window.GraduateHardware = {
    initializeHardwareSystem,
    reinitializeHardwareInteractivity,
    switchHardwareCategory,
    openModal,
    closeModal
};

function initializeHardwareSystem() {
    initializeRobotInteraction();
    initializeHardwareModal();
    
    console.log('🔧 Graduate Hardware 모듈이 초기화되었습니다.');
}

function initializeRobotInteraction() {
    const robotParts = document.querySelectorAll('.robot-part');
    
    if (robotParts.length === 0) return;
    
    // Add click event listeners to robot parts
    robotParts.forEach(part => {
        part.addEventListener('click', () => {
            const category = part.getAttribute('data-category');
            if (category) {
                switchHardwareCategory(category);
                
                // Track interaction if analytics available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'hardware_part_click', {
                        'category': category
                    });
                }
            }
        });
        
        // Add hover effects
        part.addEventListener('mouseenter', () => {
            part.style.opacity = '0.8';
        });
        
        part.addEventListener('mouseleave', () => {
            if (!part.classList.contains('active')) {
                part.style.opacity = '1';
            }
        });
    });
    
    // Initialize with platforms category active
    switchHardwareCategory('platforms');
}

function switchHardwareCategory(category) {
    const robotParts = document.querySelectorAll('.robot-part');
    const hardwareCategoryContents = document.querySelectorAll('.hardware-category-content');
    const panelTitle = document.getElementById('panel-title');
    const panelBadge = document.getElementById('panel-badge');
    
    // Remove active class from all robot parts and contents
    robotParts.forEach(part => part.classList.remove('active'));
    hardwareCategoryContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected category
    const selectedPart = document.querySelector(`.robot-part[data-category="${category}"]`);
    const selectedContent = document.querySelector(`.hardware-category-content[data-category="${category}"]`);
    
    if (selectedPart) selectedPart.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    // Update panel header
    const categoryData = window.GraduateData.categoryData[category];
    if (categoryData && panelTitle && panelBadge) {
        panelTitle.textContent = categoryData.title;
        panelBadge.textContent = categoryData.badge;
        panelBadge.style.background = categoryData.badgeColor;
    }
}

function reinitializeHardwareInteractivity() {
    const newRobotParts = document.querySelectorAll('.robot-part');
    
    if (newRobotParts.length > 0) {
        newRobotParts.forEach(part => {
            part.addEventListener('click', () => {
                const category = part.getAttribute('data-category');
                if (category) {
                    switchHardwareCategory(category);
                }
            });
            
            part.addEventListener('mouseenter', () => {
                part.style.opacity = '0.8';
            });
            
            part.addEventListener('mouseleave', () => {
                if (!part.classList.contains('active')) {
                    part.style.opacity = '1';
                }
            });
        });
        
        // Initialize with platforms category active
        switchHardwareCategory('platforms');
    }
    
    // Reinitialize hardware modal
    const newHardwareItems = document.querySelectorAll('.hardware-item');
    newHardwareItems.forEach(item => {
        item.addEventListener('click', () => {
            const nameElement = item.querySelector('.item-name');
            if (nameElement) {
                const hardwareName = nameElement.textContent.trim();
                openModal(hardwareName);
            }
        });
        item.style.cursor = 'pointer';
    });
}

function initializeHardwareModal() {
    const modal = document.getElementById('hardwareModal');
    const modalClose = document.querySelector('.modal-close');
    const allHardwareItems = document.querySelectorAll('.hardware-item');
    
    if (!modal) return;
    
    // Add event listeners to all hardware items
    allHardwareItems.forEach(item => {
        item.addEventListener('click', () => {
            const nameElement = item.querySelector('.item-name');
            if (nameElement) {
                const hardwareName = nameElement.textContent.trim();
                openModal(hardwareName);
            }
        });
        
        // Add visual feedback
        item.style.cursor = 'pointer';
    });
    
    // Modal close event listeners
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openModal(hardwareName) {
    const modal = document.getElementById('hardwareModal');
    const data = window.GraduateData.hardwareData[hardwareName];
    
    if (!data || !modal) return;
    
    // Populate modal content
    document.getElementById('modalImage').src = data.image;
    document.getElementById('modalImage').alt = data.name;
    document.getElementById('modalName').textContent = data.name;
    document.getElementById('modalSpec').textContent = data.category;
    document.getElementById('modalDescription').textContent = data.description;
    
    // Remove any existing specs section
    const existingSpecs = document.querySelector('.detail-specs');
    if (existingSpecs) {
        existingSpecs.remove();
    }
    
    // Populate features
    const featuresList = document.getElementById('modalFeatures');
    featuresList.innerHTML = '<h5>주요 특징</h5><ul></ul>';
    const featuresUl = featuresList.querySelector('ul');
    data.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresUl.appendChild(li);
    });
    
    // Add specs section
    const specsHtml = `<div class="detail-specs">
        <h5>기술 사양</h5>
        <ul>
            ${Object.entries(data.specs).map(([key, value]) => 
                `<li><strong>${key}:</strong> ${value}</li>`
            ).join('')}
        </ul>
    </div>`;
    
    featuresList.insertAdjacentHTML('afterend', specsHtml);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('hardwareModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other modules to load first
    setTimeout(() => {
        initializeHardwareSystem();
    }, 100);
});