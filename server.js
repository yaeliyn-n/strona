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
        // ... (istniejąca implementacja)
    });

    // API Kategorii Artykułów (Admin)
    app.post('/api/admin/categories', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.get('/api/admin/categories', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.put('/api/admin/categories/:categoryId', async (req, res) => {
        // ... (istniejąca implementacja)
    });
    app.delete('/api/admin/categories/:categoryId', async (req, res) => {
        // ... (istniejąca implementacja)
    });

    // API Admina dla Komentarzy
    app.delete('/api/admin/comments/:commentId', async (req, res) => {
        // ... (istniejąca implementacja)
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


    // --- Obsługa stron statycznych i React App ---
    // ... (istniejąca implementacja)
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
