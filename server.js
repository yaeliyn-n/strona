    // server.js
    require('dotenv').config();

    console.log("--- DEBUG ZMIENNYCH ŚRODOWISKOWYCH (strona WWW) ---");
    console.log("Port strony (process.env.PORT):", process.env.PORT);
    console.log("URL API Bota (process.env.BOT_API_URL):", process.env.BOT_API_URL);
    console.log("Klucz API Bota (process.env.BOT_API_KEY):", process.env.BOT_API_KEY ? "Ustawiony" : "NIE USTAWIONY");
    console.log("ID Admina (process.env.ADMIN_DISCORD_ID):", process.env.ADMIN_DISCORD_ID);
    console.log("--- KONIEC DEBUG ---\n");

    const express = require('express');
    const session = require('express-session');
    const multer = require('multer'); // Import Multera
    const fetch = require('node-fetch'); // Dla CommonJS, upewnij się, że masz node-fetch@2
    const nodemailer = require('nodemailer');
    const path = require('path');
    const fs = require('fs');
    const crypto = require('crypto');

    // Import modeli Sequelize
    const SupportRequest = require('./models/SupportRequest');
    const SupportReply = require('./models/SupportReply');
    const Content = require('./models/Content');
    const Article = require('./models/Article');
    const Category = require('./models/Category'); // Import Category model
    const ArticleCategory = require('./models/ArticleCategory'); // Import ArticleCategory join table model
    const sequelize = require('./config/database');


    const app = express();
    const PORT = process.env.PORT || 5500;

    const BOT_API_URL = process.env.BOT_API_URL;
    const BOT_API_KEY = process.env.BOT_API_KEY;
    const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID;

    // Definicje asocjacji modeli Sequelize
    if (SupportRequest && SupportReply) {
        SupportRequest.hasMany(SupportReply, {
            foreignKey: 'ticketId',
            as: 'replies',
            onDelete: 'CASCADE'
        });
        SupportReply.belongsTo(SupportRequest, {
            foreignKey: 'ticketId',
            as: 'ticket'
        });
    }

    // Article and Category Associations
    if (Article && Category && ArticleCategory) {
        Article.belongsToMany(Category, { through: ArticleCategory });
        Category.belongsToMany(Article, { through: ArticleCategory });
    }


    // --- Middleware podstawowe ---
    app.use(session({
      secret: process.env.SESSION_SECRET || 'super_tajny_sekret_sesji_123!@#ABC_XYZ',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      }
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Konfiguracja Multera (musi być przed użyciem 'upload' w ścieżkach) ---
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`Utworzono folder uploads: ${uploadsDir}`);
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) { cb(null, uploadsDir); },
        filename: function (req, file, cb) {
            const safeFileName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
            cb(null, safeFileName);
        }
    });
    const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: function (req, file, cb) {
            const allowedTypes = /jpeg|jpg|png|gif/;
            const mimetype = allowedTypes.test(file.mimetype);
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) { return cb(null, true); }
            cb(new Error("Błąd: Dozwolone są tylko pliki graficzne (jpeg, jpg, png, gif)!"));
        }
    });
    // --- Koniec konfiguracji Multera ---

    // --- Funkcje pomocnicze ---
    function isAdmin(req) {
      return req.session?.user?.id === ADMIN_DISCORD_ID;
    }

    async function proxyToBotApi(req, res, botApiPath, method = 'GET', body = null, queryParams = {}) {
        if (!BOT_API_URL || !BOT_API_KEY) {
            console.error('API Bota nie jest skonfigurowane (BOT_API_URL lub BOT_API_KEY).');
            return res.status(500).json({ error: 'Integracja z botem nie jest skonfigurowana po stronie serwera WWW.' });
        }
        try {
            const url = new URL(`${BOT_API_URL}${botApiPath}`);
            if (method.toUpperCase() === 'GET') {
                Object.entries(req.query).forEach(([key, value]) => url.searchParams.append(key, value));
            }
            Object.entries(queryParams).forEach(([key, value]) => url.searchParams.append(key, value));
            console.log(`Proxy ${method}: Odpytywanie API bota: ${url.toString()}`);
            const fetchOptions = {
                method: method,
                headers: {
                    'X-API-Key': BOT_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            };
            if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'DELETE')) {
                fetchOptions.body = JSON.stringify(body);
            }
            const botApiResponse = await fetch(url.toString(), fetchOptions);
            const responseText = await botApiResponse.text();
            console.log(`Proxy: Odpowiedź z API bota (status ${botApiResponse.status}) dla ${botApiPath}:`, responseText.substring(0, 300) + (responseText.length > 300 ? "..." : ""));
            let jsonData;
            try {
                jsonData = JSON.parse(responseText);
            } catch(e) {
                if (botApiResponse.ok) {
                    console.warn(`Proxy: Odpowiedź z API bota dla ${botApiPath} nie jest JSON-em, ale status jest OK. Zwracam jako tekst.`);
                    return res.status(botApiResponse.status).type('text/plain').send(responseText);
                }
                console.error(`Proxy: Błąd parsowania JSON z API bota dla ${botApiPath}: ${e.message}. Response: ${responseText}`);
                return res.status(502).json({ error: 'Proxy: Błąd odpowiedzi od API bota (nieprawidłowy JSON).', details: responseText });
            }
            res.status(botApiResponse.status).json(jsonData);
        } catch (error) {
            console.error(`Proxy: Wewnętrzny błąd serwera strony podczas odpytywania ${botApiPath}:`, error);
            res.status(500).json({ error: `Proxy: Wystąpił wewnętrzny błąd serwera podczas próby komunikacji z API bota.`, details: error.message });
        }
    }

    async function handleSupportReplyLogic(req, res, ticketId, replyText, isActuallyAdmin) {
        const userId = req.session.user.id;
        const username = req.session.user.username;
        if (!replyText || replyText.trim() === '') {
            return res.status(400).json({ error: 'Treść odpowiedzi nie może być pusta.' });
        }
        try {
            const ticket = await SupportRequest.findOne({
                where: {
                    id: ticketId,
                    ...( !isActuallyAdmin && { discordUserId: userId } )
                }
            });
            if (!ticket) {
                return res.status(404).json({ error: 'Nie znaleziono zgłoszenia lub nie masz uprawnień do odpowiedzi.' });
            }
            if (['Rozwiązane', 'Zamknięte'].includes(ticket.status) && !isActuallyAdmin) {
                return res.status(403).json({ error: 'Nie można dodać odpowiedzi do zgłoszenia, które jest już rozwiązane lub zamknięte.' });
            }
            const newReply = await SupportReply.create({
                ticketId: ticket.id,
                discordUserId: userId,
                discordUsername: username,
                replyText: replyText,
                isAdminReply: isActuallyAdmin
            });
            if (!isActuallyAdmin && (ticket.status === 'Otwarte' || ticket.status === 'W trakcie')) {
                ticket.status = 'Oczekuje na odpowiedź';
                await ticket.save();
            } else if (isActuallyAdmin && (ticket.status === 'Otwarte' || ticket.status === 'Oczekuje na odpowiedź')) {
                 ticket.status = 'W trakcie';
                 await ticket.save();
            }
            if (!isActuallyAdmin && process.env.DISCORD_WEBHOOK_URL_SUPPORT) {
                await fetch(process.env.DISCORD_WEBHOOK_URL_SUPPORT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    content: `💬 Użytkownik **${username}** (ID: ${userId}) odpowiedział na zgłoszenie **#${ticket.id}** (${ticket.reportType}):\n>>> ${replyText.slice(0, 500)}`
                    })
                });
            }
            res.status(201).json({ message: 'Odpowiedź została dodana.', reply: newReply, ticketStatus: ticket.status });
        } catch (error) {
            console.error(`Błąd dodawania odpowiedzi do zgłoszenia #${ticketId}:`, error);
            res.status(500).json({ error: 'Wystąpił błąd serwera podczas dodawania odpowiedzi.' });
        }
    }

    // --- Funkcja do generowania sluga (zapewniająca unikalność) ---
    async function generateUniqueSlug(title, currentId = null) {
      if (!title) return '';
      let slug = title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');

      let count = 0;
      let originalSlug = slug;
      while (true) {
        const whereClause = { slug: slug };
        if (currentId) { // Jeśli aktualizujemy, wyklucz bieżący artykuł z wyszukiwania
          whereClause.id = { [require('sequelize').Op.ne]: currentId };
        }
        const existingArticle = await Article.findOne({ where: whereClause });
        if (!existingArticle) {
          break;
        }
        count++;
        slug = `${originalSlug}-${count}`;
      }
      return slug;
    }

    async function generateUniqueCategorySlug(name, currentId = null) {
      if (!name) return '';
      let slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\wąćęłńóśźż-]+/g, '') // Allow Polish characters
        .replace(/--+/g, '-');

      let count = 0;
      let originalSlug = slug;
      while (true) {
        const whereClause = { slug: slug };
        if (currentId) {
          whereClause.id = { [require('sequelize').Op.ne]: currentId };
        }
        const existingCategory = await Category.findOne({ where: whereClause });
        if (!existingCategory) {
          break;
        }
        count++;
        slug = `${originalSlug}-${count}`;
      }
      return slug;
    }


    // --- Ścieżki API (powinny być zdefiniowane przed ogólnymi handlerami plików statycznych) ---

    // --- API Artykułów (Publiczne) ---
    app.get('/api/articles', async (req, res) => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const categorySlug = req.query.category;

        let queryOptions = {
            where: { status: 'published' },
            order: [
                ['publishedAt', 'DESC'],
                ['createdAt', 'DESC']
            ],
            limit: limit,
            offset: offset,
            attributes: ['title', 'slug', 'authorName', 'publishedAt', 'content', 'createdAt'],
            include: [{
                model: Category,
                attributes: ['id', 'name', 'slug'],
                through: { attributes: [] } // Nie pobieraj danych z tabeli pośredniczącej
            }]
        };

        if (categorySlug) {
            queryOptions.include[0].where = { slug: categorySlug };
            queryOptions.include[0].required = true; // INNER JOIN
        }

        try {
            const { count, rows } = await Article.findAndCountAll(queryOptions);

            const articles = rows.map(article => ({
                title: article.title,
                slug: article.slug,
                authorName: article.authorName,
                publishedAt: article.publishedAt || article.createdAt,
                snippet: article.content.substring(0, 200) + (article.content.length > 200 ? '...' : ''),
                Categories: article.Categories // Kategorie są teraz dołączane
            }));

            res.json({
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalArticles: count,
                articles: articles
            });
        } catch (error) {
            console.error('Błąd podczas pobierania opublikowanych artykułów:', error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania artykułów.' });
        }
    });

    app.get('/api/articles/:slug', async (req, res) => {
        try {
            const article = await Article.findOne({
                where: {
                    slug: req.params.slug,
                    status: 'published'
                },
                include: [{ // Dołącz kategorie do pojedynczego artykułu
                    model: Category,
                    attributes: ['id', 'name', 'slug'],
                    through: { attributes: [] }
                }]
            });

            if (!article) {
                return res.status(404).json({ error: 'Artykuł nie został znaleziony lub nie jest opublikowany.' });
            }
            res.json(article);
        } catch (error) {
            console.error(`Błąd podczas pobierania artykułu o slugu ${req.params.slug}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania artykułu.' });
        }
    });

    // --- API Kategorii (Publiczne) ---
    app.get('/api/categories', async (req, res) => {
        try {
            const categories = await Category.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'slug']
            });
            res.json(categories);
        } catch (error) {
            console.error('Błąd pobierania publicznej listy kategorii:', error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania kategorii.' });
        }
    });


    // --- Pozostałe ścieżki API ---
    app.get('/auth/discord/login', (req, res) => {
      const redirectPath = req.query.redirect || '/profil.html';
      req.session.redirectTo = redirectPath;
      const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify email'
      });
      res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    });

    app.get('/auth/discord/callback', async (req, res) => {
      const code = req.query.code;
      if (!code) {
        return res.status(400).send('Brak kodu autoryzacyjnego w zapytaniu.');
      }
      try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI
          })
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            console.error("Błąd uzyskiwania tokenu Discord:", tokenData);
            return res.status(500).send(`Błąd podczas uzyskiwania tokenu Discord: ${tokenData.error_description || tokenData.error}`);
        }
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResponse.json();
        if (userData.message) {
            console.error("Błąd pobierania danych użytkownika Discord:", userData);
            return res.status(500).send(`Błąd podczas pobierania danych użytkownika Discord: ${userData.message}`);
        }
        req.session.user = {
          id: userData.id,
          username: `${userData.username}${userData.discriminator === "0" || userData.discriminator === null ? "" : `#${userData.discriminator}`}`,
          email: userData.email,
          avatar: userData.avatar
        };
        console.log("Użytkownik zalogowany:", req.session.user);

        const redirectTo = req.session.redirectTo || (isAdmin(req) ? '/admin.html' : '/profil.html');
        delete req.session.redirectTo;
        res.redirect(redirectTo);

      } catch (error) {
        console.error('Krytyczny błąd podczas Discord OAuth callback:', error);
        res.status(500).send('Wystąpił krytyczny błąd podczas logowania przez Discord.');
      }
    });

    app.get('/api/me', (req, res) => {
      if (req.session.user) {
        res.json(req.session.user);
      } else {
        res.status(401).json({ error: 'Unauthorized - Brak sesji użytkownika' });
      }
    });

    app.post('/auth/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
            console.error("Błąd wylogowania:", err);
            return res.status(500).json({ error: 'Błąd podczas wylogowywania' });
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    });

    // Proxy do API bota Discord
    app.get('/api/bot-stats/:discordUserId', (req, res) => {
        proxyToBotApi(req, res, `/api/user_stats/${req.params.discordUserId}`);
    });
    app.get('/api/web/server-stats', (req, res) => {
        proxyToBotApi(req, res, '/api/server_stats');
    });
    app.get('/api/web/ranking/xp', (req, res) => {
        proxyToBotApi(req, res, '/api/ranking/xp');
    });
    app.get('/api/web/ranking/currency', (req, res) => {
        proxyToBotApi(req, res, '/api/ranking/currency');
    });
    app.get('/api/web/ranking/premium_currency', (req, res) => {
        proxyToBotApi(req, res, '/api/ranking/premium_currency');
    });
    app.get('/api/web/ranking/messages', (req, res) => {
        proxyToBotApi(req, res, '/api/ranking/messages');
    });
    app.get('/api/web/ranking/voicetime', (req, res) => {
        proxyToBotApi(req, res, '/api/ranking/voicetime');
    });
    app.get('/api/web/shop/items', (req, res) => {
        proxyToBotApi(req, res, '/api/shop/items', 'GET');
    });
    app.post('/api/web/shop/buy/:itemId', async (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby dokonać zakupu.' });
        }
        const { currency_type } = req.body;
        const botApiBody = {
            discord_user_id: req.session.user.id,
            currency_type: currency_type || 'dukaty'
        };
        proxyToBotApi(req, res, `/api/shop/buy/${req.params.itemId}`, 'POST', botApiBody);
    });

    // Auction house API proxy routes
    app.get('/api/web/auctions', (req, res) => {
        proxyToBotApi(req, res, '/api/auctions', 'GET');
    });
    app.post('/api/web/auctions', (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby utworzyć aukcję.' });
        }
        const body = Object.assign({}, req.body, { discord_user_id: req.session.user.id });
        proxyToBotApi(req, res, '/api/auctions', 'POST', body);
    });
    app.post('/api/web/auctions/:auctionId/bid', (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby licytować.' });
        }
        const body = Object.assign({}, req.body, { discord_user_id: req.session.user.id });
        proxyToBotApi(req, res, `/api/auctions/${req.params.auctionId}/bid`, 'POST', body);
    });
    app.get('/api/bot-inventory/:discordUserId', (req, res) => {
        proxyToBotApi(req, res, `/api/user_inventory/${req.params.discordUserId}`);
    });
    app.get('/api/web/premium/packages', (req, res) => {
        proxyToBotApi(req, res, '/api/premium/packages', 'GET');
    });
    app.post('/api/web/premium/initiate_purchase/:packageId', async (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby "zakupić" kryształy.' });
        }
        const { packageId } = req.params;
        const userId = req.session.user.id;
        const simulatedTransactionId = `WEB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const botApiBody = {
            discord_user_id: userId,
            transaction_id: simulatedTransactionId
        };
        proxyToBotApi(req, res, `/api/premium/finalize_purchase/${packageId}`, 'POST', botApiBody);
    });

    // Proxy dla ostrzeżeń, misji i osiągnięć
    app.get('/api/warnings/list/:guildId/:discordUserId', (req, res) => {
        proxyToBotApi(req, res, `/api/warnings/list/${req.params.guildId}/${req.params.discordUserId}`);
    });
    app.post('/api/warnings/add', (req, res) => { // Proxy dla dodawania ostrzeżeń
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, '/api/warnings/add', 'POST', req.body);
    });
    app.delete('/api/warnings/remove', (req, res) => { // Proxy dla usuwania ostrzeżeń
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, '/api/warnings/remove', 'DELETE', req.body);
    });

    app.get('/api/missions/progress/:guildId/:discordUserId', (req, res) => {
        proxyToBotApi(req, res, `/api/missions/progress/${req.params.guildId}/${req.params.discordUserId}`);
    });
    app.get('/api/missions/completed/:guildId/:discordUserId', (req, res) => {
        proxyToBotApi(req, res, `/api/missions/completed/${req.params.guildId}/${req.params.discordUserId}`);
    });
    app.get('/api/user_achievements/:guildId/:discordUserId', (req, res) => {
        proxyToBotApi(req, res, `/api/user_achievements/${req.params.guildId}/${req.params.discordUserId}`);
    });


    // Support Tickets API (obsługiwane przez ten serwer Node.js)
    app.get('/api/support/my-tickets', async (req, res) => {
      if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: 'Unauthorized - Musisz być zalogowany, aby zobaczyć swoje zgłoszenia.' });
      }
      try {
        const userTickets = await SupportRequest.findAll({
          where: { discordUserId: req.session.user.id },
          order: [['createdAt', 'DESC']]
        });
        const ticketsToSend = userTickets.map(ticket => ({
            id: ticket.id,
            reportType: ticket.reportType,
            description: ticket.description.substring(0, 150) + (ticket.description.length > 150 ? '...' : ''),
            status: ticket.status,
            createdAt: ticket.createdAt,
            attachment: ticket.attachment ? true : false
        }));
        res.json(ticketsToSend);
      } catch (error) {
        console.error(`Błąd podczas pobierania zgłoszeń wsparcia dla użytkownika ${req.session.user.id}:`, error);
        res.status(500).json({ error: 'Wystąpił błąd serwera podczas pobierania Twoich zgłoszeń.' });
      }
    });
    app.get('/api/support/ticket/:ticketId', async (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby zobaczyć to zgłoszenie.' });
        }
        const { ticketId } = req.params;
        try {
            const ticket = await SupportRequest.findOne({
                where: {
                    id: ticketId,
                    ...( !isAdmin(req) && { discordUserId: req.session.user.id } )
                },
                include: [{
                    model: SupportReply,
                    as: 'replies',
                    order: [['createdAt', 'ASC']]
                }]
            });
            if (!ticket) {
                return res.status(404).json({ error: 'Nie znaleziono zgłoszenia lub nie masz do niego dostępu.' });
            }
            res.json(ticket);
        } catch (error) {
            console.error(`Błąd pobierania zgłoszenia #${ticketId}:`, error);
            res.status(500).json({ error: 'Wystąpił błąd serwera podczas pobierania zgłoszenia.' });
        }
    });
    app.post('/api/support/ticket/:ticketId/reply', async (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby odpowiedzieć na zgłoszenie.' });
        }
        const { ticketId } = req.params;
        const { replyText } = req.body;
        await handleSupportReplyLogic(req, res, ticketId, replyText, isAdmin(req));
    });

    app.post('/api/support/submit', upload.single('attachment'), async (req, res) => {
      const { email, reportType, description } = req.body;
      const attachment = req.file;
      let discordUsernameToLog = "Niezalogowany/Anonim";
      let discordUserIdToLog = null;
      if (req.session.user) {
        discordUsernameToLog = req.session.user.username;
        discordUserIdToLog = req.session.user.id;
      } else {
        return res.status(401).json({ error: 'Musisz być zalogowany przez Discord, aby wysłać zgłoszenie.' });
      }
      if (!description || description.trim() === '') {
        return res.status(400).json({ error: 'Opis jest wymagany.' });
      }
      if (!reportType || reportType.trim() === '') {
        return res.status(400).json({ error: 'Rodzaj zgłoszenia jest wymagany.' });
      }
      try {
        const supportRequest = await SupportRequest.create({
          discordUserId: discordUserIdToLog,
          discordUsername: discordUsernameToLog,
          email,
          reportType,
          description,
          attachment: attachment ? path.basename(attachment.path) : null,
          status: 'Otwarte'
        });
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_TO_SUPPORT) {
            const transporter = nodemailer.createTransport({
              host: process.env.EMAIL_HOST,
              port: parseInt(process.env.EMAIL_PORT || "587", 10),
              secure: (process.env.EMAIL_PORT === '465'),
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
              tls: { rejectUnauthorized: (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false') }
            });
            await transporter.sendMail({
              from: `"Wsparcie Kronik Elary" <${process.env.EMAIL_USER}>`,
              to: process.env.EMAIL_TO_SUPPORT,
              subject: `Nowe zgłoszenie wsparcia #${supportRequest.id}: ${reportType} od ${discordUsernameToLog}`,
              text: `Nowe zgłoszenie #${supportRequest.id} od: ${discordUsernameToLog} (ID: ${discordUserIdToLog || 'brak'})\nEmail: ${email || 'brak'}\nTyp: ${reportType}\nOpis:\n${description}${attachment ? `\nZałącznik: ${attachment.originalname}` : ''}`,
              attachments: attachment ? [{ filename: attachment.originalname, path: attachment.path }] : []
            });
            console.log("Wiadomość email o zgłoszeniu wysłana.");
        } else { console.warn("Konfiguracja email nie jest kompletna lub brakuje EMAIL_TO_SUPPORT. Pomijam wysyłanie emaila."); }
        if (process.env.DISCORD_WEBHOOK_URL_SUPPORT) {
            await fetch(process.env.DISCORD_WEBHOOK_URL_SUPPORT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                content: `🆘 Nowe zgłoszenie wsparcia **#${supportRequest.id}**\n**Użytkownik:** ${discordUsernameToLog} (ID: ${discordUserIdToLog || 'brak'})\n**Typ:** ${reportType}\n**Opis:** ${description.slice(0, 500)}${attachment ? `\n📎 Załącznik: ${attachment.originalname}` : ''}\nZobacz w panelu: ${process.env.WEBSITE_URL || 'http://localhost:'+PORT}/admin-support.html`
                })
            });
            console.log("Powiadomienie na Discord webhook wysłane.");
        } else { console.warn("DISCORD_WEBHOOK_URL_SUPPORT nie jest skonfigurowany."); }
        res.json({ message: 'Zgłoszenie zostało przyjęte. Strażnicy Kronik wkrótce się nim zajmą!', ticketId: supportRequest.id });
      } catch (error) {
        console.error('Błąd podczas przetwarzania zgłoszenia wsparcia:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Błąd walidacji danych: ' + error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Wystąpił błąd serwera podczas przyjmowania zgłoszenia.' });
      }
    });
    // Admin API Endpoints (obsługiwane przez ten serwer Node.js)
    app.get('/api/admin/support-tickets', async (req, res) => {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
        }
        try {
            const allTickets = await SupportRequest.findAll({
                order: [['createdAt', 'DESC']],
                include: [{
                    model: SupportReply,
                    as: 'replies',
                    order: [['createdAt', 'ASC']]
                }]
            });
            res.json(allTickets);
        } catch (error) {
            console.error('Błąd pobierania wszystkich zgłoszeń dla admina:', error);
            res.status(500).json({ error: "Błąd serwera podczas pobierania zgłoszeń." });
        }
    });
    app.post('/api/admin/support-tickets/:ticketId/status', async (req, res) => {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
        }
        const { ticketId } = req.params;
        const { status } = req.body;
        const allowedStatuses = ['Otwarte', 'W trakcie', 'Oczekuje na odpowiedź', 'Rozwiązane', 'Zamknięte'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Nieprawidłowy status zgłoszenia.' });
        }
        try {
            const ticket = await SupportRequest.findByPk(ticketId);
            if (!ticket) {
                return res.status(404).json({ error: 'Nie znaleziono zgłoszenia o podanym ID.' });
            }
            ticket.status = status;
            await ticket.save();
            console.log(`Admin ${req.session.user.username} zmienił status zgłoszenia #${ticketId} na ${status}`);
            res.json({ message: `Status zgłoszenia #${ticketId} został zaktualizowany na "${status}".`, ticket });
        } catch (error) {
            console.error(`Błąd podczas aktualizacji statusu zgłoszenia #${ticketId}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas aktualizacji statusu zgłoszenia.' });
        }
    });
    app.post('/api/admin/support-tickets/:ticketId/reply', async (req, res) => {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
        }
        const { ticketId } = req.params;
        const { replyText } = req.body;
        await handleSupportReplyLogic(req, res, ticketId, replyText, true);
    });
    app.get('/api/admin/content-keys', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        try {
            const keys = await Content.findAll({ attributes: ['key'], group: ['key'], order: [['key', 'ASC']] });
            res.json(keys);
        } catch(error) {
            console.error("Błąd pobierania kluczy treści dla panelu admina:", error);
            res.status(500).json({ error: "Błąd serwera podczas pobierania kluczy treści." });
        }
    });
    app.get('/api/admin/content/:key', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
      try {
        const content = await Content.findOne({ where: { key: req.params.key } });
        res.json(content || { key: req.params.key, value: '' });
      } catch(error) {
        console.error("Błąd pobierania treści dla panelu admina:", error);
        res.status(500).json({ error: "Błąd serwera podczas pobierania treści." });
      }
    });
    app.post('/api/admin/content/:key', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
      try {
        const { key } = req.params;
        const { value } = req.body;
        let contentEntry = await Content.findOne({ where: { key: key } });
        if (contentEntry) {
            contentEntry.value = value;
            await contentEntry.save();
        } else {
            contentEntry = await Content.create({ key: key, value: value });
        }
        res.json({ message: 'Treść zapisana pomyślnie.' });
      } catch(error) {
        console.error("Błąd zapisywania treści z panelu admina:", error);
        res.status(500).json({ error: "Błąd serwera podczas zapisywania treści." });
      }
    });

    // --- API Artykułów (Admin) ---
    app.post('/api/admin/articles', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
      if (!req.session.user || !req.session.user.id || !req.session.user.username) {
        return res.status(401).json({ error: 'Unauthorized - Sesja użytkownika nieprawidłowa lub brak danych użytkownika.' });
      }

      const { title, content, status, slug: providedSlug } = req.body;

      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Tytuł jest wymagany.' });
      }
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Treść jest wymagana.' });
      }

      try {
        let slug = providedSlug ? await generateUniqueSlug(providedSlug) : await generateUniqueSlug(title);
        if (providedSlug && providedSlug !== slug) {
            console.warn(`Podany slug "${providedSlug}" nie był unikalny. Zmieniono na "${slug}".`);
            // Można by zwrócić informację do użytkownika, że slug został zmodyfikowany
        }


        const articleData = {
          title,
          slug,
          content,
          authorId: req.session.user.id,
          authorName: req.session.user.username,
          status: status || 'draft', // Domyślnie 'draft'
        };

        if (articleData.status === 'published' && !articleData.publishedAt) {
          articleData.publishedAt = new Date();
        }

        const newArticle = await Article.create(articleData);

        // Associate categories if provided
        if (req.body.categoryIds && Array.isArray(req.body.categoryIds)) {
            await newArticle.setCategories(req.body.categoryIds.map(id => parseInt(id, 10)));
        }

        // Fetch the article again to include categories in the response
        const articleWithCategories = await Article.findByPk(newArticle.id, {
            include: [{ model: Category, attributes: ['id', 'name'], through: { attributes: [] } }]
        });

        res.status(201).json(articleWithCategories);
      } catch (error) {
        console.error('Błąd podczas tworzenia nowego artykułu:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ error: 'Błąd walidacji danych: ' + error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Błąd serwera podczas tworzenia artykułu.' });
      }
    });

    app.get('/api/admin/articles', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;

      try {
        const { count, rows } = await Article.findAndCountAll({
          order: [['createdAt', 'DESC']],
          limit: limit,
          offset: offset,
          attributes: ['id', 'title', 'slug', 'status', 'authorName', 'createdAt', 'updatedAt', 'publishedAt']
        });

        res.json({
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalArticles: count,
          articles: rows
        });
      } catch (error) {
        console.error('Błąd podczas pobierania wszystkich artykułów dla admina:', error);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania artykułów.' });
      }
    });

    app.get('/api/admin/articles/:id', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
      const { id } = req.params;
      try {
        const article = await Article.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name'], through: { attributes: [] } }]
        });
        if (!article) {
          return res.status(404).json({ error: 'Artykuł nie został znaleziony.' });
        }
        res.json(article);
      } catch (error) {
        console.error(`Błąd podczas pobierania artykułu o ID ${id} dla admina:`, error);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania artykułu.' });
      }
    });

    app.put('/api/admin/articles/:id', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
      const { id } = req.params;
      const { title, content, slug: newSlug, status, categoryIds } = req.body; // Added categoryIds

      try {
        const article = await Article.findByPk(id);
        if (!article) {
          return res.status(404).json({ error: 'Artykuł nie został znaleziony.' });
        }

        if (title) article.title = title;
        if (content) article.content = content;
        if (status) article.status = status;

        if (newSlug && newSlug !== article.slug) {
          article.slug = await generateUniqueSlug(newSlug, article.id);
           if (newSlug !== article.slug) {
             console.warn(`Podany nowy slug "${newSlug}" dla artykułu ID ${id} nie był unikalny lub wymagał normalizacji. Zmieniono na "${article.slug}".`);
             // Można by dodać informację zwrotną do odpowiedzi JSON
           }
        } else if (title && !newSlug && title !== article.title) { // Jeśli zmieniono tytuł, a nie podano nowego sluga, wygeneruj nowy slug z tytułu
            article.slug = await generateUniqueSlug(title, article.id);
        }


        if (article.status === 'published' && !article.publishedAt) {
          article.publishedAt = new Date();
        }
        // Jeśli status zmieniono na 'draft', publishedAt pozostaje (oznacza kiedy był ostatnio opublikowany)

        await article.save();

        // Update categories if categoryIds is provided
        if (categoryIds && Array.isArray(categoryIds)) {
            await article.setCategories(categoryIds.map(catId => parseInt(catId, 10)));
        } else if (categoryIds === null || (Array.isArray(categoryIds) && categoryIds.length === 0)) {
            // If categoryIds is explicitly null or an empty array, remove all categories
            await article.setCategories([]);
        }

        // Fetch the article again to include categories in the response
        const updatedArticleWithCategories = await Article.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name'], through: { attributes: [] } }]
        });

        res.json(updatedArticleWithCategories);
      } catch (error) {
        console.error(`Błąd podczas aktualizacji artykułu o ID ${id}:`, error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ error: 'Błąd walidacji danych: ' + error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Błąd serwera podczas aktualizacji artykułu.' });
      }
    });

    app.delete('/api/admin/articles/:id', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
      const { id } = req.params;

      const article = await Article.findByPk(id);
      if (!article) {
        return res.status(404).json({ error: 'Artykuł nie został znaleziony.' });
      }
      // Also remove associations in ArticleCategory table
      await article.setCategories([]); // This removes all associations for this article

      try {
        await article.destroy();
        res.status(204).send(); // 204 No Content
      } catch (error) {
        console.error(`Błąd podczas usuwania artykułu o ID ${id}:`, error);
        res.status(500).json({ error: 'Błąd serwera podczas usuwania artykułu.' });
      }
    });

    // --- API Kategorii Artykułów (Admin) ---
    app.post('/api/admin/categories', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
        }
        try {
            const slug = await generateUniqueCategorySlug(name);
            const newCategory = await Category.create({ name, slug });
            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Błąd tworzenia kategorii:', error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas tworzenia kategorii.' });
        }
    });

    app.get('/api/admin/categories', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        try {
            const categories = await Category.findAll({ order: [['name', 'ASC']] });
            res.json(categories);
        } catch (error) {
            console.error('Błąd pobierania kategorii:', error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania kategorii.' });
        }
    });

    app.put('/api/admin/categories/:categoryId', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { categoryId } = req.params;
        const { name, slug: newSlug } = req.body;

        try {
            const category = await Category.findByPk(categoryId);
            if (!category) {
                return res.status(404).json({ error: 'Kategoria nie została znaleziona.' });
            }

            if (name) category.name = name;

            if (newSlug && newSlug !== category.slug) {
                category.slug = await generateUniqueCategorySlug(newSlug, category.id);
            } else if (name && (!newSlug || newSlug === category.slug)) {
                // If name changed and slug wasn't provided OR slug is the same as old one but name implies change
                const generatedSlugFromName = await generateUniqueCategorySlug(name, category.id);
                if (generatedSlugFromName !== category.slug) {
                    category.slug = generatedSlugFromName;
                }
            }

            await category.save();
            res.json(category);
        } catch (error) {
            console.error(`Błąd aktualizacji kategorii ID ${categoryId}:`, error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                 return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas aktualizacji kategorii.' });
        }
    });

    app.delete('/api/admin/categories/:categoryId', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { categoryId } = req.params;
        try {
            const category = await Category.findByPk(categoryId);
            if (!category) {
                return res.status(404).json({ error: 'Kategoria nie została znaleziona.' });
            }
            // Sequelize handles removing associations in ArticleCategory through `onDelete: 'CASCADE'`
            // in the ArticleCategory model definition for foreign keys.
            // If onDelete: 'CASCADE' was not set, we would need:
            // await ArticleCategory.destroy({ where: { CategoryId: categoryId } });
            await category.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(`Błąd usuwania kategorii ID ${categoryId}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas usuwania kategorii.' });
        }
    });


    // ENDPOINTY ADMINA DLA SKLEPU (proxy do API bota)
    app.get('/api/admin/shop-items', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, '/api/admin/shop-items', 'GET');
    });

    app.get('/api/admin/shop-items/:itemId', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/admin/shop-items/${req.params.itemId}`, 'GET');
    });

    app.post('/api/admin/shop-items', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, '/api/admin/shop-items', 'POST', req.body);
    });

    app.put('/api/admin/shop-items/:itemId', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/admin/shop-items/${req.params.itemId}`, 'PUT', req.body);
    });

    app.delete('/api/admin/shop-items/:itemId', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/admin/shop-items/${req.params.itemId}`, 'DELETE');
    });

    // PROXY DLA KONFIGURACJI BOTA
    app.get('/api/config/:guildId', (req, res) => { // Endpoint do pobierania konfiguracji (GET)
        proxyToBotApi(req, res, `/api/config/${req.params.guildId}`);
    });
    app.put('/api/config/:guildId/xp', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/config/${req.params.guildId}/xp`, 'PUT', req.body);
    });
    app.put('/api/config/:guildId/channel_xp', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/config/${req.params.guildId}/channel_xp`, 'PUT', req.body);
    });
    app.delete('/api/config/:guildId/channel_xp/:channelId', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/config/${req.params.guildId}/channel_xp/${req.params.channelId}`, 'DELETE');
    });
    app.put('/api/config/:guildId/other', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, `/api/config/${req.params.guildId}/other`, 'PUT', req.body);
    });


    // --- Obsługa stron statycznych i React App ---

    // 1. Serwowanie plików z folderu 'uploads'
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // 2. Serwowanie statycznych zasobów aplikacji React (JS, CSS, obrazy itp. z client/dist/assets)
    //    To jest kluczowe, aby pliki linkowane przez client/dist/index.html były dostępne.
    //    Ścieżka '/assets' jest używana w client/dist/index.html
    app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));

    // 3. Dedykowane ścieżki dla sklepu bota (teraz HTML, nie React)
    app.get('/sklep-bota', (req, res, next) => {
        const shopHtmlPath = path.join(__dirname, 'public', 'sklep-bota.html'); // Zakładamy, że sklep-bota.html będzie w public
        if (fs.existsSync(shopHtmlPath)) {
            console.log(`Serwowanie sklepu bota (HTML) dla: ${req.path}`);
            res.sendFile(shopHtmlPath);
        } else {
            console.error("Krytyczny błąd: Plik sklep-bota.html nie został znaleziony w public/.");
            next(); // Przekaż do następnego handlera (np. 404)
        }
    });
    
    // 4. Serwowanie plików statycznych z katalogu 'public'
    //    To obsłuży public/index.html dla ścieżki '/', oraz inne pliki jak .css, .js, obrazy z 'public'.
    app.use(express.static(path.join(__dirname, 'public')));
    
    // 5. Handler dla wszystkich innych ścieżek (catch-all)
    //    Jeśli żądanie nie pasuje do API, ani do plików statycznych z 'public',
    //    ani do ścieżek aplikacji React, to jest to prawdopodobnie 404.
    app.use((req, res) => {
        if (req.path.startsWith('/api/')) { // To już powinno być obsłużone przez API, ale na wszelki wypadek
            return res.status(404).json({ error: 'Nie znaleziono endpointu API.' });
        }
        
        console.log(`Nie znaleziono ścieżki: ${req.path}. Serwowanie strony 404.`);
        const filePath404 = path.join(__dirname, 'public', '404.html');
        fs.access(filePath404, fs.constants.F_OK, (err) => {
            if (err) {
                res.status(404).send('404: Strona nie znaleziona. <a href="/">Powrót do strony głównej</a>');
            } else {
                res.status(404).sendFile(filePath404);
            }
        });
    });


    app.listen(PORT, async () => {
      try {
        await sequelize.authenticate();
        console.log('Połączono z bazą danych strony (support.sqlite) pomyślnie.');
        // Synchronizacja wszystkich modeli, w tym Article
        await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
        console.log(`Modele bazy danych strony zsynchronizowane (alter: ${process.env.NODE_ENV !== 'production'}).`);
        console.log(`Serwer strony Kronik Elary działa na http://localhost:${PORT}`);
      } catch (error) {
        console.error('Nie udało się połączyć z bazą danych strony lub uruchomić serwera:', error);
      }
    });

