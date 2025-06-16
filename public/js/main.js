// Global variable to store Admin Discord ID (fetched once)
let ADMIN_DISCORD_ID_CACHE = null;

async function fetchAdminDiscordId() {
    if (ADMIN_DISCORD_ID_CACHE === null) {
        try {
            // Attempt to fetch from a .env file at the root (won't work directly in client-side JS for security)
            // This is a placeholder. In a real app, this should be exposed securely via an API endpoint if needed,
            // or preferably, admin checks should be backend-driven.
            // For this exercise, we'll assume it might be available or fallback.
            const response = await fetch('/.env'); // This will likely fail or not return what's expected
            if (response.ok) {
                const text = await response.text();
                const match = text.match(/ADMIN_DISCORD_ID=(\w+)/);
                if (match && match[1]) {
                    ADMIN_DISCORD_ID_CACHE = match[1];
                } else {
                    console.warn("ADMIN_DISCORD_ID not found in fetched .env text. Using fallback.");
                    ADMIN_DISCORD_ID_CACHE = "ID_NIEUSTAWIONE_DOMYSLNIE"; // Fallback
                }
            } else {
                 console.warn("Failed to fetch .env file for ADMIN_DISCORD_ID. Using fallback.");
                ADMIN_DISCORD_ID_CACHE = "ID_NIEUSTAWIONE_DOMYSLNIE"; // Fallback
            }
        } catch (error) {
            console.warn("Error fetching .env for ADMIN_DISCORD_ID. Using fallback.", error);
            ADMIN_DISCORD_ID_CACHE = "ID_NIEUSTAWIONE_DOMYSLNIE"; // Fallback in case of network error
        }
    }
    return ADMIN_DISCORD_ID_CACHE;
}


// Funkcja do obsługi aktywnego linku w nawigacji
function setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll('header nav > a.nav-link, #mobileMenu > div > a.nav-link');
    const wikipediaSubPages = ["lore-postaci.html", "systemy-botow.html", "rangi-i-role.html", "lore-aethelgard.html", "komendy.html"];

    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('href').split("/").pop() || "index.html";

        if (linkPage === currentPage) {
            link.classList.add('active');
        } else if (linkPage === 'wikipedia.html' && (wikipediaSubPages.includes(currentPage) || currentPage === 'wiki-page-view.html')) {
            link.classList.add('active');
        } else if (linkPage === 'blog.html' && (currentPage === 'blog.html' || currentPage === 'article-view.html')) {
            link.classList.add('active');
        } else if (linkPage === 'gallery.html' && currentPage === 'gallery.html') { // Added for Gallery
            link.classList.add('active');
        }
    });
}

async function updateAuthDisplay() {
    const authSectionNav = document.getElementById('auth-section-nav');
    const authSectionMobileNav = document.getElementById('auth-section-mobile-nav');
    const mobileMenuLinksContainer = document.querySelector('#mobileMenu > div');

    const ADMIN_DISCORD_ID = await fetchAdminDiscordId();

    function createLoginButton(isMobile = false) {
        const loginButton = document.createElement('a');
        // Redirect back to the current page after login
        const redirectUrl = window.location.pathname + window.location.search;
        loginButton.href = `/auth/discord/login?redirect=${encodeURIComponent(redirectUrl)}`;
        loginButton.id = isMobile ? 'discordLoginButtonMobileNav' : 'discordLoginButtonNav';
        loginButton.className = 'btn-discord !text-white px-4 py-2.5 rounded-md text-sm flex items-center' + (isMobile ? ' w-full justify-center mt-2' : '');
        loginButton.innerHTML = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20.297 0H3.703C1.658 0 0 1.658 0 3.703V20.297C0 22.342 1.658 24 3.703 24H20.297C22.342 24 24 22.342 24 20.297V3.703C24 1.658 22.342 0 20.297 0ZM8.107 15.232C7.089 15.232 6.241 14.384 6.241 13.366C6.241 12.348 7.089 11.5 8.107 11.5C9.125 11.5 9.973 12.348 9.973 13.366C9.973 14.384 9.125 15.232 8.107 15.232ZM12.000 11.071C10.982 11.071 10.134 10.223 10.134 9.205C10.134 8.188 10.982 7.339 12.000 7.339C13.018 7.339 13.866 8.188 13.866 9.205C13.866 10.223 13.018 11.071 12.000 11.071ZM15.893 15.232C14.875 15.232 14.027 14.384 14.027 13.366C14.027 12.348 14.875 11.5 15.893 11.5C16.911 11.5 17.759 12.348 17.759 13.366C17.759 14.384 16.911 15.232 15.893 15.232Z"/></svg> Zaloguj przez Discord`;
        return loginButton;
    }

    function createAvatarDropdown(user, isMobile = false) {
        const containerId = isMobile ? 'userDropdownContainerMobile' : 'userDropdownContainerNav';
        const dropdownId = isMobile ? 'userDropdownMobile' : 'userDropdownNav';

        const container = document.createElement('div');
        container.id = containerId;
        container.className = 'relative';

        const avatarImg = document.createElement('img');
        avatarImg.src = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32` : 'https://placehold.co/32x32/A78BFA/FFFFFF?text=U';
        avatarImg.alt = 'Awatar użytkownika';
        avatarImg.className = 'user-avatar';
        avatarImg.onerror = () => { avatarImg.src = 'https://placehold.co/32x32/A78BFA/FFFFFF?text=U'; };
        avatarImg.onclick = (event) => {
            event.stopPropagation();
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) dropdown.classList.toggle('open');
        };
        container.appendChild(avatarImg);

        const dropdownMenu = document.createElement('div');
        dropdownMenu.id = dropdownId;
        dropdownMenu.className = 'dropdown-menu';

        const profileLink = document.createElement('a');
        profileLink.href = 'profil.html';
        profileLink.textContent = 'Mój Profil';
        dropdownMenu.appendChild(profileLink);

        const auctionHouseLink = document.createElement('a');
        auctionHouseLink.href = 'dom-aukcyjny.html';
        auctionHouseLink.textContent = 'Dom Aukcyjny';
        dropdownMenu.appendChild(auctionHouseLink);

        const botShopLink = document.createElement('a');
        botShopLink.href = 'sklep-bota.html'; // Corrected from /sklep-bota to ensure it's relative
        botShopLink.textContent = 'Sklep Bota (Dukaty)';
        dropdownMenu.appendChild(botShopLink);

        const premiumShopLink = document.createElement('a');
        premiumShopLink.href = 'sklep-premium.html';
        premiumShopLink.textContent = 'Sklep Premium (Kryształy)';
        dropdownMenu.appendChild(premiumShopLink);

        const supportTicketsLink = document.createElement('a');
        supportTicketsLink.href = 'support.html';
        supportTicketsLink.textContent = 'Centrum Wsparcia';
        dropdownMenu.appendChild(supportTicketsLink);

        if (user.id === ADMIN_DISCORD_ID) {
            const adminLinkElement = document.createElement('a');
            adminLinkElement.href = 'admin.html';
            adminLinkElement.textContent = 'Panel Admina';
            dropdownMenu.appendChild(adminLinkElement);
        }

        const logoutForm = document.createElement('form');
        logoutForm.action = '/auth/logout';
        logoutForm.method = 'POST';
        const logoutButton = document.createElement('button');
        logoutButton.type = 'submit';
        logoutButton.textContent = 'Wyloguj';
        logoutForm.appendChild(logoutButton);
        dropdownMenu.appendChild(logoutForm);

        container.appendChild(dropdownMenu);
        return container;
    }

    // Clear existing auth elements in mobile menu before adding new ones
    if (mobileMenuLinksContainer) {
        const existingMobileAuthElements = mobileMenuLinksContainer.querySelectorAll('#discordLoginButtonMobileNav, #userDropdownContainerMobileMenu, .mobile-auth-item');
        existingMobileAuthElements.forEach(el => el.remove());
    }


    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            if (authSectionNav) {
                authSectionNav.innerHTML = '';
                authSectionNav.appendChild(createAvatarDropdown(user, false));
            }
            if (authSectionMobileNav) {
                authSectionMobileNav.innerHTML = '';
                authSectionMobileNav.appendChild(createAvatarDropdown(user, true));
            }
             // Add dropdown items directly to mobile menu for better UX
             if (mobileMenuLinksContainer) {
                const mobileDropdownContainer = createAvatarDropdown(user, true); // Create it as if it were a dropdown
                mobileDropdownContainer.id = 'userDropdownContainerMobileMenu'; // Unique ID for the container if needed
                mobileDropdownContainer.classList.add('mt-2', 'border-t', 'border-[var(--border-card)]', 'pt-2', 'mobile-auth-item');

                const mobileAvatar = mobileDropdownContainer.querySelector('.user-avatar');
                const mobileDropdown = mobileDropdownContainer.querySelector('.dropdown-menu');

                if (mobileAvatar) mobileAvatar.classList.add('hidden'); // Hide the avatar img itself in mobile menu
                if (mobileDropdown) {
                    mobileDropdown.classList.remove('absolute', 'top-full', 'right-0', 'dropdown-menu', 'bg-bg-card', 'border', 'border-card', 'rounded-md', 'shadow-lg'); // Remove dropdown-specific styling
                    mobileDropdown.classList.add('space-y-1'); // Add styling for list of links
                    // Append each child of the dropdown (links, forms) directly to the mobile menu
                    Array.from(mobileDropdown.children).forEach(child => {
                        // Ensure consistent styling for mobile menu items
                        child.classList.add('block', 'py-2', 'px-3', 'text-base', 'font-medium', 'rounded-md', 'hover:bg-[rgba(var(--rgb-accent),0.1)]', 'hover:text-[var(--text-accent)]');
                         if (child.tagName === 'FORM') { // Special handling for form to make button look like a link
                            const button = child.querySelector('button');
                            if (button) {
                                button.classList.add('block', 'w-full', 'text-left', 'py-2', 'px-3', 'text-base', 'font-medium', 'rounded-md', 'hover:bg-[rgba(var(--rgb-accent),0.1)]', 'hover:text-[var(--text-accent)]');
                                button.classList.remove('w-full', 'text-align-left'); // remove conflicting styles if any
                            }
                        }
                        mobileMenuLinksContainer.appendChild(child);
                    });
                }
            }

        } else { // Not logged in
             if (authSectionNav) {
                authSectionNav.innerHTML = '';
                authSectionNav.appendChild(createLoginButton(false));
            }
            if (authSectionMobileNav) {
                authSectionMobileNav.innerHTML = '';
                // For mobile, we will add the login button directly to the main mobile menu list below
                // authSectionMobileNav.appendChild(createLoginButton(true));
            }
            if (mobileMenuLinksContainer) {
                const mobileLoginButton = createLoginButton(true);
                mobileLoginButton.classList.add('mt-2', 'border-t', 'border-[var(--border-card)]', 'pt-2', 'mobile-auth-item'); // Add some spacing
                mobileMenuLinksContainer.appendChild(mobileLoginButton);
            }
        }
    } catch (error) {
        console.error('Błąd aktualizacji UI logowania:', error);
        // Fallback to login button if error
         if (authSectionNav) {
            authSectionNav.innerHTML = '';
            authSectionNav.appendChild(createLoginButton(false));
        }
        if (authSectionMobileNav) {
            authSectionMobileNav.innerHTML = '';
            // authSectionMobileNav.appendChild(createLoginButton(true));
        }
        if (mobileMenuLinksContainer) {
            const mobileLoginButton = createLoginButton(true);
            mobileLoginButton.classList.add('mt-2', 'border-t', 'border-[var(--border-card)]', 'pt-2', 'mobile-auth-item');
            mobileMenuLinksContainer.appendChild(mobileLoginButton);
        }
    }
}

function setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuLinksContainer = document.querySelector('#mobileMenu > div'); // Target the div inside mobileMenu

    if (mobileMenuButton && mobileMenu && mobileMenuLinksContainer) {
        // Clear any existing static links in the JS-controlled div to avoid duplication if this runs multiple times
        // This is a basic clear; more robust would be to mark JS-added links.
        // For now, we assume the HTML is clean of these before JS runs, or that updateAuthDisplay handles its part.

        // Dynamically add base navigation links to mobile menu
        // This ensures mobile menu is primarily JS-driven for links if needed
        // However, the current HTML structure has them static. We'll add the "Blog" link here.
        const navItems = [
            { href: "index.html", text: "Strona Główna" },
            { href: "prezentacja.html", text: "Prezentacja Serwera" },
            { href: "wikipedia.html", text: "Wikipedia Kronik" },
            { href: "blog.html", text: "Blog" }, // Added Blog link
            { href: "ranking-stats.html", text: "Rankingi" },
            { href: "dom-aukcyjny.html", text: "Dom Aukcyjny" }
        ];

        // Clear only JS-added nav items if we mark them, or clear all and re-add
        // For simplicity, if there are static links in HTML, this might duplicate.
        // Best practice would be to have mobileMenu > div empty in HTML and fully populated by JS.
        // Let's assume the provided HTML for #mobileMenu > div is the source of truth for base links,
        // and we only programmatically add auth elements to it via updateAuthDisplay.
        // The Blog link needs to be added to the static HTML part of mobileMenu for non-JS scenarios or if this function is simplified.
        // For this task, I will ensure the blog link exists in the static HTML part of the mobile menu later.
        // This function will primarily handle the open/close and link click behaviors.

        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true' || false;
            mobileMenuButton.setAttribute('aria-expanded', String(!isExpanded));
            mobileMenu.classList.toggle('open');
        });

        // Close menu when a link inside it is clicked
        mobileMenu.querySelectorAll('a, button').forEach(item => {
            item.addEventListener('click', () => {
                // Only close if it's a navigation action, not a dropdown toggle within the menu
                if (item.closest('.dropdown-menu') && !item.closest('#userDropdownContainerMobileMenu')) {
                    // If item is inside a dropdown that is part of the mobile menu, don't close main menu
                    // This logic might need refinement based on exact structure of dropdowns in mobile menu
                    return;
                }
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('open');
            });
        });
    }
}


function setupRevealAnimations() {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
}

function setupDropdownDismiss() {
    window.addEventListener('click', function(e) {
        const desktopDropdownContainer = document.getElementById('userDropdownContainerNav');
        const mobileDropdownContainer = document.getElementById('userDropdownContainerMobile');
        const desktopDropdown = document.getElementById('userDropdownNav');
        const mobileDropdown = document.getElementById('userDropdownMobile');

        if (desktopDropdownContainer && !desktopDropdownContainer.contains(e.target) && desktopDropdown && desktopDropdown.classList.contains('open')) {
            desktopDropdown.classList.remove('open');
        }
        // For the general mobile avatar dropdown (if it exists separately and behaves like a typical dropdown)
        if (mobileDropdownContainer && !mobileDropdownContainer.contains(e.target) && mobileDropdown && mobileDropdown.classList.contains('open')) {
             mobileDropdown.classList.remove('open');
        }
    });
}

async function loadServerStats() {
    const statsContainer = document.getElementById('statsContainer');
    const statsErrorContainer = document.getElementById('statsLoadingError');

    if (!statsContainer || !statsErrorContainer) return; // Only run if elements exist

    statsContainer.innerHTML = `
        <div class="text-center py-6 col-span-full">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 loading-spinner mx-auto mb-2" style="border-color: var(--text-accent) transparent var(--text-accent) transparent;"></div>
            <p class="text-secondary">Ładowanie statystyk...</p>
        </div>`;
    statsErrorContainer.classList.add('hidden');

    try {
        const response = await fetch('/api/web/server-stats');
        if (!response.ok) {
            throw new Error(`Błąd serwera: ${response.status}`);
        }
        const stats = await response.json();

        if (stats && !stats.error) {
            statsContainer.innerHTML = `
                <div class="stat-item reveal">
                    <div class="stat-number">${stats.total_members || 0}</div>
                    <div class="stat-label">Członków Społeczności</div>
                </div>
                <div class="stat-item reveal" style="transition-delay: 0.1s;">
                    <div class="stat-number">${stats.online_members || 0}</div>
                    <div class="stat-label">Aktywnych Online</div>
                </div>
                <div class="stat-item reveal" style="transition-delay: 0.2s;">
                    <div class="stat-number">${stats.total_messages || 0}</div>
                    <div class="stat-label">Wysłanych Wiadomości</div>
                </div>
                <div class="stat-item reveal" style="transition-delay: 0.3s;">
                    <div class="stat-number">${stats.active_giveaways || 0}</div>
                    <div class="stat-label">Aktywnych Konkursów</div>
                </div>
            `;
            // Re-run reveal animations for newly added stat items
            document.querySelectorAll('#statsContainer .reveal').forEach(el => {
                // Ensure visibility is reset if this function can be called multiple times
                el.classList.remove('visible');
                // Small delay to ensure transition happens after elements are in DOM
                setTimeout(() => el.classList.add('visible'), 10);
            });
        } else {
            statsContainer.innerHTML = `<p class="text-center text-secondary col-span-full py-6">${stats.error || 'Nie udało się załadować statystyk.'}</p>`;
        }
    } catch (error) {
        console.error('Błąd ładowania statystyk serwera:', error);
        statsErrorContainer.textContent = 'Nie udało się załadować statystyk serwera. Spróbuj odświeżyć stronę.';
        statsErrorContainer.classList.remove('hidden');
        statsContainer.innerHTML = `<p class="text-center text-red-400 col-span-full py-6">Błąd ładowania statystyk.</p>`;
    }
}

// Theme toggle logic (if it was in index.html, move it here too)
function setupThemeToggle() {
    // This function would contain the logic for a theme toggle button if one exists.
    // For now, it's a placeholder. If your index.html had specific theme toggle JS, add it here.
    // Example:
    // const themeToggleButton = document.getElementById('themeToggle');
    // if (themeToggleButton) {
    //     themeToggleButton.addEventListener('click', () => {
    //         document.documentElement.classList.toggle('dark');
    //         localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    //     });
    // }
    // // Check local storage for theme preference
    // if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    //     document.documentElement.classList.add('dark');
    // } else {
    //     document.documentElement.classList.remove('dark');
    // }
}


// Main initialization function to be called on DOMContentLoaded
async function initializeCommonScripts() {
    // Set current year in footer
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // Default theme if not set (assuming dark is default)
    if (!document.documentElement.classList.contains('light') && !document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
    }

    await fetchAdminDiscordId(); // Fetch and cache admin ID early
    setActiveNavLink();
    await updateAuthDisplay(); // updateAuthDisplay now uses the cached or fetched ID
    setupMobileMenu();
    setupRevealAnimations(); // If this is used on multiple pages
    setupDropdownDismiss();
    setupThemeToggle(); // If you have theme toggle logic

    // Conditionally load stats if the container exists on the current page
    if (document.getElementById('statsContainer')) {
        loadServerStats();
    }
    if (document.getElementById('featured-articles-container')) {
        loadFeaturedArticlesHomepage();
    }
    if (document.getElementById('fanart-gallery-grid')) { // Check for fan art gallery grid
        loadPublicFanArtGallery();
    }
}

async function loadFeaturedArticlesHomepage() {
    const container = document.getElementById('featured-articles-container');
    const loading = document.getElementById('featured-articles-loading');
    const errorMsg = document.getElementById('featured-articles-error');
    const emptyMsg = document.getElementById('featured-articles-empty');

    if (!container || !loading || !errorMsg || !emptyMsg) return;

    loading.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    emptyMsg.classList.add('hidden');
    container.innerHTML = '';

    try {
        const response = await fetch('/api/articles?featured=true&limit=3&page=1');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                let categoriesHTML = '';
                if (article.Categories && article.Categories.length > 0) {
                    categoriesHTML = `<div class="mt-2 mb-1 text-xs">Kategorie: ${article.Categories.map(cat => `<a href="blog.html?category=${cat.slug}" class="text-accent hover:underline mr-1.5">${cat.name}</a>`).join(', ')}</div>`;
                }
                 const articleCard = `
                    <div class="card-bg p-6 rounded-xl flex flex-col relative">
                        ${article.isFeatured ? '<span class="absolute top-3 right-3 bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md z-10">Polecany ★</span>' : ''}
                        <img src="https://placehold.co/600x350/101A2B/A78BFA?text=${encodeURIComponent(article.title.substring(0,20))}" alt="Miniatura artykułu: ${article.title}" class="rounded-lg mb-4 w-full h-48 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x350/0F172A/94A3B8?text=Brak+obrazka';">
                        <h3 class="text-xl font-semibold text-primary mb-1">
                            <a href="article-view.html?slug=${article.slug}" class="hover:text-accent transition-colors">${article.title}</a>
                        </h3>
                        <p class="text-xs text-secondary mb-1">Autor: ${article.authorName}</p>
                        <p class="text-xs text-secondary">Opublikowano: ${new Date(article.publishedAt).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        ${categoriesHTML}
                        <div class="text-sm text-secondary mt-2 mb-4 flex-grow article-card-content overflow-hidden" style="max-height: 80px;">
                            ${article.snippet}
                        </div>
                        <a href="article-view.html?slug=${article.slug}" class="text-accent hover:text-accent-hover font-semibold text-sm self-start mt-auto pt-2">Czytaj więcej &rarr;</a>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', articleCard);
            });
        } else {
            emptyMsg.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Błąd ładowania polecanych artykułów:', error);
        errorMsg.textContent = 'Nie udało się załadować polecanych artykułów.';
        errorMsg.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}


// Run initializations after DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeCommonScripts);

async function loadPublicFanArtGallery() {
    const grid = document.getElementById('fanart-gallery-grid');
    const loadingDiv = document.getElementById('fanart-gallery-loading');
    const errorDiv = document.getElementById('fanart-gallery-error');
    const emptyDiv = document.getElementById('fanart-gallery-empty');

    if (!grid || !loadingDiv || !errorDiv || !emptyDiv) {
        // console.warn("Fan art gallery elements not found on this page.");
        return;
    }

    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    emptyDiv.classList.add('hidden');
    grid.innerHTML = ''; // Clear previous items

    try {
        const response = await fetch('/api/gallery/images?limit=8&page=1'); // Fetch up to 8 for homepage
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Assuming API returns { images: [], ... } or just []

        // Adjust based on actual API response structure. Assuming data is an array of fanart items.
        // If API returns object like { images: [] }, then use data.images
        const fanArts = Array.isArray(data) ? data : (data.images || []);


        if (fanArts.length > 0) {
            fanArts.forEach(item => {
                const galleryItemHTML = `
                    <div class="gallery-item card-bg rounded-lg overflow-hidden aspect-square reveal">
                        <a href="${item.imageUrl}" target="_blank" title="Zobacz w pełnym rozmiarze: ${item.title || 'Fan Art'}">
                            <img src="${item.imageUrl}" alt="${item.title || 'Fan Art'}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" onerror="this.onerror=null;this.src='https://placehold.co/400x400/0F172A/94A3B8?text=Art';">
                        </a>
                        {/*
                        // Optional more detailed card structure:
                        <div class="p-3">
                            <h4 class="text-sm font-semibold text-primary truncate" title="${item.title}">${item.title}</h4>
                            <p class="text-xs text-secondary">Autor: ${item.discordUserName}</p>
                        </div>
                        */}
                    </div>
                `;
                grid.insertAdjacentHTML('beforeend', galleryItemHTML);
            });
            // Re-initialize reveal animations for newly added items if your setupRevealAnimations is global
            // or make it re-run on specific selectors.
            // If reveal animations depend on IntersectionObserver, new elements need to be observed.
            // For simplicity, if reveal items are added, they should just pick up the animation if the main observer is general.
            // Or, call a function here to explicitly observe these new items.
             if (typeof setupRevealAnimations === 'function') { // Check if function exists
                document.querySelectorAll('#fanart-gallery-grid .reveal').forEach(el => {
                    // Assuming setupRevealAnimations makes elements initially hidden if they have .reveal
                    // and the IntersectionObserver adds .visible.
                    // If elements are added after initial observation, they might need to be explicitly observed.
                    // For now, we rely on the initial setupRevealAnimations to catch them if it's general enough,
                    // or that reveal logic simply applies on class presence.
                });
            }


        } else {
            emptyDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Błąd ładowania galerii fan art:', error);
        errorDiv.textContent = 'Nie udało się załadować prac. Spróbuj ponownie później.';
        errorDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
    }
}
