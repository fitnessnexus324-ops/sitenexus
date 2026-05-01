import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import Stripe from "stripe";

import fs from "fs";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn("WARNING: STRIPE_SECRET_KEY is not set in environment variables.");
}
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

// Security: Ensure JWT_SECRET is set in environment
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set in environment variables. Using a fallback secret is insecure for production.");
}
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_production";

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode...`);

  let db: any;
  try {
    console.log("Initializing database...");
    db = new Database("database.sqlite");
    
    // Initialize database
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        cep TEXT,
        street TEXT,
        number TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        complement TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Ensure new columns exist if table was created with old schema
    try {
      db.prepare("SELECT cep FROM users LIMIT 1").get();
    } catch (e) {
      try {
        db.exec(`
          ALTER TABLE users ADD COLUMN cep TEXT;
          ALTER TABLE users ADD COLUMN street TEXT;
          ALTER TABLE users ADD COLUMN number TEXT;
          ALTER TABLE users ADD COLUMN neighborhood TEXT;
          ALTER TABLE users ADD COLUMN city TEXT;
          ALTER TABLE users ADD COLUMN state TEXT;
          ALTER TABLE users ADD COLUMN complement TEXT;
        `);
        console.log("Database migrated successfully.");
      } catch (migrationError) {
        console.error("Migration error:", migrationError);
      }
    }
  } catch (err) {
    console.error("CRITICAL: Failed to initialize database:", err);
    throw err;
  }

  /*
  // Security: Set security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://*", "http://*"], 
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], 
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "connect-src": ["'self'", "https://*", "http://*", "ws:", "wss:"], 
        "frame-src": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Security: Configure CORS
  app.use(cors({
    origin: true, // Required for dynamic preview URLs in AI Studio
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));
  */

  app.use(express.json({ limit: "50mb" })); // Increased limit
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  /*
  // Security: Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Reasonable limit for API
    message: { error: "Muitas requisições deste IP, por favor tente novamente mais tarde." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50, // Stricter limit for auth
    message: { error: "Muitas tentativas de acesso, por favor tente novamente em uma hora." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  */

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    let { name, email, password, phone } = req.body;

    // Security: Robust input validation and sanitization
    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim().toLowerCase();
    if (typeof phone === "string") phone = phone.trim();

    // Name validation
    if (!name || typeof name !== "string" || name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: "O nome deve ter entre 2 e 100 caracteres." });
    }
    // Prevent script injection in name (basic sanitization)
    const sanitizedName = name.replace(/<[^>]*>?/gm, '');

    // Email validation (RFC 5322 compliant regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }

    // Password validation
    if (!password || typeof password !== "string" || password.length < 6 || password.length > 100) {
      return res.status(400).json({ error: "A senha deve ter entre 6 e 100 caracteres." });
    }

    // Phone validation (optional)
    if (phone && (typeof phone !== "string" || phone.length > 20)) {
      return res.status(400).json({ error: "Telefone inválido." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const stmt = db.prepare(`
        INSERT INTO users (name, email, password, phone)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(sanitizedName, email, hashedPassword, phone || null);
      
      const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: "24h" });
      
      res.status(201).json({ 
        message: "Usuário cadastrado com sucesso!",
        token,
        user: { id: result.lastInsertRowid, name, email, phone }
      });
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(400).json({ error: "Este e-mail já está em uso." });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Erro ao cadastrar usuário." });
    }
  });

  app.post("/api/auth/update-address", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const { cep, street, number, neighborhood, city, state, complement } = req.body;

      if (!cep || !street || !number || !neighborhood || !city || !state) {
        return res.status(400).json({ error: "Todos os campos de endereço (exceto complemento) são obrigatórios." });
      }

      const stmt = db.prepare(`
        UPDATE users 
        SET cep = ?, street = ?, number = ?, neighborhood = ?, city = ?, state = ?, complement = ?
        WHERE id = ?
      `);
      stmt.run(cep, street, number, neighborhood, city, state, complement || null, decoded.userId);

      const user = db.prepare("SELECT id, name, email, phone, cep, street, number, neighborhood, city, state, complement FROM users WHERE id = ?").get(decoded.userId) as any;

      res.json({ message: "Endereço atualizado com sucesso!", user });
    } catch (error) {
      console.error("Update address error:", error);
      res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    let { email, password, rememberMe } = req.body;

    if (typeof email === "string") email = email.trim().toLowerCase();

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Senha é obrigatória." });
    }

    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      // Security: Adjust expiration based on rememberMe
      const expiresIn = rememberMe ? "30d" : "24h";
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn });

      res.json({
        message: "Login realizado com sucesso!",
        token,
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          phone: user.phone,
          cep: user.cep,
          street: user.street,
          number: user.number,
          neighborhood: user.neighborhood,
          city: user.city,
          state: user.state,
          complement: user.complement
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao realizar login." });
    }
  });

  // Auth Me Route (Moved up for clarity)
  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const user = db.prepare("SELECT id, name, email, phone, cep, street, number, neighborhood, city, state, complement FROM users WHERE id = ?").get(decoded.userId) as any;
      
      if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
      
      res.json({ user });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
  });

  // Social Login Sync Route
  app.post("/api/auth/social-sync", async (req, res) => {
    const { email, name, provider } = req.body;

    if (!email) {
      return res.status(400).json({ error: "E-mail é necessário para o login social." });
    }

    try {
      // Check if user already exists
      let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

      if (!user) {
        // Create new user for social login (password is a random string since they login via OAuth)
        const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 12);
        const stmt = db.prepare(`
          INSERT INTO users (name, email, password)
          VALUES (?, ?, ?)
        `);
        const result = stmt.run(name || email.split('@')[0], email, placeholderPassword);
        user = { id: result.lastInsertRowid, name, email };
      }

      // Generate our app token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

      res.json({
        message: `Login com ${provider} sincronizado com sucesso!`,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          cep: user.cep,
          street: user.street,
          number: user.number,
          neighborhood: user.neighborhood,
          city: user.city,
          state: user.state,
          complement: user.complement
        }
      });
    } catch (error) {
      console.error("Social sync error:", error);
      res.status(500).json({ error: "Erro ao sincronizar login social." });
    }
  });

  // Stripe Checkout Route
  app.post("/api/checkout/create-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ 
        error: "Stripe não configurado. Por favor, adicione a chave STRIPE_SECRET_KEY ao seu ambiente." 
      });
    }

    const { items, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido." });
    }

    try {
      const line_items = items.map((item: any) => {
        // Ensure image is an absolute URL or omit it if it's relative
        const images = [];
        if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
          images.push(item.image);
        }

        return {
          price_data: {
            currency: "brl",
            product_data: {
              name: item.name,
              images: images,
              description: item.category || "Suplemento Nexus",
            },
            unit_amount: Math.round(item.price * 100), // Stripe expects amount in cents
          },
          quantity: item.quantity || 1,
        };
      });

      const origin = req.get("origin") || req.get("referer") || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        customer_email: customerEmail,
        success_url: `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
        shipping_address_collection: {
          allowed_countries: ["BR"],
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: "Falha ao criar sessão de checkout: " + error.message });
    }
  });

  // Vite middleware for development or if dist doesn't exist
  const distPath = path.join(process.cwd(), "dist");
  const distExists = fs.existsSync(distPath);

  // Always use Vite middleware for preview to ensure it renders correctly from source
  console.log("Using Vite middleware for preview...");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
/*
  if (process.env.NODE_ENV !== "production" || !distExists) {
    console.log(`Using Vite middleware (distExists: ${distExists})...`);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-XSS-Protection", "1; mode=block");
      }
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
*/

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
