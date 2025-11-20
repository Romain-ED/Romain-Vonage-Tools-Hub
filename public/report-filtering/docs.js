// Standalone dark mode function for docs page
function toggleDarkModeStandalone() {
    try {
        const currentDarkMode = document.body.classList.contains('dark-mode');
        const newDarkMode = !currentDarkMode;
        
        document.body.classList.toggle('dark-mode', newDarkMode);
        localStorage.setItem('csvTool_darkMode', newDarkMode.toString());
        
        // Update button text
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.innerHTML = newDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
        
        console.log(`Dark mode ${newDarkMode ? 'enabled' : 'disabled'} (docs standalone)`);
    } catch (e) {
        console.error('Error toggling dark mode on docs page:', e);
    }
}

// Initialize dark mode immediately
try {
    const darkMode = localStorage.getItem('csvTool_darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Update button text when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const darkModeBtn = document.getElementById('darkModeBtn');
            if (darkModeBtn) {
                darkModeBtn.innerHTML = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
            }
        });
    } else {
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.innerHTML = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }
} catch (e) {
    console.warn('Failed to initialize dark mode on docs page:', e);
}

// Documentation page navigation
document.addEventListener('DOMContentLoaded', function() {
    const backToToolBtn = document.getElementById('backToToolBtn');
    
    if (backToToolBtn) {
        backToToolBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.docs-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Update active navigation link on scroll
    const sections = document.querySelectorAll('.docs-section');
    const navItems = document.querySelectorAll('.docs-nav a');

    function updateActiveNav() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                navItems.forEach(item => item.classList.remove('active'));
                if (navItems[index]) {
                    navItems[index].classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav(); // Initial call
});