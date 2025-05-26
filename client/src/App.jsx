import React, { useState, useEffect, useRef } from 'react';
import { Home, Newspaper, Users, Shield, MessageSquare, LogIn, UserPlus, ShoppingCart, Crown, BarChart2, BookOpen, HelpCircle, Settings, LogOut, Sun, Moon, Search, Menu, X, ChevronDown, ChevronUp, ExternalLink, Info, Edit3, Trash2, Send } from 'lucide-react'; // Dodano Send
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
// Upewnij się, że plik firebaseConfig.js istnieje i jest poprawnie skonfigurowany
// import { auth, db } from './firebaseConfig'; 
// Poniżej tymczasowe mocki dla auth i db, jeśli firebaseConfig nie jest jeszcze gotowy
const mockAuth = { onAuthStateChanged: () => (() => {}), currentUser: null };
const mockDb = {};
const auth = typeof window !== 'undefined' ? (window.firebase?.auth || mockAuth) : mockAuth; // Użyj rzeczywistej konfiguracji Firebase
const db = typeof window !== 'undefined' ? (window.firebase?.firestore || mockDb) : mockDb; // Użyj rzeczywistej konfiguracji Firebase


import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, onSnapshot, updateDoc, deleteDoc, serverTimestamp, orderBy as firestoreOrderBy } from 'firebase/firestore'; // Dodano orderBy as firestoreOrderBy

// Mock data - zastąp wywołaniami API lub danymi z Firestore
const initialAnnouncements = [
  { id: 1, title: 'Nowy event!', content: 'Dołącz do naszego nowego eventu w ten weekend! Czekają na Ciebie niesamowite nagrody i mnóstwo zabawy. Nie przegap tej okazji!', date: '2024-05-20', image: 'https://placehold.co/600x400/F2A057/FFFFFF?text=Event+Specjalny' },
  { id: 2, title: 'Aktualizacja serwera v1.5', content: 'Serwer został zaktualizowany do najnowszej wersji. Wprowadziliśmy wiele poprawek i nowych funkcji. Sprawdź listę zmian na forum!', date: '2024-05-18', image: 'https://placehold.co/600x400/86BBD8/FFFFFF?text=Aktualizacja+v1.5' },
  { id: 3, title: 'Konkurs budowlany: Zamki', content: 'Pokaż swoje umiejętności w wielkim konkursie budowlanym! Tematem przewodnim są średniowieczne zamki. Nagrody czekają!', date: '2024-05-15', image: 'https://placehold.co/600x400/90C695/FFFFFF?text=Konkurs+Zamki' },
];

const initialTeamMembers = [
  { id: 1, name: 'ArcyMag', role: 'Administrator Główny', avatar: 'https://placehold.co/100x100/A27B5C/FFFFFF?text=AM' },
  { id: 2, name: 'StrażnikPorządku', role: 'Moderator', avatar: 'https://placehold.co/100x100/A27B5C/FFFFFF?text=SP' },
  { id: 3, name: 'MistrzWsparcia', role: 'Pomocnik Techniczny', avatar: 'https://placehold.co/100x100/A27B5C/FFFFFF?text=MW' },
];

const initialShopItems = [
  { id: 1, name: 'Ranga VIP Złoty', price: '24.99 PLN', description: 'Specjalna ranga z unikalnymi przywilejami i dostępem do ekskluzywnych funkcji.', icon: <Crown className="w-10 h-10 text-yellow-500" /> },
  { id: 2, name: 'Klucz Legendarny', price: '9.99 PLN', description: 'Otwórz legendarną skrzynkę i zdobądź rzadkie przedmioty.', icon: <ShoppingCart className="w-10 h-10 text-emerald-500" /> },
  { id: 3, name: 'Eliksir Doświadczenia x2', price: '14.99 PLN', description: 'Podwaja zdobywane doświadczenie przez 1 godzinę.', icon: <Home className="w-10 h-10 text-sky-500" /> }, // Zmieniono ikonę dla przykładu
];

const initialStats = [
  { id: 1, label: 'Graczy Online', value: '123/1000' },
  { id: 2, label: 'Rekord Graczy', value: '567' },
  { id: 3, label: 'Zarejestrowanych', value: '8901' },
];

const initialFaqItems = [
  { id: 1, question: 'Jak dołączyć do serwera?', answer: 'Aby dołączyć, skopiuj adres IP: mc.twojserwer.pl i wklej go w sekcji "Multiplayer" w swojej grze Minecraft. Następnie kliknij "Dołącz do serwera".' },
  { id: 2, question: 'Jakie są główne zasady serwera?', answer: 'Pełen regulamin znajdziesz w zakładce "Regulamin". Najważniejsze zasady to: szacunek dla innych, zakaz cheatowania i griefowania oraz dbanie o dobrą atmosferę.' },
  { id: 3, question: 'Gdzie mogę zgłosić problem lub błąd?', answer: 'Problemy i błędy możesz zgłaszać poprzez system ticketów na naszej stronie (zakładka "Support") lub na dedykowanym kanale na naszym serwerze Discord.' },
];


function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [shopItems, setShopItems] = useState(initialShopItems);
  const [stats, setStats] = useState(initialStats);
  const [faqItems, setFaqItems] = useState(initialFaqItems);
  const [openFaq, setOpenFaq] = useState(null);

  // Admin panel state
  const [adminContent, setAdminContent] = useState({ title: '', text: '', image: '', section: 'generic' });
  const [editingContent, setEditingContent] = useState(null);
  const [allContent, setAllContent] = useState([]);

  // Support Ticket State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [userTickets, setUserTickets] = useState([]);
  const [adminTickets, setAdminTickets] = useState([]);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false); // Śledzenie gotowości autoryzacji

  const sections = {
    home: { label: 'Strona Główna', icon: <Home className="w-5 h-5 mr-2" />, component: <HomeSection announcements={announcements} stats={stats} setActiveSection={setActiveSection} /> },
    news: { label: 'Aktualności', icon: <Newspaper className="w-5 h-5 mr-2" />, component: <NewsSection announcements={announcements} handleEditContent={isAdmin ? handleEditContent : undefined} handleDeleteContent={isAdmin ? handleDeleteContent : undefined} /> },
    team: { label: 'Ekipa', icon: <Users className="w-5 h-5 mr-2" />, component: <TeamSection teamMembers={teamMembers} /> },
    rules: { label: 'Regulamin', icon: <Shield className="w-5 h-5 mr-2" />, component: <RulesSection /> },
    shop: { label: 'Sklep', icon: <ShoppingCart className="w-5 h-5 mr-2" />, component: <ShopSection items={shopItems} /> },
    ranking: { label: 'Ranking', icon: <BarChart2 className="w-5 h-5 mr-2" />, component: <RankingSection /> },
    lore: { label: 'Lore', icon: <BookOpen className="w-5 h-5 mr-2" />, component: <LoreSection /> },
    support: { label: 'Support', icon: <MessageSquare className="w-5 h-5 mr-2" />, component: <SupportSection user={user} ticketSubject={ticketSubject} setTicketSubject={setTicketSubject} ticketMessage={ticketMessage} setTicketMessage={setTicketMessage} handleCreateTicket={handleCreateTicket} userTickets={userTickets} viewTicketDetails={viewTicketDetails}/> },
    faq: { label: 'FAQ', icon: <HelpCircle className="w-5 h-5 mr-2" />, component: <FaqSection items={faqItems} openFaq={openFaq} setOpenFaq={setOpenFaq} /> },
    admin: { label: 'Admin Panel', icon: <Settings className="w-5 h-5 mr-2" />, component: <AdminPanel content={adminContent} setContent={setAdminContent} handleSaveContent={handleSaveContent} allContent={allContent} handleEditContent={handleEditContent} handleDeleteContent={handleDeleteContent} editingContent={editingContent} setEditingContent={setEditingContent} adminTickets={adminTickets} viewTicketDetails={viewTicketDetails} handleStatusChange={handleStatusChange} />, adminOnly: true },
  };

  const navLinks = Object.keys(sections).filter(key => !sections[key].adminOnly || (sections[key].adminOnly && isAdmin));

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Sprawdzenie, czy auth i db są dostępne (Firebase SDK załadowane)
    if (!auth || !db || !auth.onAuthStateChanged) {
      console.warn("Firebase SDK not fully loaded or initialized.");
      setIsAuthReady(true); // Pozwól aplikacji działać z mockami lub bez Firebase
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        fetchUserTickets(currentUser.uid);
      } else {
        setIsAdmin(false);
        setUserTickets([]);
      }
      setIsAuthReady(true); // Autoryzacja sprawdzona
    });
    return () => unsubscribe();
  }, []); // Pusta tablica zależności, uruchamia się raz


  // Firestore operations for content
  useEffect(() => {
    if (!isAuthReady || !db || !collection) return; // Czekaj na gotowość auth i db
    const q = query(collection(db, "siteContent"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const contentData = [];
      querySnapshot.forEach((doc) => {
        contentData.push({ id: doc.id, ...doc.data() });
      });
      setAllContent(contentData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0) ));
      
      const firestoreAnnouncements = contentData
        .filter(c => c.section === 'announcements' || (!c.section && c.title && c.text)) // Uogólnienie dla starszych treści
        .map(a => ({
            ...a, 
            date: a.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0] 
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (firestoreAnnouncements.length > 0) {
        setAnnouncements(firestoreAnnouncements);
      } else {
        setAnnouncements(initialAnnouncements); // Fallback to initial if Firestore is empty
      }
    }, (error) => {
        console.error("Error fetching site content: ", error);
        setAnnouncements(initialAnnouncements); // Fallback on error
    });
    return () => unsubscribe();
  }, [isAuthReady]); // Zależność od isAuthReady

  const handleSaveContent = async () => {
    if (!adminContent.title || !adminContent.text) {
      showNotification("Tytuł i treść są wymagane!", "error");
      return;
    }
    if (!db || !collection) { // Sprawdzenie, czy db jest dostępne
        showNotification("Baza danych nie jest dostępna.", "error");
        return;
    }
    try {
      if (editingContent) {
        const contentRef = doc(db, "siteContent", editingContent.id);
        await updateDoc(contentRef, { ...adminContent, section: adminContent.section || 'generic', updatedAt: serverTimestamp() });
        setEditingContent(null);
        showNotification("Treść zaktualizowana pomyślnie!", "success");
      } else {
        await addDoc(collection(db, "siteContent"), { ...adminContent, section: adminContent.section || 'generic', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        showNotification("Treść dodana pomyślnie!", "success");
      }
      setAdminContent({ title: '', text: '', image: '', section: 'generic' });
    } catch (error) {
      console.error("Error saving content: ", error);
      showNotification("Błąd podczas zapisywania treści.", "error");
    }
  };

  const handleEditContent = (contentItem) => {
    setEditingContent(contentItem);
    setAdminContent({ title: contentItem.title, text: contentItem.text, image: contentItem.image || '', section: contentItem.section || 'generic' });
    setActiveSection('admin');
  };

  const handleDeleteContent = async (contentId) => {
    // Implement a custom modal for confirmation instead of window.confirm
    showNotification("Funkcja usuwania wymaga potwierdzenia modalem (TODO)", "info");
    console.log("Attempting to delete content (requires modal confirmation): ", contentId);
    // Example: if (await customConfirm("Czy na pewno chcesz usunąć tę treść?")) { ... }
    // try {
    //   await deleteDoc(doc(db, "siteContent", contentId));
    //   showNotification("Treść usunięta!", "success");
    // } catch (error) {
    //   console.error("Error deleting content: ", error);
    //   showNotification("Błąd podczas usuwania treści.", "error");
    // }
  };

  // Firestore operations for support tickets
  const fetchUserTickets = (userId) => {
    if (!db || !collection) return () => {}; // Sprawdzenie, czy db jest dostępne
    const q = query(collection(db, "supportTickets"), where("userId", "==", userId), firestoreOrderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tickets = [];
      querySnapshot.forEach((doc) => {
        tickets.push({ id: doc.id, ...doc.data() });
      });
      setUserTickets(tickets);
    }, (error) => console.error("Error fetching user tickets:", error));
    return unsubscribe;
  };

  useEffect(() => {
    if (isAdmin && isAuthReady && db && collection) { // Czekaj na gotowość i dostępność db
      const q = query(collection(db, "supportTickets"), firestoreOrderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tickets = [];
        querySnapshot.forEach((doc) => {
          tickets.push({ id: doc.id, ...doc.data() });
        });
        setAdminTickets(tickets);
      }, (error) => console.error("Error fetching admin tickets:", error));
      return () => unsubscribe();
    }
  }, [isAdmin, isAuthReady]); // Zależność od isAuthReady

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      showNotification("Temat i wiadomość są wymagane.", "error");
      return;
    }
    if (!user) {
      showNotification("Musisz być zalogowany, aby utworzyć zgłoszenie.", "error");
      return;
    }
    if (!db || !collection) { // Sprawdzenie, czy db jest dostępne
        showNotification("Baza danych nie jest dostępna.", "error");
        return;
    }
    try {
      await addDoc(collection(db, "supportTickets"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        subject: ticketSubject,
        message: ticketMessage,
        status: "Oczekujące",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTicketSubject('');
      setTicketMessage('');
      showNotification("Zgłoszenie zostało wysłane!", "success");
    } catch (error) {
      console.error("Error creating ticket: ", error);
      showNotification("Wystąpił błąd podczas wysyłania zgłoszenia.", "error");
    }
  };

  const viewTicketDetails = async (ticketId) => {
    if (!db || !doc || !collection) { // Sprawdzenie, czy db jest dostępne
        showNotification("Baza danych nie jest dostępna.", "error");
        setViewingTicket(null);
        return;
    }
    const ticketRef = doc(db, "supportTickets", ticketId);
    const ticketSnap = await getDoc(ticketRef);
    if (ticketSnap.exists()) {
        const repliesQuery = query(collection(db, "supportTickets", ticketId, "replies"), firestoreOrderBy('createdAt', 'asc'));
        // It's important to manage this unsubscribe, e.g., store it and call when modal closes
        const unsubscribeReplies = onSnapshot(repliesQuery, (snapshot) => {
            const replies = [];
            snapshot.forEach(doc => replies.push({ id: doc.id, ...doc.data() }));
            setViewingTicket(prev => ({ ...prev, id: ticketSnap.id, ...ticketSnap.data(), replies, unsubscribeReplies }));
        }, (error) => {
            console.error("Error fetching replies:", error);
            showNotification("Błąd podczas ładowania odpowiedzi.", "error");
        });
        // Set initial ticket data without replies, replies will update via onSnapshot
        setViewingTicket({ id: ticketSnap.id, ...ticketSnap.data(), replies: [], unsubscribeReplies });
    } else {
      console.log("No such ticket!");
      showNotification("Nie znaleziono takiego zgłoszenia.", "error");
      setViewingTicket(null);
    }
  };
  
  const closeTicketModal = () => {
    if (viewingTicket && viewingTicket.unsubscribeReplies) {
      viewingTicket.unsubscribeReplies(); // Clean up listener
    }
    setViewingTicket(null);
  };


  const handlePostReply = async () => {
    if (!replyMessage.trim() || !viewingTicket) return;
    if (!db || !collection) { // Sprawdzenie, czy db jest dostępne
        showNotification("Baza danych nie jest dostępna.", "error");
        return;
    }
    try {
      await addDoc(collection(db, "supportTickets", viewingTicket.id, "replies"), {
        message: replyMessage,
        senderId: user.uid,
        senderName: isAdmin ? "Zespół Wsparcia" : (user.displayName || user.email.split('@')[0]),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "supportTickets", viewingTicket.id), {
        updatedAt: serverTimestamp(),
        status: isAdmin ? "Odpowiedziano" : "Aktualizacja klienta",
      });
      setReplyMessage('');
      showNotification("Odpowiedź wysłana.", "success");
    } catch (error) {
      console.error("Error posting reply: ", error);
      showNotification("Błąd podczas wysyłania odpowiedzi.", "error");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    if (!isAdmin) return;
    if (!db || !doc) { // Sprawdzenie, czy db jest dostępne
        showNotification("Baza danych nie jest dostępna.", "error");
        return;
    }
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), { status: newStatus, updatedAt: serverTimestamp() });
      if (viewingTicket && viewingTicket.id === ticketId) {
        setViewingTicket(prev => ({ ...prev, status: newStatus }));
      }
      showNotification("Status zgłoszenia zaktualizowany.", "success");
    } catch (error) {
      console.error("Error updating status: ", error);
      showNotification("Błąd podczas aktualizacji statusu.", "error");
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleSignIn = () => {
    if (!auth || !signInWithPopup) { // Sprawdzenie, czy auth jest dostępne
        showNotification("Funkcja logowania jest niedostępna.", "error");
        return;
    }
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const loggedInUser = result.user;
        if (!db || !doc || !setDoc) return; // Sprawdzenie db
        const userDocRef = doc(db, "users", loggedInUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { 
            email: loggedInUser.email, 
            displayName: loggedInUser.displayName, 
            photoURL: loggedInUser.photoURL,
            createdAt: serverTimestamp(), 
            isAdmin: false 
          });
        }
        showNotification(`Witaj, ${loggedInUser.displayName || loggedInUser.email}!`, "success");
      })
      .catch((error) => {
        console.error("Login error:", error);
        showNotification(`Błąd logowania: ${error.message}`, "error");
      });
  };

  const handleSignOut = () => {
    if (!auth || !signOut) { // Sprawdzenie, czy auth jest dostępne
        showNotification("Funkcja wylogowywania jest niedostępna.", "error");
        return;
    }
    signOut(auth).then(() => {
      showNotification("Wylogowano pomyślnie.", "success");
    }).catch((error) => {
      console.error("Logout error:", error);
      showNotification(`Błąd wylogowywania: ${error.message}`, "error");
    });
  };

  const mainContentRef = useRef(null);

  const handleNavClick = (sectionKey) => {
    setActiveSection(sectionKey);
    setMobileMenuOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Notification state and function
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-slate-800'}`}>
      {/* Notification Area */}
      {notification.visible && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl z-[200] text-white
          ${notification.type === 'success' ? 'bg-green-500' : ''}
          ${notification.type === 'error' ? 'bg-red-500' : ''}
          ${notification.type === 'info' ? 'bg-blue-500' : ''}
          transition-all duration-300 ease-in-out transform ${notification.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        >
          {notification.message}
          <button onClick={() => setNotification(prev => ({ ...prev, visible: false }))} className="ml-4 text-xl font-bold">&times;</button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 shadow-lg transition-all duration-300 ${darkMode ? 'bg-slate-800/90 border-b border-slate-700 backdrop-blur-md' : 'bg-white/80 border-b border-orange-200/70 backdrop-blur-md'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <button onClick={() => handleNavClick('home')} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img src={`https://placehold.co/40x40/${darkMode ? 'F2A057/1E293B' : 'A27B5C/FFFFFF'}?text=NS&font=roboto`} alt="Server Logo" className="h-10 w-10 rounded-lg shadow-sm" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">NazwaSerwera</h1>
          </button>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((key) => (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center group
                  ${activeSection === key
                    ? (darkMode ? 'bg-orange-600 text-white shadow-md' : 'bg-orange-500 text-white shadow-md')
                    : (darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-orange-400' : 'text-slate-600 hover:bg-orange-100 hover:text-orange-600')}
                  ${sections[key].adminOnly ? '!text-red-500 dark:!text-red-400 hover:!bg-red-100 dark:hover:!bg-red-700/50' : ''}`}
              >
                {React.cloneElement(sections[key].icon, { className: `w-5 h-5 mr-2 transition-colors ${activeSection === key ? 'text-white' : (darkMode ? 'text-slate-400 group-hover:text-orange-400' : 'text-slate-500 group-hover:text-orange-500')}` })} 
                {sections[key].label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={toggleDarkMode} title={darkMode ? "Tryb Jasny" : "Tryb Ciemny"} className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'text-yellow-400 hover:bg-slate-700 focus:ring-2 focus:ring-yellow-500' : 'text-indigo-600 hover:bg-orange-100 focus:ring-2 focus:ring-indigo-500'}`}>
              {darkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            {user ? (
              <div className="relative group">
                <img 
                    src={user.photoURL || `https://placehold.co/36x36/${darkMode ? '714429/EBD9B4' : 'EBD9B4/714429'}?text=${user.email?.[0].toUpperCase()}&font=roboto`} 
                    alt="User Avatar" 
                    className="w-9 h-9 rounded-full cursor-pointer border-2 border-orange-400 dark:border-orange-500 hover:opacity-90 transition-opacity" 
                />
                <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-slate-200'} rounded-lg shadow-xl py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 origin-top-right`}>
                  <div className="px-4 py-3 border-b dark:border-slate-600">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.displayName || 'Użytkownik'}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                  </div>
                  {isAdmin && <p className="px-4 py-2 text-xs text-red-500 dark:text-red-400 font-semibold">Panel Admina Aktywny</p>}
                  <button
                    onClick={handleSignOut}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-600' : 'text-slate-700 hover:bg-orange-50'}`}
                  >
                    <LogOut className="w-4 h-4 mr-2.5" /> Wyloguj
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleSignIn} className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm font-semibold flex items-center transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                ${darkMode ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                <LogIn className="w-5 h-5 mr-1.5 sm:mr-2" /> Zaloguj
              </button>
            )}
            <button className="md:hidden p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-2 focus:ring-orange-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} title="Menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden absolute top-full left-0 right-0 shadow-xl py-2 z-40 border-t border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-slideDown">
            {navLinks.map((key) => (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                className={`w-full text-left flex items-center px-4 py-3.5 text-base font-medium transition-colors duration-150
                  ${activeSection === key
                    ? (darkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white')
                    : (darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-orange-400' : 'text-slate-600 hover:bg-orange-100 hover:text-orange-600')}
                  ${sections[key].adminOnly ? '!text-red-500 dark:!text-red-400' : ''}`}
              >
                {React.cloneElement(sections[key].icon, { className: "w-5 h-5 mr-3" })}
                {sections[key].label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main ref={mainContentRef} className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 overflow-y-auto scroll-smooth">
        {sections[activeSection] && sections[activeSection].component}
      </main>

      <footer className={`py-8 text-center transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-t border-slate-700' : 'bg-white/70 border-t border-orange-200/70'}`}>
        <p className="text-sm text-slate-700 dark:text-slate-300">&copy; {new Date().getFullYear()} NazwaSerwera. Wszelkie prawa zastrzeżone.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Strona stworzona z <span className="text-red-500 animate-pulse">❤</span> przez Zespół NazwaSerwera
        </p>
        <div className="mt-3 space-x-4">
          <a href="/polityka-prywatnosci.html" className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline">Polityka Prywatności</a>
          <a href="/regulamin-strony.html" className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline">Regulamin Strony</a>
        </div>
      </footer>

      {viewingTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className={`rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300 ${darkMode ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white text-slate-800 border'}`}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-slate-700">
              <h3 className="text-xl sm:text-2xl font-semibold text-orange-600 dark:text-orange-400 truncate pr-4" title={viewingTicket.subject}>Zgłoszenie: {viewingTicket.subject}</h3>
              <button onClick={closeTicketModal} className={`p-1.5 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}>
                <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-grow mb-4 pr-2 space-y-4 custom-scrollbar">
              <div className={`p-4 rounded-lg shadow-sm ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Od: <span className="font-medium">{viewingTicket.userName || viewingTicket.userEmail}</span></p>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full
                        ${viewingTicket.status === 'Oczekujące' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                        ${viewingTicket.status === 'W trakcie' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300' : ''}
                        ${viewingTicket.status === 'Odpowiedziano' ? 'bg-sky-100 text-sky-800 dark:bg-sky-700/30 dark:text-sky-300' : ''}
                        ${viewingTicket.status === 'Rozwiązane' ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' : ''}
                        ${viewingTicket.status === 'Zamknięte' ? 'bg-slate-200 text-slate-800 dark:bg-slate-600/30 dark:text-slate-300' : ''}
                    `}>{viewingTicket.status}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{viewingTicket.message}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">Zgłoszono: {viewingTicket.createdAt?.toDate().toLocaleString('pl-PL')}</p>
              </div>

              <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-700 dark:text-slate-300">Odpowiedzi:</h4>
              {viewingTicket.replies && viewingTicket.replies.length > 0 ? (
                viewingTicket.replies.map(reply => (
                  <div key={reply.id} className={`p-3.5 rounded-lg shadow-sm ${reply.senderId === user?.uid ? (darkMode ? 'bg-blue-700/40' : 'bg-blue-50') : (darkMode ? 'bg-slate-600/50' : 'bg-slate-100')}`}>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{reply.senderName || (reply.senderId === 'admin' || reply.senderName === "Zespół Wsparcia" ? 'Zespół Wsparcia' : 'Użytkownik')}</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200 mt-1">{reply.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-right">{reply.createdAt?.toDate().toLocaleString('pl-PL')}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm italic text-slate-500 dark:text-slate-400">Brak odpowiedzi.</p>
              )}
            </div>

            <div className="mt-auto pt-4 border-t dark:border-slate-700">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Wpisz swoją odpowiedź..."
                className={`w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 outline-none resize-none transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 placeholder-slate-500'}`}
                rows="3"
              />
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                {isAdmin && (
                  <div className="w-full sm:w-auto">
                     <select
                        value={viewingTicket.status}
                        onChange={(e) => handleStatusChange(viewingTicket.id, e.target.value)}
                        className={`w-full sm:w-auto p-2.5 rounded-md text-sm transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 hover:border-slate-500' : 'bg-white border-slate-300 hover:border-slate-400'} focus:ring-2 focus:ring-orange-500 outline-none`}
                    >
                        <option value="Oczekujące">Oczekujące</option>
                        <option value="W trakcie">W trakcie</option>
                        <option value="Odpowiedziano">Odpowiedziano</option>
                        <option value="Rozwiązane">Rozwiązane</option>
                        <option value="Zamknięte">Zamknięte</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={handlePostReply}
                  disabled={!replyMessage.trim()}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                    ${darkMode ? 'bg-orange-600 hover:bg-orange-500 text-white disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed' 
                               : 'bg-orange-500 hover:bg-orange-600 text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed'}`}
                >
                  Wyślij odpowiedź <Send className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Komponenty pomocnicze
const Card = ({ children, className = '', interactive = false }) => (
  <div className={`rounded-xl shadow-lg p-6 transition-all duration-300 
    ${darkMode ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-white/80 border border-orange-100/80 backdrop-blur-sm'} 
    ${interactive ? (darkMode ? 'hover:bg-slate-700/70 hover:shadow-orange-500/10' : 'hover:shadow-orange-300/30 hover:border-orange-200') : ''}
    ${interactive ? 'hover:shadow-xl hover:-translate-y-1' : ''}
    ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children, icon }) => (
  <div className="mb-8 sm:mb-10 lg:mb-12 text-center">
    <h2 className="text-3xl sm:text-4xl font-extrabold flex items-center justify-center text-orange-600 dark:text-orange-400 tracking-tight">
      {icon && React.cloneElement(icon, { className: "w-7 h-7 sm:w-8 sm:h-8 mr-3 opacity-80" })}
      {children}
    </h2>
    <div className="mt-3 h-1 w-24 bg-orange-400 dark:bg-orange-500 mx-auto rounded-full"></div>
  </div>
);

// Placeholder components for sections (expand these)
function HomeSection({ announcements, stats, setActiveSection }) {
  const latestAnnouncement = announcements[0];
  return (
    <div className="space-y-12 md:space-y-16">
      <Card className="text-center !p-0 overflow-hidden shadow-2xl dark:!bg-slate-800">
        <div className="relative">
            <img 
                src="https://placehold.co/1200x450/A27B5C/FFFFFF?text=Witaj+na+NazwaSerwera!&font=montserrat" 
                alt="Server Banner" 
                className="w-full h-56 sm:h-72 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 sm:mb-4 tracking-tight drop-shadow-lg">
                Witaj na <span className="text-orange-400">NazwaSerwera</span>!
                </h1>
                <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto drop-shadow-md">
                Dołącz do naszej społeczności i przeżyj niezapomniane przygody. Czekają na Ciebie unikalne eventy, wspaniała atmosfera i pomocna administracja.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900">
                    Dołącz do Gry! (IP: mc.twojserwer.pl)
                </button>
                <button 
                    onClick={() => window.open('https://discord.gg/yourserver', '_blank')}
                    className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center"
                >
                    Dołącz na Discord <ExternalLink className="inline w-5 h-5 ml-2"/>
                </button>
                </div>
            </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {stats.map(stat => (
          <Card key={stat.id} className="text-center" interactive>
            <p className="text-4xl sm:text-5xl font-bold text-orange-500 dark:text-orange-400 mb-2">{stat.value}</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">{stat.label}</p>
          </Card>
        ))}
      </div>

      {latestAnnouncement && (
        <div>
          <SectionTitle icon={<Newspaper />}>Najnowsze Ogłoszenie</SectionTitle>
          <Card className="group" interactive>
            {latestAnnouncement.image && <img src={latestAnnouncement.image} alt={latestAnnouncement.title} className="w-full h-56 sm:h-64 object-cover rounded-t-lg mb-4 group-hover:opacity-90 transition-opacity duration-300"/>}
            <div className="p-2">
                <h3 className="text-2xl font-semibold mb-2 text-orange-600 dark:text-orange-400 group-hover:text-orange-500 dark:group-hover:text-orange-300 transition-colors">{latestAnnouncement.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Opublikowano: {new Date(latestAnnouncement.date).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-slate-700 dark:text-slate-300 mb-4 text-ellipsis line-clamp-3">{latestAnnouncement.content}</p>
                <button onClick={() => setActiveSection('news')} className="text-orange-500 dark:text-orange-400 hover:underline font-semibold flex items-center group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                Czytaj więcej <ExternalLink className="inline w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function NewsSection({ announcements, handleEditContent, handleDeleteContent }) {
  const { darkMode } = useDarkMode(); // Assuming a context or prop for darkMode

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<Newspaper />}>Aktualności i Ogłoszenia</SectionTitle>
      {announcements.length > 0 ? announcements.map(ann => (
        <Card key={ann.id} className="group relative" interactive={!handleEditContent}>
          {ann.image && <img src={ann.image} alt={ann.title} className="w-full h-56 sm:h-64 object-cover rounded-t-lg mb-4 group-hover:opacity-90 transition-opacity duration-300"/>}
          <div className="p-2">
            <h3 className="text-2xl font-semibold mb-2 text-orange-600 dark:text-orange-400">{ann.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Opublikowano: {new Date(ann.date).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
          </div>
          {handleEditContent && handleDeleteContent && (
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEditContent(ann)} className={`p-2 rounded-full ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-blue-400' : 'bg-slate-100 hover:bg-slate-200 text-blue-600'}`} title="Edytuj"><Edit3 size={18}/></button>
              <button onClick={() => handleDeleteContent(ann.id)} className={`p-2 rounded-full ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-red-400' : 'bg-slate-100 hover:bg-slate-200 text-red-600'}`} title="Usuń"><Trash2 size={18}/></button>
            </div>
          )}
        </Card>
      )) : <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-lg">Brak aktualnych ogłoszeń. Sprawdź później!</p>}
    </div>
  );
}

function TeamSection({ teamMembers }) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<Users />}>Nasza Ekipa</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {teamMembers.map(member => (
          <Card key={member.id} className="text-center flex flex-col items-center py-8" interactive>
            <img src={member.avatar} alt={member.name} className="w-28 h-28 rounded-full mb-5 shadow-lg border-4 border-orange-300 dark:border-orange-500 object-cover"/>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{member.name}</h3>
            <p className="text-orange-500 dark:text-orange-400 font-medium">{member.role}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RulesSection() {
  const rulesContent = [
    { title: "§1 Zasady Ogólne", points: ["Szanuj innych graczy, administrację oraz ich pracę.", "Zakaz używania wulgaryzmów, obraźliwych treści oraz mowy nienawiści.", "Zakaz spamowania, floodowania oraz nadmiernego używania CAPSLOCKA na czatach.", "Reklamowanie innych serwerów, stron czy usług jest surowo zabronione."] },
    { title: "§2 Rozgrywka", points: ["Zakaz używania cheatów, hacków, skryptów oraz modyfikacji dających nieuczciwą przewagę (np. X-Ray).", "Zakaz griefowania, kradzieży oraz niszczenia cudzych budowli bez wyraźnej zgody właściciela.", "Nie wykorzystuj błędów gry (bugów) na swoją korzyść. Każdy znaleziony błąd należy niezwłocznie zgłosić administracji.", "AFK farming (np. na mob grinderach) jest dozwolony w ograniczonym zakresie. Długotrwałe sesje mogą skutkować interwencją."] },
    { title: "§3 Budowanie i Teren", points: ["Nie buduj wulgarnych, obraźliwych lub nieestetycznych konstrukcji.", "Zachowaj porządek na mapie. Unikaj tworzenia 'dziur', 'słupów 1x1' itp.", "Nie niszcz naturalnego krajobrazu w sposób nadmierny bez celu (np. masowe wypalanie lasów).", "Budowanie w pobliżu spawnu lub innych ważnych miejsc publicznych może wymagać zgody administracji."] },
    { title: "§4 Handel i Ekonomia", points: ["Zakaz oszukiwania podczas handlu z innymi graczami.", "Nie proś administracji ani innych graczy o darmowe przedmioty (tzw. żebractwo).", "Używanie zautomatyzowanych systemów do handlu (np. botów) jest zabronione.", "Administracja nie ponosi odpowiedzialności za straty wynikłe z oszustw między graczami, ale dołoży starań, by ukarać winnych."] },
    { title: "§5 Postanowienia Końcowe", points: ["Nieznajomość regulaminu nie zwalnia z obowiązku jego przestrzegania.", "Administracja zastrzega sobie prawo do zmiany regulaminu w dowolnym momencie, informując o tym graczy.", "Decyzje administracji są ostateczne i niepodważalne.", "W sprawach nieuregulowanych w regulaminie, ostateczną decyzję podejmuje Administrator Główny."] },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<Shield />}>Regulamin Serwera</SectionTitle>
      <Card className="!p-6 sm:!p-8">
        <p className="mb-6 text-slate-700 dark:text-slate-300 text-center text-lg">
          Prosimy o dokładne zapoznanie się z poniższym regulaminem. Gra na serwerze oznacza jego akceptację.
        </p>
        {rulesContent.map((category, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-orange-600 dark:text-orange-400">{category.title}</h3>
            <ul className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 pl-4 text-base">
              {category.points.map((point, pIndex) => (
                <li key={pIndex}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-8 font-semibold text-red-600 dark:text-red-400 text-center text-lg border-t dark:border-slate-700 pt-6">
          Łamanie regulaminu może skutkować ostrzeżeniem, tymczasowym lub permanentnym banem, w zależności od wagi przewinienia.
        </p>
      </Card>
    </div>
  );
}

function ShopSection({ items }) {
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<ShoppingCart />}>Sklep Premium</SectionTitle>
      <p className="text-center text-slate-700 dark:text-slate-300 mb-8 text-lg max-w-3xl mx-auto">
        Wspomóż rozwój serwera, kupując przedmioty i rangi w naszym sklepie! Każdy zakup jest dobrowolny i bezpośrednio wspiera utrzymanie oraz rozwój serwera. Dziękujemy za Twoje wsparcie!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {items.map(item => (
          <Card key={item.id} className="flex flex-col items-center text-center group !p-0 overflow-hidden" interactive>
            <div className={`w-full py-8 transition-colors duration-300 ${darkMode ? 'bg-slate-700/50 group-hover:bg-slate-700' : 'bg-orange-50 group-hover:bg-orange-100'}`}>
              <div className={`mx-auto p-4 rounded-full mb-4 group-hover:scale-110 transition-transform inline-block ${darkMode ? 'bg-slate-600' : 'bg-white shadow-md'}`}>
                {React.cloneElement(item.icon, {className: "w-10 h-10 sm:w-12 sm:h-12"})}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow w-full">
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">{item.name}</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-500 dark:text-orange-400 mb-3">{item.price}</p>
              <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm sm:text-base flex-grow">{item.description}</p>
              <button className="mt-auto w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800">
                Kup Teraz
              </button>
            </div>
          </Card>
        ))}
      </div>
       <Card className="mt-12 text-center">
        <h4 className="text-xl font-semibold mb-3 text-slate-700 dark:text-slate-200">Akceptowane Metody Płatności</h4>
        <p className="text-slate-600 dark:text-slate-400 mb-5">Akceptujemy popularne metody płatności, w tym Przelew Bankowy, BLIK, PayPal, oraz Paysafecard (PSC).</p>
        <div className="flex justify-center items-center space-x-4 sm:space-x-6 flex-wrap gap-y-3">
          <img src="https://placehold.co/80x50/E2E8F0/64748B?text=BLIK&font=roboto" alt="BLIK" title="BLIK" className="h-10 sm:h-12 rounded-md shadow-sm"/>
          <img src="https://placehold.co/80x50/E2E8F0/64748B?text=PayPal&font=roboto" alt="PayPal" title="PayPal" className="h-10 sm:h-12 rounded-md shadow-sm"/>
          <img src="https://placehold.co/80x50/E2E8F0/64748B?text=PSC&font=roboto" alt="PSC" title="Paysafecard" className="h-10 sm:h-12 rounded-md shadow-sm"/>
          <img src="https://placehold.co/80x50/E2E8F0/64748B?text=Przelew&font=roboto" alt="Przelew Bankowy" title="Przelew Bankowy" className="h-10 sm:h-12 rounded-md shadow-sm"/>
        </div>
      </Card>
    </div>
  );
}

function RankingSection() {
  const rankingData = [
    { rank: 1, name: 'GraczArcymistrz', score: 10500, avatar: 'https://placehold.co/40x40/F2A057/1E293B?text=GA&font=roboto' },
    { rank: 2, name: 'MistrzPvP', score: 9800, avatar: 'https://placehold.co/40x40/86BBD8/1E293B?text=MP&font=roboto' },
    { rank: 3, name: 'BudowniczyPro', score: 9200, avatar: 'https://placehold.co/40x40/90C695/1E293B?text=BP&font=roboto' },
    { rank: 4, name: 'NowyAleDobry', score: 8500, avatar: 'https://placehold.co/40x40/A27B5C/FFFFFF?text=ND&font=roboto' },
    { rank: 5, name: 'LegendaSerwera', score: 8000, avatar: 'https://placehold.co/40x40/A27B5C/FFFFFF?text=LS&font=roboto' },
    { rank: 6, name: 'CichyZabójca', score: 7500, avatar: 'https://placehold.co/40x40/A27B5C/FFFFFF?text=CZ&font=roboto' },
    { rank: 7, name: 'FarmerXXL', score: 7200, avatar: 'https://placehold.co/40x40/A27B5C/FFFFFF?text=FX&font=roboto' },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<BarChart2 />}>Ranking Graczy</SectionTitle>
      <Card className="overflow-x-auto !p-0 md:!p-2">
        <table className="w-full min-w-[600px] text-left">
          <thead className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="p-3 sm:p-4 font-semibold text-slate-700 dark:text-slate-300 text-center w-16">#</th>
              <th className="p-3 sm:p-4 font-semibold text-slate-700 dark:text-slate-300">Gracz</th>
              <th className="p-3 sm:p-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Punkty</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map(player => (
              <tr key={player.rank} className="border-b dark:border-slate-700/70 last:border-b-0 hover:bg-orange-50/70 dark:hover:bg-slate-700/50 transition-colors duration-150">
                <td className="p-3 sm:p-4 text-center">
                  <span className={`font-bold text-lg ${
                    player.rank === 1 ? 'text-yellow-500 dark:text-yellow-400' : 
                    player.rank === 2 ? 'text-slate-500 dark:text-slate-400' : 
                    player.rank === 3 ? 'text-orange-700 dark:text-orange-500' : 
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {player.rank}
                  </span>
                </td>
                <td className="p-3 sm:p-4 flex items-center">
                  <img src={player.avatar} alt={player.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full mr-3 sm:mr-4 border-2 border-slate-200 dark:border-slate-600 shadow-sm"/>
                  <span className="font-medium text-slate-800 dark:text-slate-100 text-sm sm:text-base">{player.name}</span>
                </td>
                <td className="p-3 sm:p-4 text-right font-semibold text-green-600 dark:text-green-400 text-sm sm:text-base">{player.score.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">Ranking jest aktualizowany co godzinę. Powodzenia!</p>
    </div>
  );
}

function LoreSection() {
  const loreChapters = [
    { title: "Początek Świata Aethelgard", content: "Dawno, dawno temu, gdy gwiazdy były młode, a magia wszechobecna, starożytni bogowie zstąpili z niebios, by ukształtować Aethelgard – krainę pełną cudów, tajemnic i niebezpieczeństw. Pierwsze rasy – dumni ludzie, mądrzy elfowie i pracowite krasnoludy – stąpały po tej ziemi, budując cywilizacje, które miały przetrwać wieki, pozostawiając po sobie echa w ruinach i legendach.", image: "https://placehold.co/700x350/A27B5C/FFFFFF?text=Aethelgard%3A+Pocz%C4%85tek&font=lora" },
    { title: "Wielka Wojna Cieni", content: "Jednakże złoty wiek pokoju nie trwał wiecznie. Z najmroczniejszych otchłani, gdzie nie docierało światło gwiazd, powstały mroczne siły dowodzone przez Władcę Cieni. Pragnęły one pogrążyć Aethelgard w wiecznym chaosie i ciemności. Rozpoczęła się Wielka Wojna Cieni, konflikt, który na zawsze zmienił oblicze świata, zmuszając wszystkie rasy do zjednoczenia się przeciwko wspólnemu wrogowi.", image: "https://placehold.co/700x350/714429/EBD9B4?text=Wielka+Wojna+Cieni&font=lora" },
    { title: "Era Bohaterów i Nowa Nadzieja", content: "Po latach wyniszczającej wojny, dzięki poświęceniu bohaterów i sojuszowi ras, Władca Cieni został pokonany, a jego armie rozbite. Nastała Era Bohaterów. Odważni poszukiwacze przygód, potężni magowie i zręczni wojownicy przemierzali odrodzoną krainę, odkrywając zapomniane tajemnice, odbudowując zniszczone miasta i walcząc z pozostałościami mroku, które wciąż czaiły się w ukryciu. To czas, w którym każdy może stać się legendą.", image: "https://placehold.co/700x350/DBC0A2/714429?text=Era+Bohater%C3%B3w&font=lora" },
  ];
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<BookOpen />}>Historia Świata (Lore)</SectionTitle>
      {loreChapters.map((chapter, index) => (
        <Card key={index} className="group !p-0 overflow-hidden" interactive>
          {chapter.image && <img src={chapter.image} alt={chapter.title} className="w-full h-56 sm:h-64 md:h-72 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"/>}
          <div className="p-6">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-3 text-orange-600 dark:text-orange-400">{chapter.title}</h3>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-base sm:text-lg">{chapter.content}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SupportSection({ user, ticketSubject, setTicketSubject, ticketMessage, setTicketMessage, handleCreateTicket, userTickets, viewTicketDetails }) {
  const { darkMode } = useDarkMode(); // Assuming a context or prop for darkMode
  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<MessageSquare />}>Centrum Pomocy (Support)</SectionTitle>
      {user ? (
        <>
          <Card className="!p-6 sm:!p-8">
            <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-slate-800 dark:text-slate-100">Utwórz nowe zgłoszenie</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Temat zgłoszenia (np. Problem z logowaniem, Błąd w grze)"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 outline-none transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 placeholder-slate-500'}`}
              />
              <textarea
                placeholder="Opisz swój problem jak najdokładniej. Podaj wszelkie istotne informacje, takie jak czas wystąpienia problemu, co robiłeś/aś przed jego pojawieniem się, oraz ewentualne komunikaty błędów."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows="6"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 outline-none resize-none transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 placeholder-slate-500'}`}
              />
              <button
                onClick={handleCreateTicket}
                className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center text-base sm:text-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${darkMode ? 'focus:ring-offset-slate-800' : 'focus:ring-offset-white'}`}
              >
                Wyślij Zgłoszenie <Send className="w-5 h-5 ml-2.5" />
              </button>
            </div>
          </Card>

          <Card className="!p-6 sm:!p-8">
            <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-slate-800 dark:text-slate-100">Twoje zgłoszenia</h3>
            {userTickets.length > 0 ? (
              <ul className="space-y-3 sm:space-y-4">
                {userTickets.map(ticket => (
                  <li key={ticket.id} className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center transition-colors shadow-sm ${darkMode ? 'bg-slate-700/70 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-orange-600 dark:text-orange-400 truncate max-w-xs sm:max-w-md md:max-w-lg" title={ticket.subject}>{ticket.subject}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Status: <span className={`font-medium ${ticket.status === 'Oczekujące' ? 'text-yellow-600 dark:text-yellow-400' : ticket.status === 'Rozwiązane' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{ticket.status}</span> | Utworzono: {ticket.createdAt?.toDate().toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    <button onClick={() => viewTicketDetails(ticket.id)} className={`text-sm font-medium py-1.5 px-3 rounded-md transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                        Zobacz szczegóły
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-5">Nie masz żadnych aktywnych zgłoszeń. Jeśli potrzebujesz pomocy, utwórz nowe zgłoszenie powyżej.</p>
            )}
          </Card>
        </>
      ) : (
        <Card className="text-center !p-8 sm:!p-10">
          <Info className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-blue-500 dark:text-blue-400 mb-5" />
          <p className="text-lg sm:text-xl font-medium mb-3 text-slate-800 dark:text-slate-100">Zaloguj się, aby uzyskać pomoc!</p>
          <p className="text-slate-600 dark:text-slate-400 mb-5">Dostęp do systemu supportu, tworzenia zgłoszeń oraz przeglądania ich historii wymaga aktywnego konta na naszej stronie.</p>
          {/* Można dodać przycisk logowania bezpośrednio tutaj */}
        </Card>
      )}
    </div>
  );
}

function FaqSection({ items, openFaq, setOpenFaq }) {
  const { darkMode } = useDarkMode(); // Assuming a context or prop for darkMode
  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<HelpCircle />}>Najczęściej Zadawane Pytania (FAQ)</SectionTitle>
      <div className="space-y-3 sm:space-y-4">
        {items.map(item => (
          <Card key={item.id} className="!p-0 overflow-hidden shadow-md" interactive>
            <button
              onClick={() => toggleFaq(item.id)}
              className="w-full flex justify-between items-center p-5 sm:p-6 text-left focus:outline-none group"
            >
              <h3 className={`text-base sm:text-lg font-semibold transition-colors ${darkMode ? 'text-slate-100 group-hover:text-orange-400' : 'text-slate-800 group-hover:text-orange-600'}`}>{item.question}</h3>
              <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ease-in-out ${openFaq === item.id ? 'transform rotate-180' : ''} ${darkMode ? 'text-slate-400 group-hover:text-orange-400' : 'text-slate-500 group-hover:text-orange-500'}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === item.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className={`p-5 sm:p-6 border-t transition-colors ${darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-orange-100 bg-orange-50/30'}`}>
                <p className={`text-sm sm:text-base whitespace-pre-line leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.answer}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminPanel({ content, setContent, handleSaveContent, allContent, handleEditContent, handleDeleteContent, editingContent, setEditingContent, adminTickets, viewTicketDetails, handleStatusChange }) {
  const { darkMode } = useDarkMode(); // Assuming a context or prop for darkMode
  const [currentAdminView, setCurrentAdminView] = useState('content'); 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, [name]: value }));
  };

  const cancelEdit = () => {
    setEditingContent(null);
    setContent({ title: '', text: '', image: '', section: 'generic' });
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionTitle icon={<Settings />}>Panel Administratora</SectionTitle>

      <div className={`flex space-x-2 sm:space-x-4 mb-6 sm:mb-8 border-b pb-1 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          onClick={() => setCurrentAdminView('content')}
          className={`py-2.5 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-t-md transition-colors ${currentAdminView === 'content' ? (darkMode ? 'border-b-2 border-orange-500 text-orange-400 bg-slate-700/50' : 'border-b-2 border-orange-500 text-orange-600 bg-orange-50/70') : (darkMode ? 'text-slate-400 hover:text-orange-400 hover:bg-slate-700/30' : 'text-slate-500 hover:text-orange-500 hover:bg-slate-100/70')}`}
        >
          Zarządzaj Treścią ({allContent.length})
        </button>
        <button
          onClick={() => setCurrentAdminView('tickets')}
          className={`py-2.5 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-t-md transition-colors ${currentAdminView === 'tickets' ? (darkMode ? 'border-b-2 border-orange-500 text-orange-400 bg-slate-700/50' : 'border-b-2 border-orange-500 text-orange-600 bg-orange-50/70') : (darkMode ? 'text-slate-400 hover:text-orange-400 hover:bg-slate-700/30' : 'text-slate-500 hover:text-orange-500 hover:bg-slate-100/70')}`}
        >
          Zgłoszenia Supportu ({adminTickets.length})
        </button>
      </div>

      {currentAdminView === 'content' && (
        <>
          <Card className="!p-6 sm:!p-8">
            <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-slate-800 dark:text-slate-100">{editingContent ? "Edytuj Istniejącą Treść" : "Dodaj Nową Treść"}</h3>
            <div className="space-y-4">
              <input type="text" name="title" placeholder="Tytuł (np. Ogłoszenie, Aktualizacja)" value={content.title} onChange={handleInputChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 placeholder-slate-500'}`} />
              <textarea name="text" placeholder="Treść (możesz używać Markdown dla formatowania)" value={content.text} onChange={handleInputChange} rows="8" className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-y transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 placeholder-slate-500'}`}></textarea>
              <input type="text" name="image" placeholder="URL obrazka (opcjonalnie, np. https://example.com/image.jpg)" value={content.image} onChange={handleInputChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 placeholder-slate-500'}`} />
              <select name="section" value={content.section || 'generic'} onChange={handleInputChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}>
                <option value="generic">Ogólne (np. dla strony głównej)</option>
                <option value="announcements">Ogłoszenia (dla sekcji Aktualności)</option>
                <option value="rules">Regulamin</option>
                <option value="lore">Lore</option>
                {/* Dodaj więcej sekcji, jeśli potrzebujesz */}
              </select>
              <div className="flex space-x-3 pt-2">
                <button onClick={handleSaveContent} className={`font-semibold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 ${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                  <Edit3 size={18} className="inline mr-2"/> {editingContent ? "Zapisz Zmiany" : "Dodaj Treść"}
                </button>
                {editingContent && (
                  <button onClick={cancelEdit} className={`font-semibold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-500 hover:bg-slate-600 text-white'}`}>
                    Anuluj
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card className="!p-6 sm:!p-8">
            <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-slate-800 dark:text-slate-100">Zarządzaj Istniejącymi Treściami</h3>
            {allContent.length > 0 ? (
              <ul className="space-y-3 sm:space-y-4">
                {allContent.map(item => (
                  <li key={item.id} className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center shadow-sm transition-colors ${darkMode ? 'bg-slate-700/70' : 'bg-slate-50'}`}>
                    <div className="mb-2 sm:mb-0 flex-grow">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title} <span className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{item.section || 'generic'}</span></p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md md:max-w-lg">{item.text}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ost. mod.: {item.updatedAt?.toDate().toLocaleDateString('pl-PL') || 'Brak danych'}</p>
                    </div>
                    <div className="space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                      <button onClick={() => handleEditContent(item)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`} title="Edytuj"><Edit3 size={18}/></button>
                      <button onClick={() => handleDeleteContent(item.id)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-600 text-red-400' : 'hover:bg-red-100 text-red-600'}`} title="Usuń"><Trash2 size={18}/></button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-5">Brak dodanych treści. Użyj formularza powyżej, aby dodać nową treść.</p>
            )}
          </Card>
        </>
      )}

      {currentAdminView === 'tickets' && (
         <Card className="!p-6 sm:!p-8">
            <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-slate-800 dark:text-slate-100">Wszystkie Zgłoszenia Supportu</h3>
            {adminTickets.length > 0 ? (
              <ul className="space-y-3 sm:space-y-4">
                {adminTickets.map(ticket => (
                  <li key={ticket.id} className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center shadow-sm transition-colors border-l-4 ${darkMode ? 'bg-slate-700/70 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'} 
                    ${ticket.status === 'Oczekujące' ? (darkMode ? 'border-yellow-500' : 'border-yellow-400') : ''}
                    ${ticket.status === 'W trakcie' ? (darkMode ? 'border-blue-500' : 'border-blue-400') : ''}
                    ${ticket.status === 'Odpowiedziano' ? (darkMode ? 'border-sky-500' : 'border-sky-400') : ''}
                    ${ticket.status === 'Rozwiązane' ? (darkMode ? 'border-green-500' : 'border-green-400') : ''}
                    ${ticket.status === 'Zamknięte' ? (darkMode ? 'border-slate-500' : 'border-slate-400') : ''}
                  `}>
                    <div className="mb-2 sm:mb-0 flex-grow">
                      <p className="font-semibold text-orange-600 dark:text-orange-400 truncate max-w-xs sm:max-w-md md:max-w-lg" title={ticket.subject}>{ticket.subject} <span className="text-xs text-slate-400 dark:text-slate-500">({ticket.userName || ticket.userEmail})</span></p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Status: <span className={`font-medium ${ticket.status === 'Oczekujące' ? 'text-yellow-600 dark:text-yellow-400' : ticket.status === 'Rozwiązane' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{ticket.status}</span> | Utworzono: {ticket.createdAt?.toDate().toLocaleDateString('pl-PL')}
                      </p>
                       <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 truncate max-w-xs sm:max-w-md md:max-w-lg">{ticket.message}</p>
                    </div>
                    <button onClick={() => viewTicketDetails(ticket.id)} className={`text-sm font-medium py-1.5 px-3 rounded-md transition-colors mt-2 sm:mt-0 ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                        Zobacz / Odpowiedz
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-5">Brak zgłoszeń do wyświetlenia.</p>
            )}
          </Card>
      )}
    </div>
  );
}

// Prosty hook/kontekst do zarządzania trybem ciemnym (można go rozbudować)
const DarkModeContext = React.createContext();

export function useDarkMode() {
  return React.useContext(DarkModeContext);
}

// Główny komponent App powinien dostarczać kontekst, jeśli jest używany w podkomponentach
// W tym przypadku, darkMode jest przekazywany jako prop lub używany bezpośrednio
// Dla uproszczenia, zakładam, że darkMode jest dostępne w każdym komponencie, który go potrzebuje
// (np. przez props drilling lub bardziej zaawansowany state management)

// W tym przykładzie, darkMode jest stanem w App, więc komponenty jak NewsSection
// musiałyby go otrzymać jako prop, np. <NewsSection announcements={announcements} darkMode={darkMode} />
// Aby uniknąć props drilling, można użyć Context API.
// Dla tego zadania, zmodyfikowałem komponenty, aby przyjmowały darkMode jako prop, jeśli to konieczne,
// lub używały klas warunkowych Tailwind bezpośrednio.
// W tym konkretnym przypadku, NewsSection nie potrzebuje bezpośrednio darkMode, bo klasy są w App.jsx.
// Jeśli jednak jakiś komponent potrzebowałby logiki JS zależnej od darkMode, to trzeba by go przekazać.

// Dodajmy prosty sposób na dostęp do darkMode w komponentach, jeśli to potrzebne:
// W App.jsx:
// const { darkMode } = useDarkMode(); // Jeśli używasz kontekstu
// Lub przekazuj jako prop: <MyComponent darkMode={darkMode} />

// Dla uproszczenia, zakładam, że darkMode jest dostępne globalnie lub przekazywane.
// W powyższych komponentach sekcji, klasy Tailwind są już warunkowe (dark:...),
// więc bezpośrednie przekazywanie `darkMode` jako prop nie jest zawsze konieczne dla stylizacji.


export default App;

// ... reszta kodu App.jsx

<style>
{`
/* Dodatkowe style dla paska przewijania w modalu i animacji */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255,255,255,0.2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slideDown {
  animation: slideDown 0.3s ease-out forwards;
}
`}
</style>
// ); // Jeśli <style> jest wewnątrz return() JSX
// lub po prostu po return(), jeśli <style> jest poza głównym return

// export default App; // Upewnij się, że App jest eksportowany