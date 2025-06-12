console.log('script.js loaded and executing'); // DEBUG: Script start
// Global variables
let allContent = {};
let searchIndex = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired'); // DEBUG: DOM loaded
    populateStaticContent(); // Moved to the beginning
    initializeNavigation();
    loadAllContent();
    initializeSearch();
    initializeExpandableContent();
    initializeScrollAnimation();
    
    // Initialize modal functionality
    initializeModal();
    
    // New enhancements
    addScrollIndicator();
    addPageLoadAnimations();
    enhanceSearchExperience();
    addBackToTopButton();
    enhanceMobileMenu();
    addKeyboardSupport();
    addLoadingStates();
    
    // Update search functionality
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.removeEventListener('click', performSearch);
        searchBtn.addEventListener('click', performSearchWithLoading);
    }
});

// Navigation functionality
function initializeNavigation() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    // Mobile menu toggle
    mobileMenuToggle?.addEventListener('click', () => {
        mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
    });

    // Smooth scrolling and active link updates
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
                
                // Close mobile menu if open
                if (mobileNav) {
                    mobileNav.style.display = 'none';
                }
                
                // Update active link
                updateActiveNavLink(href);
            }
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', throttle(updateActiveNavOnScroll, 100));
}

// Debounce function to delay execution of a function until after a certain time has passed without it being called.
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Throttle function to limit the rate at which a function can fire.
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function(...args) {
        const context = this;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        }
    });
}

function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const headerHeight = document.querySelector('.header').offsetHeight;
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    if (current) {
        updateActiveNavLink('#' + current);
    }
}

// Load and parse all markdown content
async function loadAllContent() {
    try {
        // Load all consolidated content files
        const contentFiles = [
            { name: 'general', file: 'consolidated-content/generalInformation-content.md' },
            { name: 'establishment', file: 'consolidated-content/establishment-content.md' },
            { name: 'fees', file: 'consolidated-content/fees-content.md' },
            { name: 'almanac', file: 'consolidated-content/almanac-content.md' },
            { name: 'complete', file: 'consolidated-content/complete-calendar-content.md' }
        ];

        for (const contentFile of contentFiles) {
            try {
                const response = await fetch(contentFile.file);
                if (response.ok) {
                    const text = await response.text();
                    allContent[contentFile.name] = text;
                    parseAndPopulateContent(contentFile.name, text);
                } else {
                    console.warn(`Could not load ${contentFile.file}`);
                }
            } catch (error) {
                console.warn(`Error loading ${contentFile.file}:`, error);
            }
        }

        // Build search index
        buildSearchIndex();
        
    } catch (error) {
        console.error('Error loading content:', error);
        // Fallback content if files can't be loaded
        loadFallbackContent();
    }
}

function parseAndPopulateContent(contentType, markdownText) {
    const sections = parseMarkdownSections(markdownText);
    
    switch (contentType) {
        case 'complete':
            populateGeneralInfoContent(sections);
            break;
        case 'establishment':
            populateEstablishmentContent(sections);
            break;
        case 'fees':
            populateFeesContent(sections);
            break;
        case 'almanac':
            populateAlmanacContent(sections);
            break;
    }
}

function parseMarkdownSections(markdown) {
    const lines = markdown.split('\n');
    const sections = {};
    let currentSection = '';
    let currentContent = [];

    lines.forEach(line => {
        if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
            if (currentSection && currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n');
            }
            currentSection = line.replace(/^#+\s*/, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
            currentContent = [];
        } else if (line.trim()) {
            currentContent.push(line);
        }
    });

    if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
    }

    return sections;
}

function populateGeneralInfoContent(sections) {
    // Origin content
    const originContent = extractSectionContent(allContent.complete, ['origin', 'history']);
    populateExpandableContent('origin-content', originContent);

    // Ordinance content
    const ordinanceContent = extractSectionContent(allContent.complete, ['ordinance', 'fulton']);
    populateExpandableContent('ordinance-content', ordinanceContent);

    // Academic structure
    const academicContent = extractSectionContent(allContent.complete, ['academic structure', 'faculties']);
    populateExpandableContent('academic-structure-content', academicContent);

    // Undergraduate studies
    const undergraduateContent = extractSectionContent(allContent.complete, ['undergraduate studies', 'full-time']);
    populateExpandableContent('undergraduate-content', undergraduateContent);

    // Postgraduate studies
    const postgraduateContent = extractSectionContent(allContent.complete, ['postgraduate studies', 'master']);
    populateExpandableContent('postgraduate-content', postgraduateContent);

    // General education
    const generalEducationContent = extractSectionContent(allContent.complete, ['general education']);
    populateExpandableContent('general-education-content', generalEducationContent);
}

function populateEstablishmentContent(sections) {
    // University officers
    const officersContent = extractSectionContent(allContent.establishment, ['university officers', 'officers']);
    populateExpandableContent('officers-content', officersContent);

    // Council
    const councilContent = extractSectionContent(allContent.establishment, ['council', 'the council']);
    populateExpandableContent('council-content', councilContent);

    // Senate
    const senateContent = extractSectionContent(allContent.establishment, ['senate', 'the senate']);
    populateExpandableContent('senate-content', senateContent);

    // Council committees
    const councilCommitteesContent = extractSectionContent(allContent.establishment, ['council committees']);
    populateExpandableContent('council-committees-content', councilCommitteesContent);

    // Senate committees
    const senateCommitteesContent = extractSectionContent(allContent.establishment, ['senate committees']);
    populateExpandableContent('senate-committees-content', senateCommitteesContent);

    // Honorary degrees
    const honoraryContent = extractSectionContent(allContent.establishment, ['honorary', 'graduates honoris causa']);
    populateExpandableContent('honorary-content', honoraryContent);
}

function populateFeesContent(sections) {
    // New Asia College
    const newAsiaContent = extractSectionContent(allContent.fees, ['new asia college']);
    populateExpandableContent('new-asia-content', newAsiaContent);

    // United College
    const unitedContent = extractSectionContent(allContent.fees, ['united college']);
    populateExpandableContent('united-college-content', unitedContent);

    // Shaw College
    const shawContent = extractSectionContent(allContent.fees, ['shaw college']);
    populateExpandableContent('shaw-college-content', shawContent);

    // Morningside College
    const morningsideContent = extractSectionContent(allContent.fees, ['morningside college']);
    populateExpandableContent('morningside-content', morningsideContent);

    // S.H. Ho College
    const shHoContent = extractSectionContent(allContent.fees, ['s.h. ho college', 'ho college']);
    populateExpandableContent('sh-ho-content', shHoContent);

    // Additional colleges
    const additionalContent = extractSectionContent(allContent.fees, ['chung chi', 'chu college', 'wu yee sun', 'lee woo sing']);
    populateExpandableContent('additional-colleges-content', additionalContent);
}

function populateAlmanacContent(sections) {
    // Academic calendar
    const calendarContent = extractSectionContent(allContent.almanac, ['calendar', 'academic calendar']);
    populateExpandableContent('calendar-content', calendarContent);

    // Important dates
    const datesContent = extractSectionContent(allContent.almanac, ['dates', 'schedule']);
    populateExpandableContent('important-dates-content', datesContent);

    // Semester schedule
    const semesterContent = extractSectionContent(allContent.almanac, ['semester', 'term']);
    populateExpandableContent('semester-schedule-content', semesterContent);
}

function extractSectionContent(fullText, keywords) {
    if (!fullText) return 'Content not available.';
    
    const lines = fullText.split('\n');
    let relevantLines = [];
    let capturing = false;
    let capturedLines = 0;

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Check if this line starts a relevant section
        if (keywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
            capturing = true;
            capturedLines = 0;
        }
        
        if (capturing) {
            relevantLines.push(line);
            capturedLines++;
            
            // Stop capturing after a reasonable amount of content or when hitting another major section
            if (capturedLines > 50 || (capturedLines > 10 && line.startsWith('# ') && !keywords.some(k => lowerLine.includes(k.toLowerCase())))) {
                break;
            }
        }
    }
    
    return relevantLines.length > 0 ? relevantLines.join('\n') : extractRandomContent(fullText);
}

function extractRandomContent(fullText) {
    // Extract a reasonable chunk of content as fallback
    const lines = fullText.split('\n').filter(line => line.trim());
    const start = Math.floor(Math.random() * Math.max(0, lines.length - 20));
    return lines.slice(start, start + 20).join('\n');
}

function populateExpandableContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const fullContentElement = element.querySelector('.content-full');
    if (fullContentElement) {
        // Convert markdown-like content to HTML
        const htmlContent = convertMarkdownToHTML(content);
        fullContentElement.innerHTML = htmlContent;
    }
}

function convertMarkdownToHTML(markdown) {
    if (!markdown) return 'Content not available.';
    
    let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^# (.*$)/gim, '<h2>$1</h2>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs and handle lists
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>(<li>.*?<\/li>)<\/p>/g, '<ul>$1</ul>');
    html = html.replace(/(<\/li>)<br>(<li>)/g, '$1$2');
    
    return html;
}

// Expandable content functionality
function initializeExpandableContent() {
    console.log('initializeExpandableContent function called'); // DEBUG: Function called
    
    const expandButtons = document.querySelectorAll('.expand-btn');
    console.log('Found expand buttons:', expandButtons.length); // DEBUG: Buttons found

    expandButtons.forEach(btn => {
        console.log('Attaching listener to button:', btn); // DEBUG: Attaching listener
        btn.addEventListener('click', function() {
            console.log('Expand button clicked. Target:', this.getAttribute('data-target')); // DEBUG
            const targetId = this.getAttribute('data-target');
            const expandableContent = document.getElementById(targetId);

            if (!expandableContent) {
                console.error('Expandable content container not found for ID:', targetId); // DEBUG
                return;
            }

            const fullContent = expandableContent.querySelector('.content-full');
            const cardElement = expandableContent.closest('.content-card');
            const cardTitle = cardElement ? cardElement.querySelector('h3') : null;

            if (!fullContent) {
                console.error('.content-full not found in target:', targetId); // DEBUG
                return;
            }

            // Open content in modal
            openContentModal(fullContent.innerHTML, cardTitle ? cardTitle.textContent : 'Content');
        });
    });
}

// Modal functionality
function openContentModal(content, title) {
    const modal = document.getElementById('contentModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) {
        console.error('Modal elements not found');
        return;
    }
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('active');
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus on modal for accessibility
    modal.focus();
}

function closeContentModal() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Initialize modal event listeners
function initializeModal() {
    const modalClose = document.getElementById('modalClose');
    const modal = document.getElementById('contentModal');
    
    // Close button click
    if (modalClose) {
        modalClose.addEventListener('click', closeContentModal);
    }
    
    // Click outside modal to close
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeContentModal();
            }
        });
    }
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeContentModal();
        }
    });
}

// Populate static content from content-data.js
function populateStaticContent() {
    // Check if contentData is available
    if (typeof contentData !== 'undefined') {
        Object.keys(contentData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                const contentFull = element.querySelector('.content-full');
                if (contentFull && contentData[key]) {
                    contentFull.innerHTML = contentData[key].content;
                }
            }
        });
    }
    
    // Check if calendarData is available
    if (typeof calendarData !== 'undefined') {
        Object.keys(calendarData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                const contentFull = element.querySelector('.content-full');
                if (contentFull && calendarData[key]) {
                    contentFull.innerHTML = calendarData[key].content;
                }
            }
        });
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Real-time search with debouncing
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }
}

function buildSearchIndex() {
    searchIndex = [];
    
    // Index all content
    Object.keys(allContent).forEach(contentType => {
        const content = allContent[contentType];
        const sections = parseMarkdownSections(content);
        
        Object.keys(sections).forEach(sectionName => {
            searchIndex.push({
                type: contentType,
                section: sectionName,
                content: sections[sectionName],
                title: formatSectionTitle(sectionName)
            });
        });
    });
}

function formatSectionTitle(sectionName) {
    return sectionName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const query = searchInput?.value.trim().toLowerCase();
    
    if (!query || query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }
    
    const results = searchContent(query);
    displaySearchResults(results, query);
}

function searchContent(query) {
    const results = [];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    searchIndex.forEach(item => {
        const contentLower = item.content.toLowerCase();
        const titleLower = item.title.toLowerCase();
        
        let score = 0;
        let matchedText = '';
        
        // Check title match
        if (titleLower.includes(query)) {
            score += 10;
        }
        
        // Check content match
        queryWords.forEach(word => {
            if (contentLower.includes(word)) {
                score += 1;
                
                // Extract context around the match
                const index = contentLower.indexOf(word);
                const start = Math.max(0, index - 50);
                const end = Math.min(item.content.length, index + word.length + 50);
                const context = item.content.slice(start, end);
                if (matchedText.length < 200) {
                    matchedText += context + '... ';
                }
            }
        });
        
        if (score > 0) {
            results.push({
                ...item,
                score,
                matchedText: matchedText || item.content.slice(0, 150) + '...'
            });
        }
    });
    
    return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No results found for "' + escapeHtml(query) + '"</p>';
        return;
    }
    
    const resultsHtml = results.map(result => {
        const highlightedText = highlightSearchTerms(result.matchedText, query);
        const sectionLink = getSectionLink(result.type);
        
        return `
            <div class="search-result-item">
                <h4>${escapeHtml(result.title)}</h4>
                <p>${highlightedText}</p>
                <div class="search-result-section">Found in: ${formatSectionTitle(result.type)} ${sectionLink ? `- <a href="${sectionLink}">View Section</a>` : ''}</div>
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = resultsHtml;
}

function highlightSearchTerms(text, query) {
    const words = query.toLowerCase().split(/\s+/);
    let highlightedText = escapeHtml(text);
    
    words.forEach(word => {
        const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
    });
    
    return highlightedText;
}

function getSectionLink(contentType) {
    const sectionMap = {
        'complete': '#general-info',
        'establishment': '#establishment',
        'fees': '#fees',
        'almanac': '#almanac'
    };
    return sectionMap[contentType] || '';
}

// Scroll animations
function initializeScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.content-card').forEach(card => {
        observer.observe(card);
    });
}

// Fallback content if markdown files can't be loaded
function loadFallbackContent() {
    const fallbackContent = {
        'origin-content': `
            <h4>University Origin</h4>
            <p>The Chinese University of Hong Kong has its origins in three post-secondary colleges:</p>
            <ul>
                <li><strong>New Asia College</strong> (founded 1949)</li>
                <li><strong>Chung Chi College</strong> (founded 1951)</li>
                <li><strong>The United College of Hong Kong</strong> (founded 1956)</li>
            </ul>
            <p>These colleges drew a sizeable proportion of their teachers and students from mainland China in their early days. On October 17, 1963, the University was formally inaugurated.</p>
        `,
        'academic-structure-content': `
            <h4>Academic Structure</h4>
            <p>CUHK is a comprehensive research university with:</p>
            <ul>
                <li><strong>8 Faculties:</strong> Arts, Business Administration, Education, Engineering, Law, Medicine, Science, and Social Science</li>
                <li><strong>60 departments/schools</strong> offering 85 major programmes and 76 minor programmes</li>
                <li><strong>149 master's programmes</strong></li>
                <li><strong>26 doctoral programmes</strong></li>
                <li><strong>44 MPhil-PhD programmes</strong></li>
            </ul>
        `,
        'new-asia-content': `
            <h4>New Asia College</h4>
            <p>Founded in 1949 by Mr. Ch'ien Mu and a group of scholars from mainland China. The college aims to promote traditional Chinese culture with the complement of Western academics.</p>
            <p><strong>Key Features:</strong></p>
            <ul>
                <li>Around 3,500 students</li>
                <li>'Guaranteed One-year Residence Scheme'</li>
                <li>Exchange programmes with Yale University and Peking University</li>
                <li>'Ch'ien Mu Lecture in History and Culture'</li>
            </ul>
        `
    };

    Object.keys(fallbackContent).forEach(elementId => {
        populateExpandableContent(elementId, fallbackContent[elementId]);
    });
}

// Additional enhancements for better user experience

// Smooth scroll enhancement
function smoothScrollTo(element, duration = 800) {
    const targetPosition = element.offsetTop - document.querySelector('.header').offsetHeight - 20;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Loading animation
function showLoadingState() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    }
}

// Enhanced search with loading state
function performSearchWithLoading() {
    showLoadingState();
    setTimeout(performSearch, 100); // Small delay to show loading state
}

// Back to top button
function addBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #7B4397 0%, #9966CC 100%);
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(123, 67, 151, 0.3);
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Show/hide based on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Enhanced mobile menu
function enhanceMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = mobileNav.style.display === 'block';
            mobileNav.style.display = isOpen ? 'none' : 'block';
            mobileMenuToggle.innerHTML = isOpen ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
            
            // Add animation class
            if (!isOpen) {
                mobileNav.classList.add('slide-down');
            }
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.style.display = 'none';
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileNav.style.display = 'none';
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// Keyboard navigation support
function addKeyboardSupport() {
    document.addEventListener('keydown', (e) => {
        // ESC key closes mobile menu
        if (e.key === 'Escape') {
            const mobileNav = document.querySelector('.mobile-nav');
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            if (mobileNav && mobileNav.style.display === 'block') {
                mobileNav.style.display = 'none';
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
        
        // Enter key on expand buttons
        if (e.key === 'Enter' && e.target.classList.contains('expand-btn')) {
            e.target.click();
        }
    });
}

// Add loading states
function addLoadingStates() {
    const expandBtns = document.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                this.style.opacity = '1';
                this.style.pointerEvents = 'auto';
            }, 300);
        });
    });
}

// Add some CSS for the new features
const additionalCSS = `
.loading-spinner {
    text-align: center;
    padding: 2rem;
    color: #64748b;
    font-size: 1.1rem;
}

.loading-spinner i {
    margin-right: 0.5rem;
    color: #7B4397;
}

.slide-down {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        transform: translateY(-10px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.back-to-top:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(123, 67, 151, 0.4);
}

.expand-btn:focus {
    outline: 2px solid #FFD700;
    outline-offset: 2px;
}

.nav-link:focus, .mobile-nav-link:focus {
    outline: 2px solid #FFD700;
    outline-offset: 2px;
}

.scroll-indicator {
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(135deg, #7B4397 0%, #9966CC 100%);
    z-index: 999;
    transition: width 0.1s ease;
}

.hero-content {
    transition: all 1s ease-out;
}

.content-card {
    transition: all 0.6s ease-out, transform 0.3s ease;
}

.search-result-item {
    animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.loading-spinner {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}

#searchInput {
    transition: all 0.3s ease;
}

#searchInput:focus {
    box-shadow: 0 0 0 3px rgba(123, 67, 151, 0.2);
    border-color: #7B4397;
}

.expand-btn {
    position: relative;
    overflow: hidden;
}

.expand-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 215, 0, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
}

.expand-btn:active::after {
    width: 200px;
    height: 200px;
}
`;

// Add the CSS to the document
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Add scroll progress indicator
function addScrollIndicator() {
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    document.body.appendChild(scrollIndicator);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollIndicator.style.width = scrollPercent + '%';
    });
}

// Enhanced page load animations
function addPageLoadAnimations() {
    // Animate hero content on load
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroContent.style.transition = 'all 1s ease-out';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Stagger animation for content cards
    const contentCards = document.querySelectorAll('.content-card');
    contentCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
}

// Enhanced search with better UX
function enhanceSearchExperience() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput) {
        // Add search suggestions/placeholder rotation
        const suggestions = [
            'Search for academic calendar...',
            'Find college information...',
            'Look up important dates...',
            'Search university policies...',
            'Find graduation requirements...'
        ];
        
        let currentSuggestion = 0;
        
        function rotatePlaceholder() {
            searchInput.placeholder = suggestions[currentSuggestion];
            currentSuggestion = (currentSuggestion + 1) % suggestions.length;
        }
        
        // Rotate placeholder every 3 seconds when not focused
        const placeholderInterval = setInterval(rotatePlaceholder, 3000);
        
        searchInput.addEventListener('focus', () => {
            clearInterval(placeholderInterval);
            searchInput.placeholder = 'Type to search...';
        });
        
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value) {
                setTimeout(rotatePlaceholder, 1000);
            }
        });
        
        // Add typing indicator
        let typingTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            
            if (searchInput.value.length > 0) {
                searchResults.innerHTML = '<div class="loading-spinner">Searching...</div>';
                
                typingTimer = setTimeout(() => {
                    performSearch();
                }, 300);
            } else {
                searchResults.innerHTML = '';
            }
        });
    }
}

// Enhanced initialization with new features
// (This section is already handled by the main DOMContentLoaded listener above)

// Enhanced CSS for animations
const enhancedCSS = `
.hero-content {
    transition: all 1s ease-out;
}

.content-card {
    transition: all 0.6s ease-out, transform 0.3s ease;
}

.search-result-item {
    animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.loading-spinner {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}

#searchInput {
    transition: all 0.3s ease;
}

#searchInput:focus {
    box-shadow: 0 0 0 3px rgba(123, 67, 151, 0.2);
    border-color: #7B4397;
}

.expand-btn {
    position: relative;
    overflow: hidden;
}

.expand-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 215, 0, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
}

.expand-btn:active::after {
    width: 200px;
    height: 200px;
}
`;

// Add the enhanced CSS
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = enhancedCSS;
document.head.appendChild(enhancedStyle);
