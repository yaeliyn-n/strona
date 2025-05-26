import React, { useState, useEffect, useCallback, useRef } from 'react';

// Stałe (można przenieść do konfiguracji)
const API_BASE_URL = ''; // Pusty string, aby używać relatywnych ścieżek
const ADMIN_DISCORD_ID = "1238814802357387285"; // Przykładowe ID admina

// Ikony SVG jako komponenty dla czytelności
const IconDiscord = () => (
    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.297 0H3.703C1.658 0 0 1.658 0 3.703V20.297C0 22.342 1.658 24 3.703 24H20.297C22.342 24 24 22.342 24 20.297V3.703C24 1.658 22.342 0 20.297 0ZM8.107 15.232C7.089 15.232 6.241 14.384 6.241 13.366C6.241 12.348 7.089 11.5 8.107 11.5C9.125 11.5 9.973 12.348 9.973 13.366C9.973 14.384 9.125 15.232 8.107 15.232ZM12.000 11.071C10.982 11.071 10.134 10.223 10.134 9.205C10.134 8.188 10.982 7.339 12.000 7.339C13.018 7.339 13.866 8.188 13.866 9.205C13.866 10.223 13.018 11.071 12.000 11.071ZM15.893 15.232C14.875 15.232 14.027 14.384 14.027 13.366C14.027 12.348 14.875 11.5 15.893 11.5C16.911 11.5 17.759 12.348 17.759 13.366C17.759 14.384 16.911 15.232 15.893 15.232Z"/></svg>
);

const IconClose = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);

const LoadingSpinner = ({ size = 'w-6 h-6', color = 'border-[var(--text-accent)]' }) => (
    <div className={`loading-spinner ${size} ${color} border-t-transparent`}></div>
);

// Komponent Nagłówka
const AppHeader = ({ user, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header id="navbar" className="fixed top-0 left-0 right-0 z-[60] py-3 bg-[var(--bg-header)] backdrop-blur-md shadow-md">
            <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
                <a href="/index.html" className="text-3xl font-bold" aria-label="Strona główna Kronik Elary">
                    <span className="text-[var(--text-accent)]">Kroniki</span> <span className="text-[var(--text-primary)]">Elary</span>
                </a>
                <nav className="flex items-center space-x-1 lg:space-x-2">
                    <a href="/index.html" className="nav-link hidden sm:inline-block">Strona Główna</a>
                    <a href="/prezentacja.html" className="nav-link hidden sm:inline-block">Prezentacja</a>
                    <a href="/wikipedia.html" className="nav-link hidden sm:inline-block">Wikipedia</a>
                    <a href="/ranking-stats.html" className="nav-link hidden sm:inline-block">Rankingi</a>
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <img
                                src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32` : 'https://placehold.co/32x32/A78BFA/FFFFFF?text=U'}
                                alt="Awatar użytkownika"
                                className="user-avatar w-8 h-8 rounded-full border-2 border-[var(--border-accent)] cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                onError={(e) => { e.target.src = 'https://placehold.co/32x32/A78BFA/FFFFFF?text=U'; }}
                            />
                            {isDropdownOpen && (
                                <div className="dropdown-menu open absolute top-full right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md shadow-lg z-[70]">
                                    <div className="px-4 py-3 border-b border-[var(--border-card)]">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.username}</p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.email || 'Brak emaila'}</p>
                                    </div>
                                    <a href="/profil.html" className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(var(--rgb-accent),0.1)] hover:text-[var(--text-accent)]">Mój Profil</a>
                                    <a href="/sklep-premium.html" className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(var(--rgb-accent),0.1)] hover:text-[var(--text-accent)]">Sklep Premium 💠</a>
                                    <a href="/support.html" className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(var(--rgb-accent),0.1)] hover:text-[var(--text-accent)]">Centrum Wsparcia</a>
                                    {user.id === ADMIN_DISCORD_ID && (
                                        <a href="/admin.html" className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(var(--rgb-accent),0.1)] hover:text-[var(--text-accent)]">Panel Admina</a>
                                    )}
                                    <button
                                        onClick={onLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(var(--rgb-accent),0.1)] hover:text-[var(--text-accent)] rounded-b-md"
                                    >
                                        Wyloguj
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a href={`${API_BASE_URL}/auth/discord/login`} className="btn-discord !text-white px-4 py-2.5 rounded-md text-sm flex items-center">
                            <IconDiscord /> Zaloguj przez Discord
                        </a>
                    )}
                </nav>
            </div>
        </header>
    );
};

// Komponent wyświetlający waluty użytkownika
const UserCurrencyDisplay = ({ dukaty, krysztaly, isLoading }) => {
    if (isLoading) {
        return (
            <div className="text-md sm:text-lg text-slate-100 font-semibold mb-8 space-y-1 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row justify-center items-center">
                <span>Twoje Dukaty: <LoadingSpinner size="!w-4 !h-4 !border-2" color="border-[var(--text-amber-400)]" /> ✨</span>
                <span>Twoje Kryształy: <LoadingSpinner size="!w-4 !h-4 !border-2" color="border-[var(--text-cyan-400)]" /> 💠</span>
            </div>
        );
    }
    return (
        <div className="text-md sm:text-lg text-slate-100 font-semibold mb-8 space-y-1 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row justify-center items-center">
            <span>Twoje Dukaty: <strong className="font-bold text-[var(--text-amber-400)]">{dukaty.toLocaleString('pl-PL')}</strong> ✨</span>
            <span>Twoje Kryształy: <strong className="font-bold text-[var(--text-cyan-400)]">{krysztaly.toLocaleString('pl-PL')}</strong> 💠</span>
        </div>
    );
};

// Komponent karty przedmiotu w sklepie
const ShopItemCard = ({ item, onPurchase, isLoggedIn }) => {
    let priceDisplay = "";
    if (item.cost_dukaty !== null && item.cost_dukaty !== undefined) {
        priceDisplay += `<span class="price-dukaty">${item.cost_dukaty.toLocaleString('pl-PL')} ✨</span>`;
    }
    if (item.cost_krysztaly !== null && item.cost_krysztaly !== undefined) {
        if (priceDisplay) priceDisplay += " / ";
        priceDisplay += `<span class="price-krysztaly">${item.cost_krysztaly.toLocaleString('pl-PL')} 💠</span>`;
    }
    if (!priceDisplay) priceDisplay = "Niedostępny";

    return (
        <div className="shop-item-card bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-lg p-6 flex flex-col items-center text-center transition-all duration-300 hover:transform hover:translate-y-[-10px] hover:scale-105 hover:shadow-2xl group">
            <div className="shop-item-icon text-5xl mb-4 text-[var(--text-amber-400)] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-5">{item.icon_emoji || '🛍️'}</div>
            <h4 className="shop-item-name text-xl font-semibold text-[var(--text-primary)] mb-2">{item.nazwa || `Brak nazwy (ID: ${item.id})`}</h4>
            <p className="shop-item-description text-sm text-[var(--text-secondary)] mb-4 min-h-[3.5em]">{item.opis || 'Brak opisu.'}</p>
            <p className="shop-item-price text-lg font-semibold mb-4" dangerouslySetInnerHTML={{ __html: priceDisplay }}></p>
            <div className="buy-buttons-container mt-auto flex flex-col gap-2 w-full">
                {item.cost_dukaty !== null && item.cost_dukaty !== undefined && (
                    <button
                        className="btn btn-buy btn-primary text-sm py-2 px-4 w-full"
                        onClick={() => isLoggedIn ? onPurchase(item, 'dukaty') : window.location.href = `${API_BASE_URL}/auth/discord/login`}
                    >
                        {isLoggedIn ? 'Kup za Dukaty' : 'Zaloguj, aby kupić'}
                    </button>
                )}
                {item.cost_krysztaly !== null && item.cost_krysztaly !== undefined && (
                    <button
                        className="btn btn-buy btn-premium text-sm py-2 px-4 w-full"
                        onClick={() => isLoggedIn ? onPurchase(item, 'krysztaly') : window.location.href = `${API_BASE_URL}/auth/discord/login`}
                    >
                        {isLoggedIn ? 'Kup za Kryształy' : 'Zaloguj, aby kupić'}
                    </button>
                )}
            </div>
        </div>
    );
};

// Komponent modala potwierdzenia zakupu
const PurchaseConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    item,
    currencyType,
    userDukaty,
    userKrysztaly,
    isLoading,
    message
}) => {
    if (!isOpen || !item) return null;

    const itemPrice = currencyType === 'dukaty' ? item.cost_dukaty : item.cost_krysztaly;
    const priceSymbol = currencyType === 'dukaty' ? '✨' : '💠';
    const confirmButtonClass = currencyType === 'dukaty' ? 'btn-primary' : 'btn-premium';

    return (
        <div className="modal-overlay open fixed inset-0 bg-[var(--modal-backdrop)] backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="modal-content bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">Potwierdzenie Zakupu</h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors" aria-label="Zamknij modal">
                        <IconClose />
                    </button>
                </div>
                <div className="modal-body text-[var(--text-secondary)] mb-6">
                    <p>Czy na pewno chcesz kupić <strong className="text-[var(--text-accent)]">{item.nazwa}</strong>?</p>
                    <p className="mt-2">Cena: <strong className={currencyType === 'dukaty' ? 'text-[var(--text-amber-400)]' : 'text-[var(--text-cyan-400)]'}>{itemPrice.toLocaleString('pl-PL')} {priceSymbol}</strong></p>
                    <p className="text-xs mt-2">Twoje obecne saldo: 
                        <span className="font-semibold text-[var(--text-amber-400)]"> {userDukaty.toLocaleString('pl-PL')}</span> ✨ / 
                        <span className="font-semibold text-[var(--text-cyan-400)]"> {userKrysztaly.toLocaleString('pl-PL')}</span> 💠
                    </p>
                </div>
                {message && (
                    <div className={`text-sm text-center mb-4 h-auto min-h-[1.25rem] ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.text}
                    </div>
                )}
                <div className="modal-footer mt-auto pt-4 border-t border-[var(--border-card)] flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        id="staticConfirmPurchaseButton"
                        type="button"
                        className={`btn ${confirmButtonClass} px-4 py-2 text-sm w-full sm:w-auto flex items-center justify-center min-h-[38px]`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner size="!w-5 !h-5 !border-2" /> : `Potwierdź Zakup`}
                    </button>
                    <button
                        id="cancelPurchaseButton"
                        type="button"
                        className="btn-secondary px-4 py-2 text-sm w-full sm:w-auto min-h-[38px]"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
};


// Główny komponent aplikacji
function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [userDukaty, setUserDukaty] = useState(0);
    const [userKrysztaly, setUserKrysztaly] = useState(0);
    const [shopItems, setShopItems] = useState([]);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isLoadingCurrency, setIsLoadingCurrency] = useState(true);
    const [isLoadingShop, setIsLoadingShop] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemForPurchase, setSelectedItemForPurchase] = useState(null);
    const [purchaseCurrencyType, setPurchaseCurrencyType] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseMessage, setPurchaseMessage] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        setIsLoadingUser(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/me`);
            if (response.ok) {
                const userData = await response.json();
                setCurrentUser(userData);
                return userData;
            } else {
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Błąd pobierania profilu użytkownika:', error);
            setCurrentUser(null);
        } finally {
            setIsLoadingUser(false);
        }
        return null;
    }, []);

    const fetchUserCurrency = useCallback(async (userId) => {
        if (!userId) {
            setUserDukaty(0);
            setUserKrysztaly(0);
            setIsLoadingCurrency(false);
            return;
        }
        setIsLoadingCurrency(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/bot-stats/${userId}`);
            if (response.ok) {
                const stats = await response.json();
                setUserDukaty(stats.currency !== undefined ? stats.currency : 0);
                setUserKrysztaly(stats.premium_currency !== undefined ? stats.premium_currency : 0);
            } else {
                setUserDukaty(0);
                setUserKrysztaly(0);
                console.error('Nie udało się pobrać walut użytkownika');
            }
        } catch (error) {
            console.error('Błąd pobierania walut użytkownika:', error);
            setUserDukaty(0);
            setUserKrysztaly(0);
        } finally {
            setIsLoadingCurrency(false);
        }
    }, []);

    const fetchShopItems = useCallback(async () => {
        setIsLoadingShop(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/web/shop/items`);
            if (response.ok) {
                const responseData = await response.json();
                let itemsToProcess = null;
                if (responseData && responseData.items && typeof responseData.items === 'object' && !Array.isArray(responseData.items)) {
                    itemsToProcess = responseData.items;
                } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
                    itemsToProcess = responseData;
                }

                if (itemsToProcess && typeof itemsToProcess === 'object') {
                    const itemsArray = Object.entries(itemsToProcess).map(([itemId, itemData]) => ({
                        id: itemId,
                        nazwa: itemData.nazwa,
                        opis: itemData.opis,
                        cost_dukaty: itemData.koszt_dukatow,
                        cost_krysztaly: itemData.koszt_krysztalow,
                        icon_emoji: itemData.emoji
                    }));
                    setShopItems(itemsArray);
                } else {
                    setShopItems([]);
                    console.warn("Nieprawidłowy format danych sklepu:", responseData);
                }
            } else {
                setShopItems([]);
                console.error('Nie udało się pobrać przedmiotów ze sklepu');
            }
        } catch (error) {
            console.error('Błąd pobierania przedmiotów sklepu:', error);
            setShopItems([]);
        } finally {
            setIsLoadingShop(false);
        }
    }, []);

    useEffect(() => {
        async function initialLoad() {
            const user = await fetchUserProfile();
            if (user && user.id) {
                await fetchUserCurrency(user.id);
            }
            await fetchShopItems();
        }
        initialLoad();
    }, [fetchUserProfile, fetchUserCurrency, fetchShopItems]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
        } catch (error) {
            console.error("Błąd podczas wylogowywania na serwerze:", error);
        } finally {
            setCurrentUser(null);
            setUserDukaty(0);
            setUserKrysztaly(0);
        }
    };

    const handleOpenPurchaseModal = (item, currency) => {
        if (!currentUser) { // Dodatkowe sprawdzenie, chociaż przyciski powinny przekierować
            window.location.href = `${API_BASE_URL}/auth/discord/login`;
            return;
        }
        setSelectedItemForPurchase(item);
        setPurchaseCurrencyType(currency);
        setPurchaseMessage(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItemForPurchase(null);
        setPurchaseCurrencyType('');
        setIsPurchasing(false); 
    };

    const handleConfirmPurchase = async () => {
        if (!selectedItemForPurchase || !currentUser) return;

        setIsPurchasing(true);
        setPurchaseMessage(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/web/shop/buy/${selectedItemForPurchase.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency_type: purchaseCurrencyType })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setPurchaseMessage({ type: 'success', text: result.message || `Pomyślnie zakupiono: ${selectedItemForPurchase.nazwa}!` });
                await fetchUserCurrency(currentUser.id);
                setTimeout(() => {
                    handleCloseModal();
                }, 2500);
            } else {
                let errorMsg = result.error || 'Nie udało się dokonać zakupu.';
                if (result.current_balance !== undefined && result.item_cost !== undefined) {
                     const balanceSymbol = purchaseCurrencyType === 'dukaty' ? '✨' : '💠';
                     errorMsg += ` (Masz: ${result.current_balance.toLocaleString('pl-PL')}${balanceSymbol}, Potrzebujesz: ${result.item_cost.toLocaleString('pl-PL')}${balanceSymbol})`;
                }
                setPurchaseMessage({ type: 'error', text: errorMsg });
            }
        } catch (error) {
            console.error('Błąd podczas zakupu:', error);
            setPurchaseMessage({ type: 'error', text: 'Wystąpił błąd sieciowy podczas próby zakupu.' });
        } finally {
            setIsPurchasing(false);
        }
    };
    
    return (
        <>
            <style>{`
                :root {
                    --bg-primary: #0F172A; 
                    --bg-secondary: rgba(30, 41, 59, 0.8); 
                    --bg-card: #1E293B; 
                    --bg-header: rgba(15, 23, 42, 0.92); 
                    --text-primary: #E2E8F0; 
                    --text-secondary: #94A3B8; 
                    --text-accent: #A78BFA;
                    --text-accent-hover: #8B5CF6; 
                    --text-premium: #22D3EE;
                    --text-premium-hover: #0BC5EA;
                    --text-amber-400: #FBBF24;
                    --text-cyan-400: #22D3EE;
                    --border-accent: #8B5CF6; 
                    --border-premium: #22D3EE;
                    --border-card: rgba(167, 139, 250, 0.25); 
                    --btn-primary-bg: #8B5CF6; 
                    --btn-primary-hover-bg: #7C3AED; 
                    --btn-premium-bg: #22D3EE; 
                    --btn-premium-hover-bg: #0BC5EA;
                    --btn-discord-bg: #5865F2;
                    --btn-discord-hover-bg: #4752C4;
                    --modal-backdrop: rgba(15, 23, 42, 0.85);
                    --rgb-accent: 167, 139, 250;
                    --rgb-premium: 34, 211, 238;
                    --scrollbar-thumb-bg: #8B5CF6;
                    --scrollbar-thumb-hover-bg: #7C3AED;
                    --svg-icon-fill: #E2E8F0;
                    --shadow-color: rgba(167, 139, 250, 0.25); 
                    --shadow-strong-color: rgba(167, 139, 250, 0.4);
                }
                html.light { 
                    --bg-primary: #F9FAFB;
                    --bg-secondary: rgba(243, 244, 246, 0.9);
                    --bg-card: #FFFFFF;
                    --bg-header: rgba(255, 255, 255, 0.95);
                    --text-primary: #1F2937;
                    --text-secondary: #4B5563;
                    --text-accent: #7C3AED;
                    --text-accent-hover: #6D28D9;
                    --text-premium: #0891B2; 
                    --text-premium-hover: #067A95;
                    --text-amber-400: #D97706;
                    --text-cyan-400: #0891B2;
                    --border-accent: #7C3AED;
                    --border-premium: #0891B2;
                    --border-card: rgba(124, 58, 237, 0.1);
                    --btn-primary-bg: #7C3AED;
                    --btn-primary-hover-bg: #6D28D9;
                    --btn-premium-bg: #0891B2;
                    --btn-premium-hover-bg: #067A95;
                    --btn-discord-bg: #5865F2;
                    --btn-discord-hover-bg: #4752C4;
                    --modal-backdrop: rgba(249, 250, 251, 0.85);
                    --rgb-accent: 124, 58, 237;
                    --rgb-premium: 8, 145, 178;
                    --scrollbar-thumb-bg: #A78BFA;
                    --scrollbar-thumb-hover-bg: #8B5CF6;
                    --svg-icon-fill: #374151;
                    --shadow-color: rgba(124, 58, 237, 0.08);
                    --shadow-strong-color: rgba(124, 58, 237, 0.15);
                }
                body { font-family: 'Inter', sans-serif; background-color: var(--bg-primary); color: var(--text-primary); line-height: 1.75; margin: 0; }
                h1, h2, h3, h4, h5 { font-family: 'Lora', serif; font-weight: 600; line-height: 1.35; }
                .btn { transition: background-color 0.2s ease, transform 0.2s ease; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500;}
                .btn-primary { background-color: var(--btn-primary-bg); color: white; } .btn-primary:hover { background-color: var(--btn-primary-hover-bg); transform: translateY(-1px); }
                .btn-premium { background-color: var(--btn-premium-bg); color: white; } .btn-premium:hover { background-color: var(--btn-premium-hover-bg); transform: translateY(-1px); }
                .btn-discord { background-color: var(--btn-discord-bg); color: white; } .btn-discord:hover { background-color: var(--btn-discord-hover-bg); transform: translateY(-1px); }
                .btn-secondary { background-color: transparent; border: 2px solid var(--border-accent); color: var(--text-accent); }
                .btn-secondary:hover { background-color: var(--border-accent); color: white; transform: translateY(-1px); }
                .price-dukaty { color: var(--text-amber-400); } .price-krysztaly { color: var(--text-premium); }
                .loading-spinner { border: 3px solid rgba(var(--rgb-accent), 0.3); border-top-color: var(--text-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .animated-gradient-text { background: linear-gradient(45deg, var(--text-accent), var(--text-accent-hover), #c084fc, var(--text-accent)); background-size: 200% 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: gradient-flow 8s ease infinite; } @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .hero-shop-bg { background: linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 1)), url('https://placehold.co/1920x700/0a0f1e/8B5CF6?text=Skarbiec+Kronik') center/cover no-repeat fixed; }
                .user-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border-accent); cursor: pointer; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; } .user-avatar:hover { transform: scale(1.1); box-shadow: 0 0 10px var(--shadow-strong-color); }
                .dropdown-menu { position: absolute; top: calc(100% + 0.5rem); right: 0; background-color: var(--bg-card); border: 1px solid var(--border-card); border-radius: 0.5rem; box-shadow: 0 10px 25px -5px var(--shadow-strong-color), 0 8px 10px -6px var(--shadow-color); z-index: 50; min-width: 220px; opacity: 0; visibility: hidden; transform: translateY(-10px); transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s; } .dropdown-menu.open { opacity: 1; visibility: visible; transform: translateY(0); transition: opacity 0.2s ease, transform 0.2s ease; }
                .dropdown-menu a, .dropdown-menu button { display: block; width: 100%; text-align: left; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--text-secondary); transition: background-color 0.15s ease, color 0.15s ease; } .dropdown-menu a:hover, .dropdown-menu button:hover { background-color: rgba(var(--rgb-accent), 0.1); color: var(--text-accent); } .dropdown-menu form { margin: 0; } 
                .nav-link { color: var(--text-secondary); padding: 0.5rem 1rem; border-radius: 0.375rem; transition: background-color 0.2s ease, color 0.2s ease; font-weight: 500; }
                .nav-link:hover { background-color: rgba(var(--rgb-accent), 0.1); color: var(--text-accent); }
            `}</style>
            
            <AppHeader user={currentUser} onLogout={handleLogout} />

            <main className="pt-20"> {/* Zapewnia, że treść nie jest pod nagłówkiem */}
                <section className="hero-shop-bg min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center text-center pt-24 sm:pt-20">
                    <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                            Sklep Bota <span className="animated-gradient-text">"Pod Gwiezdnym Dukatem i Kryształem"</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
                            Witaj w magicznym kramie Runy! Wydaj swoje ciężko zarobione Gwiezdne Dukaty lub cenne Gwiezdne Kryształy na unikalne przedmioty.
                        </p>
                        {currentUser && <UserCurrencyDisplay dukaty={userDukaty} krysztaly={userKrysztaly} isLoading={isLoadingCurrency} />}
                        <a href="/sklep-premium.html" className="btn btn-premium font-semibold py-2.5 px-6 rounded-lg text-sm inline-block shadow-lg hover:shadow-xl transition-shadow">
                            💠 Zdobądź Więcej Gwiezdnych Kryształów 💠
                        </a>
                    </div>
                </section>

                <section id="shop-items-section" className="py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6">
                        {!currentUser && !isLoadingUser && (
                            <div className="text-center mb-12 p-6 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl">
                                <h2 className="text-2xl font-semibold text-[var(--text-amber-400)] mb-4">Witaj w Sklepie!</h2>
                                <p className="text-[var(--text-secondary)] text-lg mb-6">Aby przeglądać asortyment i dokonywać zakupów, <a href={`${API_BASE_URL}/auth/discord/login`} className="font-bold underline hover:text-[var(--text-accent)]">zaloguj się przez Discord</a>.</p>
                            </div>
                        )}

                        {isLoadingShop && (
                            <div className="text-center py-10">
                                <LoadingSpinner size="w-12 h-12" />
                                <p className="text-[var(--text-secondary)] mt-4">Ładowanie asortymentu sklepu...</p>
                            </div>
                        )}

                        {!isLoadingShop && shopItems.length === 0 && (
                            <p className="text-[var(--text-secondary)] col-span-full text-center py-10">Sklep jest chwilowo pusty lub wystąpił błąd wczytywania danych.</p>
                        )}
                        
                        {!isLoadingShop && shopItems.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {shopItems.map(item => (
                                    <ShopItemCard key={item.id} item={item} onPurchase={handleOpenPurchaseModal} isLoggedIn={!!currentUser} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <PurchaseConfirmationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmPurchase}
                item={selectedItemForPurchase}
                currencyType={purchaseCurrencyType}
                userDukaty={userDukaty}
                userKrysztaly={userKrysztaly}
                isLoading={isPurchasing}
                message={purchaseMessage}
            />

            <footer className="py-12 text-center bg-[var(--bg-header)] border-t border-[var(--border-card)]">
                <div className="container mx-auto px-4 sm:px-6">
                    <p className="text-[var(--text-secondary)] text-sm">
                        &copy; {new Date().getFullYear()} Kroniki Elary. Wszelkie prawa zastrzeżone.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default App;
