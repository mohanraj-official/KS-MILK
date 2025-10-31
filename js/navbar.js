// js/navbar.js

function toggleMenu() {
    const nav = document.querySelector(".nav-links");
    // CRITICAL: Now toggles the 'active' class
    if (nav) nav.classList.toggle("active"); 
}

// Attach the function to the window object so the HTML can find it
window.toggleMenu = toggleMenu;