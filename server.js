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
    const multer = require('multer');
    const fetch = require('node-fetch');
    const nodemailer = require('nodemailer');
    const path = require('path');
    const fs = require('fs');
    const crypto = require('crypto');
    const { Op } = require('sequelize');

    // Import modeli Sequelize
    const SupportRequest = require('./models/SupportRequest');
    const SupportReply = require('./models/SupportReply');
    const Content = require('./models/Content');
    const Article = require('./models/Article');
    const Category = require('./models/Category');
    const ArticleCategory = require('./models/ArticleCategory');
    const Comment = require('./models/Comment'); // Import Comment model
    const User = require('./models/User'); // Import User model
    const UserProfile = require('./models/UserProfile'); // Import UserProfile model
    const WikiPage = require('./models/WikiPage'); // Import WikiPage model
    const WikiCategory = require('./models/WikiCategory'); // Import WikiCategory model
    const FanArt = require('./models/FanArt'); // Import FanArt model
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

    if (Article && Category && ArticleCategory) {
        Article.belongsToMany(Category, { through: ArticleCategory });
        Category.belongsToMany(Article, { through: ArticleCategory });
    }

    if (Article && Comment) {
        Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });
        Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });
    }

    // Associations for User and UserProfile
    if (User && UserProfile) {
        User.hasOne(UserProfile, {
            foreignKey: 'discordUserId', // This will be the column name in UserProfile table
            sourceKey: 'discordUserId',   // This is the column name in User table
            as: 'profile',
            onDelete: 'CASCADE' // If a User is deleted, their profile is also deleted
        });
        UserProfile.belongsTo(User, {
            foreignKey: 'discordUserId', // This will be the column name in UserProfile table
            targetKey: 'discordUserId'    // This is the column name in User table
        });
    }

    // Associations for WikiCategory and WikiPage
    if (WikiCategory && WikiPage) {
        WikiCategory.hasMany(WikiPage, {
            foreignKey: 'wikiCategoryId',
            as: 'wikiPages'
        });
        WikiPage.belongsTo(WikiCategory, {
            foreignKey: 'wikiCategoryId',
            as: 'wikiCategory'
        });
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

    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true });
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

    function isAdmin(req) {
      return req.session?.user?.id === ADMIN_DISCORD_ID;
    }

    function isWikiContributor(req) {
        if (isAdmin(req)) { // Admins are always contributors
            return true;
        }
        if (req.session && req.session.user && req.session.user.id) {
            const trustedIds = (process.env.TRUSTED_WIKI_CONTRIBUTOR_IDS || '').split(',');
            return trustedIds.includes(req.session.user.id);
        }
        return false;
    }

    async function proxyToBotApi(req, res, botApiPath, method = 'GET', body = null, queryParams = {}) {
        // ... (istniejąca implementacja)
    }

    async function handleSupportReplyLogic(req, res, ticketId, replyText, isActuallyAdmin) {
        // ... (istniejąca implementacja)
    }

    async function generateUniqueSlug(title, currentId = null) {
      // ... (istniejąca implementacja)
    }

    async function generateUniqueCategorySlug(name, currentId = null) {
      // ... (istniejąca implementacja)
    }

    async function generateUniqueWikiPageSlug(title, currentId = null) {
        let slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove non-word characters (excluding hyphens and spaces)
            .replace(/\s+/g, '-')    // Replace spaces with hyphens
            .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
            .trim();                  // Trim leading/trailing hyphens/spaces

        if (!slug) { // If slug becomes empty after sanitization (e.g., title was all symbols)
            slug = 'strona'; // Default slug prefix
        }

        let count = 0;
        let uniqueSlug = slug;

        // Check for uniqueness and append number if necessary
        // Op.ne is "not equal"
        const whereClause = { slug: uniqueSlug };
        if (currentId) { // If updating, exclude the current item itself from the check
            whereClause.id = { [Op.ne]: currentId };
        }

        while (await WikiPage.findOne({ where: whereClause })) {
            count++;
            uniqueSlug = `${slug}-${count}`;
            whereClause.slug = uniqueSlug; // Update slug in whereClause for next check
        }
        return uniqueSlug;
    }

    async function generateUniqueWikiCategorySlug(name, currentId = null) {
        let slug = name.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove non-word characters
            .replace(/\s+/g, '-')    // Replace spaces with hyphens
            .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
            .trim();

        if (!slug) slug = 'kategoria';

        let count = 0;
        let uniqueSlug = slug;
        const whereClause = { slug: uniqueSlug };
        if (currentId) {
            whereClause.id = { [Op.ne]: currentId };
        }

        while (await WikiCategory.findOne({ where: whereClause })) {
            count++;
            uniqueSlug = `${slug}-${count}`;
            whereClause.slug = uniqueSlug;
        }
        return uniqueSlug;
    }

    // --- API Artykułów (Publiczne) ---
    app.get('/api/articles', async (req, res) => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const categorySlug = req.query.category;
        const searchQuery = req.query.search;

        let whereClauseArray = [{ status: 'published' }];

        if (searchQuery) {
            whereClauseArray.push({
                [Op.or]: [
                    { title: { [Op.like]: `%${searchQuery}%` } },
                    { content: { [Op.like]: `%${searchQuery}%` } }
                ]
            });
        }

        let includeOptions = [{
            model: Category,
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] }
        }];

        if (categorySlug) {
            includeOptions[0].where = { slug: categorySlug };
            includeOptions[0].required = true;
        }

        try {
            const { count, rows } = await Article.findAndCountAll({
                where: { [Op.and]: whereClauseArray },
                order: [
                    ['isFeatured', 'DESC'], // Featured articles first
                    ['publishedAt', 'DESC'],
                    ['createdAt', 'DESC']
                ],
                limit: limit,
                offset: offset,
                attributes: ['id', 'title', 'slug', 'authorName', 'publishedAt', 'content', 'createdAt', 'isFeatured'],
                include: includeOptions,
                distinct: true, // Important for correct count with required include
            });

            const articles = rows.map(article => ({
                id: article.id,
                title: article.title,
                slug: article.slug,
                authorName: article.authorName,
                publishedAt: article.publishedAt || article.createdAt,
                snippet: article.content.substring(0, 200) + (article.content.length > 200 ? '...' : ''),
                Categories: article.Categories,
                isFeatured: article.isFeatured
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
                include: [{
                    model: Category,
                    attributes: ['id', 'name', 'slug'],
                    through: { attributes: [] }
                }]
                // isFeatured will be included by default as no specific attributes are selected for Article
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

    app.get('/api/categories', async (req, res) => {
        // ... (istniejąca implementacja)
    });

    // --- API Komentarzy Artykułów ---
    app.post('/api/articles/:articleSlug/comments', async (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby dodać komentarz.' });
        }
        try {
            const article = await Article.findOne({ where: { slug: req.params.articleSlug, status: 'published' } });
            if (!article) {
                return res.status(404).json({ error: 'Artykuł nie został znaleziony lub nie jest opublikowany.' });
            }

            const { content } = req.body;
            if (!content || content.trim() === '') {
                return res.status(400).json({ error: 'Treść komentarza nie może być pusta.' });
            }

            const newComment = await Comment.create({
                articleId: article.id,
                discordUserId: req.session.user.id,
                discordUsername: req.session.user.username,
                content: content.trim()
            });
            res.status(201).json(newComment);
        } catch (error) {
            console.error(`Błąd podczas tworzenia komentarza dla artykułu ${req.params.articleSlug}:`, error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas tworzenia komentarza.' });
        }
    });

    app.get('/api/articles/:articleSlug/comments', async (req, res) => {
        try {
            const article = await Article.findOne({ where: { slug: req.params.articleSlug, status: 'published' } });
            if (!article) {
                return res.status(404).json({ error: 'Artykuł nie został znaleziony lub nie jest opublikowany.' });
            }

            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await Comment.findAndCountAll({
                where: { articleId: article.id },
                order: [['createdAt', 'ASC']],
                limit: limit,
                offset: offset,
            });

            res.json({
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalComments: count,
                comments: rows
            });
        } catch (error) {
            console.error(`Błąd podczas pobierania komentarzy dla artykułu ${req.params.articleSlug}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania komentarzy.' });
        }
    });

    // --- Pozostałe ścieżki API (Auth, Proxy, Support, etc.) ---
    // ... (istniejące implementacje)

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

        const userToStore = {
            discordUserId: userData.id,
            username: `${userData.username}${userData.discriminator === "0" || userData.discriminator === null ? "" : `#${userData.discriminator}`}`,
            email: userData.email,
            avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null
        };

        try {
            await User.upsert(userToStore);
            console.log("Użytkownik zapisany/zaktualizowany w bazie danych:", userToStore.discordUserId);
        } catch (dbError) {
            console.error("Błąd zapisu użytkownika w bazie danych:", dbError);
            // Kontynuuj nawet jeśli jest błąd DB, sesja jest ważniejsza dla działania strony
        }

        req.session.user = { // Store same structure in session for consistency
          id: userData.id, // discordUserId is stored as 'id' in session for legacy compatibility with isAdmin etc.
          username: userToStore.username,
          email: userToStore.email,
          avatar: userToStore.avatar
        };
        console.log("Użytkownik zalogowany (sesja):", req.session.user);

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
    app.post('/api/warnings/add', (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        proxyToBotApi(req, res, '/api/warnings/add', 'POST', req.body);
    });
    app.delete('/api/warnings/remove', (req, res) => {
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


    // Support Tickets API
    app.get('/api/support/my-tickets', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.get('/api/support/ticket/:ticketId', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.post('/api/support/ticket/:ticketId/reply', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.post('/api/support/submit', upload.single('attachment'), async (req, res) => {
        // ... (istniejąca implementacja)
    });

    // Admin API Endpoints
    app.get('/api/admin/support-tickets', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.post('/api/admin/support-tickets/:ticketId/status', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.post('/api/admin/support-tickets/:ticketId/reply', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.get('/api/admin/content-keys', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.get('/api/admin/content/:key', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.post('/api/admin/content/:key', async (req, res) => {
        // ... (istniejąca implementacja)
    });

    // --- API Artykułów (Admin) ---
    app.post('/api/admin/articles', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden - Brak uprawnień administratora.' });
      if (!req.session.user || !req.session.user.id || !req.session.user.username) {
        return res.status(401).json({ error: 'Unauthorized - Sesja użytkownika nieprawidłowa lub brak danych użytkownika.' });
      }

      const { title, content, status, slug: providedSlug, isFeatured, categoryIds } = req.body;

      if (!title || title.trim() === '') return res.status(400).json({ error: 'Tytuł jest wymagany.' });
      if (!content || content.trim() === '') return res.status(400).json({ error: 'Treść jest wymagana.' });

      try {
        let slug = providedSlug ? await generateUniqueSlug(providedSlug) : await generateUniqueSlug(title);
        if (providedSlug && providedSlug !== slug) {
            console.warn(`Podany slug "${providedSlug}" nie był unikalny. Zmieniono na "${slug}".`);
        }

        const articleData = {
          title, slug, content,
          authorId: req.session.user.id,
          authorName: req.session.user.username,
          status: status || 'draft',
          isFeatured: isFeatured || false, // Dodano isFeatured
          publishedAt: (status === 'published' && !articleData.publishedAt) ? new Date() : null
        };

        const newArticle = await Article.create(articleData);

        if (categoryIds && Array.isArray(categoryIds)) {
            await newArticle.setCategories(categoryIds.map(id => parseInt(id, 10)));
        }

        const articleWithAssociations = await Article.findByPk(newArticle.id, {
            include: [{ model: Category, attributes: ['id', 'name'], through: { attributes: [] } }]
        });
        res.status(201).json(articleWithAssociations);
      } catch (error) {
        console.error('Błąd podczas tworzenia nowego artykułu:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ error: 'Błąd walidacji danych: ' + error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Błąd serwera podczas tworzenia artykułu.' });
      }
    });

    app.get('/api/admin/articles', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      try {
        const { count, rows } = await Article.findAndCountAll({
          order: [['createdAt', 'DESC']],
          limit: limit,
          offset: offset,
          attributes: ['id', 'title', 'slug', 'status', 'authorName', 'createdAt', 'updatedAt', 'publishedAt', 'isFeatured'] // Dodano isFeatured
        });
        res.json({
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalArticles: count,
          articles: rows
        });
      } catch (error) {
        console.error('Błąd pobierania artykułów dla admina:', error);
        res.status(500).json({ error: 'Błąd serwera.' });
      }
    });

    app.get('/api/admin/articles/:id', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.params;
      try {
        const article = await Article.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name'], through: { attributes: [] } }]
            // isFeatured jest domyślnie dołączane
        });
        if (!article) return res.status(404).json({ error: 'Artykuł nie został znaleziony.' });
        res.json(article);
      } catch (error) {
        console.error(`Błąd pobierania artykułu ID ${id} dla admina:`, error);
        res.status(500).json({ error: 'Błąd serwera.' });
      }
    });

    app.put('/api/admin/articles/:id', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.params;
      const { title, content, slug: newSlug, status, categoryIds, isFeatured } = req.body;
      try {
        const article = await Article.findByPk(id);
        if (!article) return res.status(404).json({ error: 'Artykuł nie znaleziony.' });

        if (title) article.title = title;
        if (content) article.content = content;
        if (status) article.status = status;
        if (typeof isFeatured === 'boolean') article.isFeatured = isFeatured; // Aktualizacja isFeatured

        if (newSlug && newSlug !== article.slug) {
          article.slug = await generateUniqueSlug(newSlug, article.id);
        } else if (title && !newSlug && title !== article.title) {
            article.slug = await generateUniqueSlug(title, article.id);
        }

        if (article.status === 'published' && !article.publishedAt) {
          article.publishedAt = new Date();
        }

        await article.save();

        if (categoryIds && Array.isArray(categoryIds)) {
            await article.setCategories(categoryIds.map(catId => parseInt(catId, 10)));
        } else if (categoryIds === null || (Array.isArray(categoryIds) && categoryIds.length === 0)) {
            await article.setCategories([]);
        }

        const updatedArticleWithCategories = await Article.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name'], through: { attributes: [] } }]
        });
        res.json(updatedArticleWithCategories);
      } catch (error) {
        console.error(`Błąd aktualizacji artykułu ID ${id}:`, error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Błąd serwera.' });
      }
    });

    app.delete('/api/admin/articles/:id', async (req, res) => {
      if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.params;
      try {
        const article = await Article.findByPk(id);
        if (!article) return res.status(404).json({ error: 'Artykuł nie znaleziony.' });

        // Usuń powiązania z kategoriami przed usunięciem artykułu
        await article.setCategories([]);

        await article.destroy();
        res.status(200).json({ message: 'Artykuł został usunięty.' });
      } catch (error) {
        console.error(`Błąd podczas usuwania artykułu ID ${id}:`, error);
        res.status(500).json({ error: 'Błąd serwera.' });
      }
    });

    // API Kategorii Artykułów (Admin)
    app.post('/api/admin/categories', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { name, slug: providedSlug } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
        }
        try {
            let slug = providedSlug ? await generateUniqueCategorySlug(providedSlug) : await generateUniqueCategorySlug(name);
            if (providedSlug && providedSlug !== slug) {
                console.warn(`Podany slug kategorii "${providedSlug}" nie był unikalny. Zmieniono na "${slug}".`);
            }
            const newCategory = await Category.create({ name, slug });
            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Błąd podczas tworzenia nowej kategorii:', error);
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
            console.error('Błąd pobierania kategorii dla admina:', error);
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });
    app.put('/api/admin/categories/:categoryId', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { categoryId } = req.params;
        const { name, slug: newSlug } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
        }
        try {
            const category = await Category.findByPk(categoryId);
            if (!category) {
                return res.status(404).json({ error: 'Kategoria nie została znaleziona.' });
            }
            category.name = name;
            if (newSlug && newSlug !== category.slug) {
                category.slug = await generateUniqueCategorySlug(newSlug, category.id);
            } else if (!newSlug && name !== category.name) { // Regenerate slug if name changed and no new slug provided
                category.slug = await generateUniqueCategorySlug(name, category.id);
            }
            await category.save();
            res.json(category);
        } catch (error) {
            console.error(`Błąd aktualizacji kategorii ID ${categoryId}:`, error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera.' });
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
            // Before deleting a category, we must remove its associations with articles.
            // This prevents foreign key constraint errors if articles are linked to this category.
            await category.setArticles([]); // Assuming 'setArticles' is the method from belongsToMany association

            await category.destroy();
            res.status(200).json({ message: 'Kategoria została usunięta.' });
        } catch (error) {
            console.error(`Błąd podczas usuwania kategorii ID ${categoryId}:`, error);
             // Detailed error logging for FK constraint
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                console.error('SequelizeForeignKeyConstraintError details:', error.parent || error);
                return res.status(400).json({
                    error: 'Nie można usunąć kategorii, ponieważ istnieją artykuły do niej przypisane. Usuń lub zmień kategorię tych artykułów najpierw.',
                    details: error.message
                });
            }
            res.status(500).json({ error: 'Błąd serwera podczas usuwania kategorii.' });
        }
    });

    // API Admina dla Komentarzy
    app.delete('/api/admin/comments/:commentId', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { commentId } = req.params;
        try {
            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({ error: 'Komentarz nie został znaleziony.' });
            }
            await comment.destroy();
            res.status(200).json({ message: 'Komentarz został usunięty.' });
        } catch (error) {
            console.error(`Błąd podczas usuwania komentarza ID ${commentId}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas usuwania komentarza.' });
        }
    });

    // --- API Profilu Użytkownika ---
    app.get('/api/profile/me', async (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Unauthorized - Musisz być zalogowany.' });
        }
        try {
            const user = await User.findOne({
                where: { discordUserId: req.session.user.id },
                include: [{ model: UserProfile, as: 'profile' }]
            });

            if (!user) {
                // This case should ideally not happen if a session exists for a user ID
                // that was previously validated and stored/looked up in User table.
                console.warn(`User with session ID ${req.session.user.id} not found in database for /api/profile/me.`);
                return res.status(404).json({ error: 'Użytkownik nie znaleziony w bazie danych.' });
            }
            res.json(user); // user object will include 'profile' if associated, or it will be null.
        } catch (error) {
            console.error(`Błąd podczas pobierania własnego profilu dla ${req.session.user.id}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania profilu.' });
        }
    });

    app.get('/api/profile/:discordUserId', async (req, res) => {
        const { discordUserId } = req.params;
        try {
            const user = await User.findOne({
                where: { discordUserId: discordUserId },
                include: [{
                    model: UserProfile,
                    as: 'profile' // Verified this alias
                }]
            });

            if (!user) {
                return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
            }
            res.json(user);
        } catch (error) {
            console.error(`Błąd podczas pobierania profilu dla ${discordUserId}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania profilu.' });
        }
    });

    app.put('/api/profile/:discordUserId', async (req, res) => {
        const { discordUserId } = req.params;

        if (!req.session.user || (req.session.user.id !== discordUserId && !isAdmin(req))) {
            return res.status(403).json({ error: 'Forbidden - Brak uprawnień do edycji tego profilu.' });
        }

        // Fields to update, ensure these match UserProfile model definition
        const { bio, favoriteAnime, favoriteManga, websiteLink, twitterLink, twitchLink, youtubeLink } = req.body;
        const profileDataToUpdate = {};

        // Only add fields to update if they are provided in the request body
        if (req.body.hasOwnProperty('bio')) profileDataToUpdate.bio = bio;
        if (req.body.hasOwnProperty('favoriteAnime')) profileDataToUpdate.favoriteAnime = favoriteAnime;
        if (req.body.hasOwnProperty('favoriteManga')) profileDataToUpdate.favoriteManga = favoriteManga;
        if (req.body.hasOwnProperty('websiteLink')) profileDataToUpdate.websiteLink = websiteLink;
        if (req.body.hasOwnProperty('twitterLink')) profileDataToUpdate.twitterLink = twitterLink;
        if (req.body.hasOwnProperty('twitchLink')) profileDataToUpdate.twitchLink = twitchLink;
        if (req.body.hasOwnProperty('youtubeLink')) profileDataToUpdate.youtubeLink = youtubeLink;

        // If no valid fields to update are provided
        if (Object.keys(profileDataToUpdate).length === 0) {
            return res.status(400).json({ error: 'Brak danych do aktualizacji.' });
        }

        try {
            const user = await User.findByPk(discordUserId);
            if (!user) {
                return res.status(404).json({ error: 'Użytkownik (User) nie znaleziony. Nie można utworzyć/zaktualizować profilu.' });
            }

            // Upsert the profile. This will create if not exists, or update if exists.
            // The 'defaults' option in findOrCreate is good for creation,
            // but for partial updates on existing records, findOne then update or manual upsert logic is better.
            // UserProfile.upsert() is simpler if all fields are set or have defaults in model.
            // For partial updates, find or create then selectively update is safer.

            let profile = await UserProfile.findOne({ where: { discordUserId: discordUserId } });
            let httpStatus = 200;

            if (profile) {
                // Update existing profile
                await profile.update(profileDataToUpdate);
            } else {
                // Create new profile
                // Ensure discordUserId is part of the creation data
                profileDataToUpdate.discordUserId = discordUserId;
                profile = await UserProfile.create(profileDataToUpdate);
                httpStatus = 201;
            }

            // Fetch the parent User model again to include the (potentially new/updated) profile
            const userWithProfile = await User.findOne({
                where: { discordUserId: discordUserId },
                include: [{ model: UserProfile, as: 'profile' }]
            });

            res.status(httpStatus).json(userWithProfile.profile); // Return only the profile part
        } catch (error) {
            console.error(`Błąd podczas aktualizacji/tworzenia profilu dla ${discordUserId}:`, error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas aktualizacji/tworzenia profilu.' });
        }
    });

    app.put('/api/profile/me', async (req, res) => {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Unauthorized - Musisz być zalogowany.' });
        }
        const discordUserId = req.session.user.id;

        const { bio, favoriteAnime, favoriteManga, websiteLink, twitterLink, twitchLink, youtubeLink } = req.body;
        const profileDataToUpdate = {};

        if (req.body.hasOwnProperty('bio')) profileDataToUpdate.bio = bio;
        if (req.body.hasOwnProperty('favoriteAnime')) profileDataToUpdate.favoriteAnime = favoriteAnime;
        if (req.body.hasOwnProperty('favoriteManga')) profileDataToUpdate.favoriteManga = favoriteManga;
        if (req.body.hasOwnProperty('websiteLink')) profileDataToUpdate.websiteLink = websiteLink;
        if (req.body.hasOwnProperty('twitterLink')) profileDataToUpdate.twitterLink = twitterLink;
        if (req.body.hasOwnProperty('twitchLink')) profileDataToUpdate.twitchLink = twitchLink;
        if (req.body.hasOwnProperty('youtubeLink')) profileDataToUpdate.youtubeLink = youtubeLink;

        if (Object.keys(profileDataToUpdate).length === 0) {
            return res.status(400).json({ error: 'Brak danych do aktualizacji.' });
        }

        try {
            const user = await User.findByPk(discordUserId);
            if (!user) {
                // Should not happen if session is valid
                return res.status(404).json({ error: 'Użytkownik (User) nie znaleziony.' });
            }

            let profile = await UserProfile.findOne({ where: { discordUserId: discordUserId } });
            let httpStatus = 200;

            if (profile) {
                await profile.update(profileDataToUpdate);
            } else {
                profileDataToUpdate.discordUserId = discordUserId;
                profile = await UserProfile.create(profileDataToUpdate);
                httpStatus = 201;
            }

            const userWithProfile = await User.findOne({
                where: { discordUserId: discordUserId },
                include: [{ model: UserProfile, as: 'profile' }]
            });

            res.status(httpStatus).json(userWithProfile.profile); // Return only the profile part
        } catch (error) {
            console.error(`Błąd podczas aktualizacji/tworzenia własnego profilu dla ${discordUserId}:`, error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas aktualizacji/tworzenia profilu.' });
        }
    });

    // ENDPOINTY ADMINA DLA SKLEPU (proxy do API bota)
    // ... (istniejące implementacje)
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
    // ... (istniejące implementacje)
    app.get('/api/config/:guildId', (req, res) => {
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

    // --- API Stron Wiki (Publiczne) ---
    app.get('/api/wiki/categories', async (req, res) => {
        try {
            const categories = await WikiCategory.findAll({
                attributes: ['id', 'name', 'slug'],
                order: [['name', 'ASC']]
            });
            res.json(categories);
        } catch (error) {
            console.error('Błąd podczas pobierania kategorii wiki:', error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania kategorii wiki.' });
        }
    });

    app.get('/api/wiki/pages', async (req, res) => {
        const categorySlug = req.query.category;
        let queryOptions = {
            attributes: ['title', 'slug', 'updatedAt', 'authorName', 'lastEditorName', 'submittedByUserName'], // Added submittedByUserName
            where: { status: 'published' }, // Default to only published pages
            include: [{
                model: WikiCategory,
                as: 'wikiCategory',
                attributes: ['name', 'slug']
            }],
            order: [['updatedAt', 'DESC']]
        };

        if (categorySlug) {
            queryOptions.include[0].where = { slug: categorySlug };
            queryOptions.include[0].required = true; // Ensures INNER JOIN if category is specified
        }

        try {
            const pages = await WikiPage.findAll(queryOptions);
            res.json(pages);
        } catch (error) {
            console.error('Błąd podczas pobierania stron wiki:', error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania stron wiki.' });
        }
    });

    app.get('/api/wiki/pages/:slug', async (req, res) => {
        try {
            const page = await WikiPage.findOne({
                where: {
                    slug: req.params.slug,
                    status: 'published' // Only fetch published pages by slug
                },
                attributes: ['title', 'slug', 'content', 'authorName', 'lastEditorName', 'updatedAt', 'createdAt', 'submittedByUserName', 'wikiCategoryId'],
                include: [{ model: WikiCategory, as: 'wikiCategory', attributes: ['id', 'name', 'slug'] }]
            });
            if (!page) {
                return res.status(404).json({ error: 'Strona wiki nie została znaleziona lub nie jest opublikowana.' });
            }
            res.json(page);
        } catch (error) {
            console.error(`Błąd podczas pobierania strony wiki o slugu ${req.params.slug}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas pobierania strony wiki.' });
        }
    });

    // --- API Kategorii Wiki (Admin) ---
    app.post('/api/admin/wiki/categories', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { name, slug: providedSlug } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
        }
        try {
            const slug = providedSlug ? await generateUniqueWikiCategorySlug(providedSlug) : await generateUniqueWikiCategorySlug(name);
            const newCategory = await WikiCategory.create({ name, slug });
            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Błąd tworzenia kategorii wiki:', error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    app.get('/api/admin/wiki/categories', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        try {
            const categories = await WikiCategory.findAll({ order: [['name', 'ASC']] });
            res.json(categories);
        } catch (error) {
            console.error('Błąd pobierania kategorii wiki dla admina:', error);
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    app.put('/api/admin/wiki/categories/:id', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const { name, slug: newSlug } = req.body;
        try {
            const category = await WikiCategory.findByPk(id);
            if (!category) {
                return res.status(404).json({ error: 'Kategoria wiki nie znaleziona.' });
            }
            if (name) category.name = name;
            if (newSlug && newSlug !== category.slug) {
                category.slug = await generateUniqueWikiCategorySlug(newSlug, category.id);
            } else if (name && name !== category.name && !newSlug) {
                category.slug = await generateUniqueWikiCategorySlug(name, category.id);
            }
            await category.save();
            res.json(category);
        } catch (error) {
            console.error(`Błąd aktualizacji kategorii wiki ID ${id}:`, error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    app.delete('/api/admin/wiki/categories/:id', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        try {
            const category = await WikiCategory.findByPk(id);
            if (!category) {
                return res.status(404).json({ error: 'Kategoria wiki nie znaleziona.' });
            }
            // onDelete: 'SET NULL' w modelu WikiPage zajmie się odpięciem stron.
            await category.destroy();
            res.status(200).json({ message: 'Kategoria wiki została usunięta.' });
        } catch (error) {
            console.error(`Błąd usuwania kategorii wiki ID ${id}:`, error);
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    // --- API Stron Wiki (Admin) ---
    // Endpoint for users to submit wiki pages
    app.post('/api/wiki/pages/submit', async (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Musisz być zalogowany, aby przesłać stronę wiki.' });
        }
        // Authorization: For now, any logged-in user can submit.
        // Later, could add: if (!isWikiContributor(req)) return res.status(403).json({ error: 'Forbidden' });

        const { title, content, wikiCategoryId } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Tytuł jest wymagany.' });
        }
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Treść jest wymagana.' });
        }

        try {
            const slug = await generateUniqueWikiPageSlug(title); // Always generate new slug for submission

            const newPageData = {
                title: title.trim(),
                slug,
                content: content, // Assuming content is HTML from TinyMCE
                status: 'pending_approval',
                submittedByUserId: req.session.user.id,
                submittedByUserName: req.session.user.username,
                wikiCategoryId: wikiCategoryId || null,
                authorId: req.session.user.id, // Temporarily set submitter as authorId
                authorName: req.session.user.username // Temporarily set submitter as authorName
            };
            // Admin will become the author upon approval. If not, these initial values will remain.

            const submittedPage = await WikiPage.create(newPageData);
            res.status(201).json(submittedPage);
        } catch (error) {
            console.error('Błąd podczas przesyłania strony wiki przez użytkownika:', error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas przesyłania strony wiki.' });
        }
    });

    // --- API Stron Wiki (Admin) ---
    app.post('/api/admin/wiki/pages', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        if (!req.session.user) return res.status(401).json({ error: 'Unauthorized - Sesja nieprawidłowa' });

        const { title, content, slug: providedSlug, wikiCategoryId, status } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Tytuł i treść są wymagane.' });
        }

        try {
            let slug = providedSlug ? await generateUniqueWikiPageSlug(providedSlug) : await generateUniqueWikiPageSlug(title);
             if (providedSlug && providedSlug !== slug) {
                console.warn(`Podany slug strony wiki "${providedSlug}" nie był unikalny. Zmieniono na "${slug}".`);
            }

            const newPageData = {
                title,
                slug,
                content,
                authorId: req.session.user.id, // Admin is the author
                authorName: req.session.user.username,
                status: status || 'draft' // Admin can set status directly
            };
            if (wikiCategoryId !== undefined) {
                newPageData.wikiCategoryId = wikiCategoryId;
            }
            // If admin creates as 'pending_approval', they are also the submitter initially
            if (newPageData.status === 'pending_approval') {
                newPageData.submittedByUserId = req.session.user.id;
                newPageData.submittedByUserName = req.session.user.username;
            }


            const newPage = await WikiPage.create(newPageData);
            const pageWithCategory = await WikiPage.findByPk(newPage.id, {
                include: [{ model: WikiCategory, as: 'wikiCategory', attributes: ['id', 'name', 'slug'] }]
            });
            res.status(201).json(pageWithCategory);
        } catch (error) {
            console.error('Błąd podczas tworzenia strony wiki:', error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera podczas tworzenia strony wiki.' });
        }
    });

    app.get('/api/admin/wiki/pages', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const pageQuery = parseInt(req.query.page, 10) || 1; // Renamed to avoid conflict
        const limit = parseInt(req.query.limit, 10) || 15;
        const offset = (pageQuery - 1) * limit;
        const statusFilter = req.query.status;

        let whereConditions = {};
        if (statusFilter) {
            whereConditions.status = statusFilter;
        }

        try {
            const { count, rows } = await WikiPage.findAndCountAll({
                where: whereConditions,
                attributes: ['id', 'title', 'slug', 'authorName', 'lastEditorName', 'submittedByUserName', 'status', 'updatedAt', 'createdAt'],
                include: [{ model: WikiCategory, as: 'wikiCategory', attributes: ['id', 'name', 'slug'] }],
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset: offset
            });
            res.json({
                totalPages: Math.ceil(count / limit),
                currentPage: pageQuery,
                totalEntries: count,
                entries: rows
            });
        } catch (error) {
            console.error('Błąd podczas pobierania stron wiki dla admina:', error);
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    app.get('/api/admin/wiki/pages/:id', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        try {
            const page = await WikiPage.findByPk(req.params.id, {
                 include: [{ model: WikiCategory, as: 'wikiCategory', attributes: ['id', 'name', 'slug'] }]
            });
            if (!page) {
                return res.status(404).json({ error: 'Strona wiki nie została znaleziona.' });
            }
            res.json(page);
        } catch (error) {
            console.error(`Błąd podczas pobierania strony wiki ID ${req.params.id} dla admina:`, error);
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    app.put('/api/admin/wiki/pages/:id', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        if (!req.session.user) return res.status(401).json({ error: 'Unauthorized - Sesja nieprawidłowa' });

        const { id } = req.params;
        const { title, content, slug: newSlug, wikiCategoryId, status } = req.body;

        // Allow updating status, or other fields.
        if (!title && !content && !newSlug && wikiCategoryId === undefined && !status) {
            return res.status(400).json({ error: 'Brak danych do aktualizacji.' });
        }

        try {
            const page = await WikiPage.findByPk(id);
            if (!page) {
                return res.status(404).json({ error: 'Strona wiki nie została znaleziona.' });
            }

            if (title) page.title = title;
            if (content) page.content = content; // Assuming HTML from TinyMCE
            if (wikiCategoryId !== undefined) {
                page.wikiCategoryId = wikiCategoryId;
            }
            if (status) page.status = status;

            // If admin sets status to 'published' and authorId is currently null (e.g., was pending)
            // or if the original author was the submitter, the admin becomes the author.
            if (status === 'published' && (!page.authorId || page.authorId === page.submittedByUserId)) {
                page.authorId = req.session.user.id;
                page.authorName = req.session.user.username;
            }

            if (newSlug && newSlug !== page.slug) {
                page.slug = await generateUniqueWikiPageSlug(newSlug, page.id);
            } else if (title && title !== page.title && !newSlug) {
                page.slug = await generateUniqueWikiPageSlug(title, page.id);
            }

            page.lastEditorId = req.session.user.id;
            page.lastEditorName = req.session.user.username;

            await page.save();
            const updatedPageWithCategory = await WikiPage.findByPk(page.id, {
                include: [{ model: WikiCategory, as: 'wikiCategory', attributes: ['id', 'name', 'slug'] }]
            });
            res.json(updatedPageWithCategory);
        } catch (error) {
            console.error(`Błąd aktualizacji strony wiki ID ${id}:`, error);
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Błąd walidacji: ' + error.errors.map(e => e.message).join(', ') });
            }
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    app.delete('/api/admin/wiki/pages/:id', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        try {
            const page = await WikiPage.findByPk(id);
            if (!page) {
                return res.status(404).json({ error: 'Strona wiki nie została znaleziona.' });
            }
            await page.destroy();
            res.status(200).json({ message: 'Strona wiki została usunięta.' });
        } catch (error) {
            console.error(`Błąd podczas usuwania strony wiki ID ${id}:`, error);
            res.status(500).json({ error: 'Błąd serwera.' });
        }
    });

    // --- Obsługa stron statycznych i React App ---
    // ... (istniejąca implementacja)

    app.put('/api/admin/wiki/pages/:id/approve', async (req, res) => {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        try {
            const page = await WikiPage.findByPk(id);
            if (!page) {
                return res.status(404).json({ error: 'Strona wiki nie została znaleziona.' });
            }
            if (page.status !== 'pending_approval') {
                return res.status(400).json({ error: 'Ta strona nie oczekuje na zatwierdzenie.' });
            }

            page.status = 'published';
            page.authorId = req.session.user.id; // Approving admin becomes the author
            page.authorName = req.session.user.username;
            // page.publishedAt = new Date(); // If you add a publishedAt field
            page.lastEditorId = req.session.user.id; // Also mark admin as last editor
            page.lastEditorName = req.session.user.username;

            await page.save();

            const approvedPage = await WikiPage.findByPk(page.id, {
                 include: [{ model: WikiCategory, as: 'wikiCategory', attributes: ['id', 'name', 'slug'] }]
            });
            res.json(approvedPage);
        } catch (error) {
            console.error(`Błąd podczas zatwierdzania strony wiki ID ${id}:`, error);
            res.status(500).json({ error: 'Błąd serwera podczas zatwierdzania strony.' });
        }
    });

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));
    app.get('/sklep-bota', (req, res, next) => {
        const shopHtmlPath = path.join(__dirname, 'public', 'sklep-bota.html');
        if (fs.existsSync(shopHtmlPath)) {
            res.sendFile(shopHtmlPath);
        } else {
            console.error("Krytyczny błąd: Plik sklep-bota.html nie został znaleziony w public/.");
            next();
        }
    });
    app.use(express.static(path.join(__dirname, 'public')));
    app.use((req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'Nie znaleziono endpointu API.' });
        }
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
        await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
        console.log(`Modele bazy danych strony zsynchronizowane (alter: ${process.env.NODE_ENV !== 'production'}).`);
        console.log(`Serwer strony Kronik Elary działa na http://localhost:${PORT}`);
      } catch (error) {
        console.error('Nie udało się połączyć z bazą danych strony lub uruchomić serwera:', error);
      }
    });
