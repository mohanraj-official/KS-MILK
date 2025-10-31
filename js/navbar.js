// js/navbar.js

/**
 * Toggles the 'active' class on the navigation links to show/hide the mobile menu.
 */
function toggleMenu() {
    const nav = document.querySelector(".nav-links");
    if (nav) {
        nav.classList.toggle("active");
        
        // Optional UX: Toggle an accessibility attribute for screen readers
        const hamburger = document.querySelector(".hamburger");
        if (hamburger) {
            const isExpanded = nav.classList.contains("active");
            hamburger.setAttribute("aria-expanded", isExpanded);
        }
    }
}

/**
 * Logic to close the menu when the user clicks anywhere outside the navigation bar,
 * which is standard mobile UX behavior.
 */
document.addEventListener('click', function(event) {
    const nav = document.querySelector(".nav-links");
    const hamburger = document.querySelector(".hamburger");

    // 1. Check if the menu is currently open
    const isMenuOpen = nav && nav.classList.contains("active");

    // 2. Check if the click occurred outside the menu and outside the hamburger icon
    //    We use .closest() to see if the clicked target or any of its parents is the nav or hamburger.
    const isClickInsideNav = nav && nav.contains(event.target);
    const isClickOnHamburger = hamburger && hamburger.contains(event.target);

    // If the menu is open AND the click was NOT on the menu and NOT on the hamburger, close it.
    if (isMenuOpen && !isClickInsideNav && !isClickOnHamburger) {
        nav.classList.remove("active");
        
        // Update accessibility state when closing programmatically
        if (hamburger) {
            hamburger.setAttribute("aria-expanded", false);
        }
    }
});

// CRITICAL: Expose the toggleMenu function globally so the HTML onclick="toggleMenu()" works.
window.toggleMenu = toggleMenu;

// Optional: Automatically close the menu after a link is clicked (improves mobile flow)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const nav = document.querySelector(".nav-links");
        if (nav && nav.classList.contains("active")) {
            nav.classList.remove("active");
            
            const hamburger = document.querySelector(".hamburger");
            if (hamburger) {
                hamburger.setAttribute("aria-expanded", false);
            }
        }
    });
});