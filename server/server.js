import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import session from "express-session";
import { authenticate, findUserById } from "./auth.js";
import { databaseIdentity } from "./db.js";
import { ApiError } from "./errors.js";
import { listCore } from "./repositories/core-repository.js";
import { getApu, listApus } from "./repositories/apu-repository.js";
import {
  createCleaningProduct,
  deactivateCleaningProduct,
  getCleaningProduct,
  listCleaningProducts,
  listCleaningProductsForApu,
  updateCleaningProduct,
} from "./repositories/cleaning-product-repository.js";
import {
  addBudgetItem,
  deleteBudgetItem,
  getBudgetWithItems,
  updateBudgetItem,
  updateBudgetSnapshot,
} from "./repositories/budget-repository.js";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SERVER_DIR, "..");
const PORT = 8000;
const HOST = "127.0.0.1";
const SESSION_COOKIE = "connect.sid";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function requireObjectBody(request) {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    throw new ApiError("El cuerpo debe ser un objeto JSON.", 400, "INVALID_JSON");
  }
  return request.body;
}

async function currentUser(request) {
  if (request.session.userId === undefined || request.session.userId === null) return null;
  return findUserById(request.session.userId);
}

const requireAuth = asyncRoute(async (request, _response, next) => {
  const user = await currentUser(request);
  if (!user) throw new ApiError("Autenticación requerida.", 401, "AUTH_REQUIRED");
  request.user = user;
  next();
});

function hasPermission(user, permission) {
  const permissions = user?.role?.permissions;
  if (permissions === "*") return true;
  if (Array.isArray(permissions)) return permissions.includes(permission);
  return Boolean(permissions && typeof permissions === "object" && permissions[permission] === true);
}

function requireCleaningProductWrite(request, _response, next) {
  if (!hasPermission(request.user, "budget:write")) {
    next(new ApiError("No tienes permisos para administrar productos de limpieza.", 403, "FORBIDDEN"));
    return;
  }
  next();
}

function regenerateSession(request) {
  return new Promise((resolve, reject) => {
    request.session.regenerate(error => error ? reject(error) : resolve());
  });
}

function saveSession(request) {
  return new Promise((resolve, reject) => {
    request.session.save(error => error ? reject(error) : resolve());
  });
}

function destroySession(request) {
  return new Promise(resolve => request.session.destroy(() => resolve()));
}

app.get("/", (_request, response) => response.sendFile(path.join(PROJECT_ROOT, "index.html")));

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.get("/api/health/db", asyncRoute(async (_request, response) => {
  const identity = await databaseIdentity();
  if (identity.database !== "al_bd" || identity.user !== "al_app") {
    throw new ApiError("La identidad de la base de datos no coincide con la configuración esperada.", 503, "DATABASE_IDENTITY_MISMATCH");
  }
  response.json({ status: "ok", database: identity.database, user: identity.user });
}));

app.post("/api/login", asyncRoute(async (request, response) => {
  const body = requireObjectBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = body.password;
  if (!email || typeof password !== "string" || !password) {
    throw new ApiError("Correo y contraseña son obligatorios.", 400, "INVALID_CREDENTIALS");
  }
  const user = await authenticate(email, password);
  if (!user) throw new ApiError("Correo o contraseña incorrectos.", 401, "INVALID_CREDENTIALS");
  await regenerateSession(request);
  request.session.userId = user.id;
  request.session.permanent = true;
  await saveSession(request);
  response.json({ user });
}));

app.get("/api/me", requireAuth, (request, response) => response.json({ user: request.user }));

app.post("/api/logout", asyncRoute(async (request, response) => {
  await destroySession(request);
  response.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: process.env.SESSION_COOKIE_SECURE === "true" });
  response.json({ ok: true });
}));

app.get("/api/roles", requireAuth, asyncRoute(async (_request, response) => response.json({ roles: await listCore("roles") })));
app.get("/api/users", requireAuth, asyncRoute(async (_request, response) => response.json({ users: await listCore("users") })));
app.get("/api/clients", requireAuth, asyncRoute(async (_request, response) => response.json({ clients: await listCore("clients") })));
app.get("/api/projects", requireAuth, asyncRoute(async (_request, response) => response.json({ projects: await listCore("projects") })));
app.get("/api/apus", requireAuth, asyncRoute(async (_request, response) => response.json({ apus: await listApus() })));
app.get("/api/cleaning-products", requireAuth, asyncRoute(async (request, response) => response.json({
  items: await listCleaningProducts(request.query),
})));
app.post("/api/cleaning-products", requireAuth, requireCleaningProductWrite, asyncRoute(async (request, response) => response.status(201).json({
  product: await createCleaningProduct(requireObjectBody(request)),
})));
app.put("/api/cleaning-products/:id", requireAuth, requireCleaningProductWrite, asyncRoute(async (request, response) => response.json({
  product: await updateCleaningProduct(request.params.id, requireObjectBody(request)),
})));
app.patch("/api/cleaning-products/:id", requireAuth, requireCleaningProductWrite, asyncRoute(async (request, response) => response.json({
  product: await updateCleaningProduct(request.params.id, requireObjectBody(request)),
})));
app.delete("/api/cleaning-products/:id", requireAuth, requireCleaningProductWrite, asyncRoute(async (request, response) => response.json({
  product: await deactivateCleaningProduct(request.params.id),
})));
app.get("/api/cleaning-products/:id", requireAuth, asyncRoute(async (request, response) => response.json({
  product: await getCleaningProduct(request.params.id),
})));
app.get("/api/apus/:apuId/cleaning-products", requireAuth, asyncRoute(async (request, response) => response.json({
  items: await listCleaningProductsForApu(request.params.apuId),
})));
app.get("/api/apus/:apuId", requireAuth, asyncRoute(async (request, response) => response.json({ apu: await getApu(request.params.apuId) })));
app.get("/api/budgets/:budgetId", requireAuth, asyncRoute(async (request, response) => response.json(await getBudgetWithItems(request.params.budgetId))));
app.patch("/api/budgets/:budgetId", requireAuth, asyncRoute(async (request, response) => response.json({ budget: await updateBudgetSnapshot(request.params.budgetId, requireObjectBody(request)) })));
app.post("/api/budgets/:budgetId/items", requireAuth, asyncRoute(async (request, response) => response.status(201).json({ item: await addBudgetItem(request.params.budgetId, requireObjectBody(request)) })));
app.patch("/api/budget-items/:itemId", requireAuth, asyncRoute(async (request, response) => response.json({ item: await updateBudgetItem(request.params.itemId, requireObjectBody(request)) })));
app.delete("/api/budget-items/:itemId", requireAuth, asyncRoute(async (request, response) => response.json(await deleteBudgetItem(request.params.itemId, request.body || {}))));

app.use((_request, _response, next) => next(new ApiError("Ruta no encontrada.", 404, "NOT_FOUND")));

app.use((error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } });
});

export function startServer() {
  return app.listen(PORT, HOST, () => {
    console.log(`BuildCost escuchando en http://${HOST}:${PORT}`);
  });
}

const entrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entrypoint === import.meta.url) startServer();
