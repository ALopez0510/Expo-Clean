import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import { app } from "../server/server.js";
import { DB_CONFIG } from "../server/db.js";

const projectRoot = new URL("../", import.meta.url);
let testServer;
let baseUrl;

before(async () => {
  testServer = await new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.once("error", reject);
  });
  const address = testServer.address();
  assert.equal(address.address, "127.0.0.1");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  testServer.closeIdleConnections?.();
  testServer.closeAllConnections?.();
  await new Promise((resolve, reject) => testServer.close(error => error ? reject(error) : resolve()));
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = text;
  try { body = JSON.parse(text); } catch (_error) { /* HTML response */ }
  return { response, body };
}

describe("Express runtime contract", () => {
  it("binds the test server to loopback and serves the SPA", async () => {
    const { response, body } = await request("/");
    assert.equal(response.status, 200);
    assert.match(body, /<html/i);
  });

  it("exposes a database-independent health route", async () => {
    const { response, body } = await request("/api/health");
    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok" });
  });

  it("exposes a sanitized database health contract for the configured state", async () => {
    const { response, body } = await request("/api/health/db");
    if (DB_CONFIG.password) {
      assert.equal(response.status, 200);
      assert.deepEqual(body, { status: "ok", database: "al_bd", user: "al_app" });
    } else {
      assert.equal(response.status, 503);
      assert.deepEqual(body, {
        error: {
          code: "DB_PASSWORD_NOT_CONFIGURED",
          message: "DB_PASSWORD_NOT_CONFIGURED",
        },
      });
    }
  });

  it("requires a session for identity and protected data routes", async () => {
    const me = await request("/api/me");
    assert.equal(me.response.status, 401);
    assert.equal(me.body.error.code, "AUTH_REQUIRED");

    const roles = await request("/api/roles");
    assert.equal(roles.response.status, 401);
    assert.equal(roles.body.error.code, "AUTH_REQUIRED");

    const protectedRoutes = [
      ["/api/users"],
      ["/api/clients"],
      ["/api/projects"],
      ["/api/apus"],
      ["/api/cleaning-products"],
      ["/api/cleaning-products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }],
      ["/api/cleaning-products/PRD-DEMO-001"],
      ["/api/cleaning-products/PRD-DEMO-001", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }],
      ["/api/cleaning-products/PRD-DEMO-001", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }],
      ["/api/cleaning-products/PRD-DEMO-001", { method: "DELETE" }],
      ["/api/apus/APU-DEMO-001/cleaning-products"],
      ["/api/apus/APU-001"],
      ["/api/budgets/BUD-001"],
      ["/api/budget-items/ITEM-001", { method: "PATCH", headers: { "content-type": "application/json" }, body: "{}" }],
    ];
    for (const [path, options] of protectedRoutes) {
      const protectedResponse = await request(path, options);
      assert.equal(protectedResponse.response.status, 401, path);
      assert.equal(protectedResponse.body.error.code, "AUTH_REQUIRED", path);
    }
  });

  it("exposes login and logout contracts without accepting malformed credentials", async () => {
    const login = await request("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(login.response.status, 400);
    assert.equal(login.body.error.code, "INVALID_CREDENTIALS");

    const logout = await request("/api/logout", { method: "POST" });
    assert.equal(logout.response.status, 200);
    assert.deepEqual(logout.body, { ok: true });
  });
});

describe("frontend security contract", () => {
  it("uses the relative API client and keeps database credentials out of index.html", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /const apiClient/);
    assert.match(html, /apiClient\.login/);
    assert.match(html, /apiClient\.getMe/);
    assert.match(html, /apiClient\.logout/);
    assert.match(html, /cdn\.jsdelivr\.net\/npm\/chart\.js/i);
    assert.match(html, /const chartRegistry/);
    assert.match(html, /data-view="cleaning-products"/);
    assert.match(html, /apiClient\.getCleaningProducts/);
    assert.match(html, /apiClient\.createCleaningProduct/);
    assert.match(html, /apiClient\.updateCleaningProduct/);
    assert.match(html, /apiClient\.deactivateCleaningProduct/);
    assert.match(html, /function canManageCleaningProducts\(\)/);
    assert.match(html, /function renderCleaningProductEditor\(\)/);
    assert.match(html, /PRODUCT_CREATED/);
    assert.match(html, /PRODUCT_UPDATED/);
    assert.match(html, /PRODUCT_DEACTIVATED/);
    assert.match(html, /function renderCleaningProductsView\(\)/);
    assert.doesNotMatch(html, /PRD-DEMO-\d{3}/);
    assert.doesNotMatch(html, /DB_PASSWORD\s*=/i);
    assert.doesNotMatch(html, /postgresql:\/\//i);
    assert.doesNotMatch(html, /password_hash/i);
    assert.doesNotMatch(html, /desktop-o7rhpvg\.taila61603\.ts\.net/i);
    assert.doesNotMatch(html, /id=["']roleSwitcher["']/i);
    assert.doesNotMatch(html, /function\s+switchRole\s*\(/i);
    assert.doesNotMatch(html, /Demo(?:Presu|Revisor|Finanzas|Gerente|Cliente|Legal)2026!/i);
  });
});

describe("cleaning product CRUD contract", () => {
  it("uses the repository validation and logical deactivation path without physical deletes", async () => {
    const repository = await readFile(new URL("../server/repositories/cleaning-product-repository.js", import.meta.url), "utf8");
    const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
    assert.match(repository, /export async function createCleaningProduct/);
    assert.match(repository, /export async function updateCleaningProduct/);
    assert.match(repository, /export async function deactivateCleaningProduct/);
    assert.match(repository, /SKU_EXISTS/);
    assert.match(repository, /purchasePrice/);
    assert.match(repository, /contentQuantity/);
    assert.match(repository, /"active"\s*=\s*FALSE/);
    assert.doesNotMatch(repository, /DELETE\s+FROM\s+"cleaning_products"/i);
    assert.match(server, /app\.post\("\/api\/cleaning-products"/);
    assert.match(server, /app\.put\("\/api\/cleaning-products\/:id"/);
    assert.match(server, /app\.patch\("\/api\/cleaning-products\/:id"/);
    assert.match(server, /app\.delete\("\/api\/cleaning-products\/:id"/);
    assert.match(server, /requireCleaningProductWrite/);
    assert.match(server, /budget:write/);
  });
});

describe("APU cleaning product detail contract", () => {
  it("keeps legacy components and renders product relations through the APU detail flow", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const repository = await readFile(new URL("../server/repositories/cleaning-product-repository.js", import.meta.url), "utf8");
    const demoSeed = await readFile(new URL("../tools/demo_data.py", import.meta.url), "utf8");
    assert.match(html, /getApuCleaningProducts: apuId/);
    assert.match(html, /function renderApuDetailDrawer\(\)/);
    assert.match(html, /function calculateApuCleaningProductCost\(relation\)/);
    assert.match(html, /consumptionPerUnit/);
    assert.match(html, /components JSONB/);
    assert.match(html, /data-action="open-apu-detail"/);
    assert.match(html, /data-action="retry-apu-cleaning-products"/);
    assert.match(html, /No se pudieron cargar los productos de limpieza/);
    assert.match(repository, /acp\."product_id" AS linked_product_id/);
    assert.match(demoSeed, /\("APU-DEMO-004", "PRD-DEMO-006"/);
    assert.match(demoSeed, /\("APU-DEMO-007", "PRD-DEMO-001"/);
    const priceFunction = html.match(/function getApuCleaningProductPrice\(relation\) \{[\s\S]*?\n    \}/)?.[0];
    const costFunction = html.match(/function calculateApuCleaningProductCost\(relation\) \{[\s\S]*?\n    \}/)?.[0];
    assert.ok(priceFunction && costFunction, "APU product cost functions not found");
    const calculateCost = Function(`${priceFunction}\n${costFunction}\nreturn calculateApuCleaningProductCost;`)();
    assert.equal(calculateCost({ consumptionPerUnit: 0.02, purchasePrice: 19.75 }), 0.395);
    assert.equal(calculateCost({ consumptionPerUnit: 0, purchasePrice: 19.75 }), 0);
    assert.equal(calculateCost({ consumptionPerUnit: -1, purchasePrice: 19.75 }), null);
    assert.equal(calculateCost({ consumptionPerUnit: 0.02, purchasePrice: null, unitPriceSnapshot: 19.75 }), 0.395);
  });
});

describe("authenticated frontend identity contract", () => {
  it("accepts Ana and Carlos before API hydration using only the safe /api/me payload", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const functionMatch = html.match(/function applyAuthenticatedUser\(user\) \{[\s\S]*?\n    \}/);
    assert.ok(functionMatch, "applyAuthenticatedUser() not found");

    const createState = () => ({
      data: {
        users: [{ id: "USR-001", name: "Ana Presupuesto", email: "presupuestista@buildcost.local", role: "Presupuestista", active: true }],
      },
      session: { currentUserId: "USR-001", currentRole: "Presupuestista", permissions: [], isAuthenticated: false },
      ui: { activeView: "dashboard" },
    });
    const rolePermissions = {};
    const normalizePermissions = value => {
      if (Array.isArray(value)) return value.filter(Boolean).map(String);
      if (value && typeof value === "object") return Object.entries(value).filter(([, enabled]) => enabled === true).map(([permission]) => permission);
      return [];
    };
    const createApplyAuthenticatedUser = appState => Function(
      "appState",
      "rolePermissions",
      "normalizePermissions",
      "getDefaultViewForRole",
      "canViewForRole",
      `${functionMatch[0]}; return applyAuthenticatedUser;`,
    )(
      appState,
      rolePermissions,
      normalizePermissions,
      role => role === "Cliente" ? "client-portal" : "dashboard",
      () => true,
    );
    const users = [
      {
        label: "Ana",
        state: createState(),
        payload: {
          id: "USR-001",
          name: "Ana Presupuesto",
          email: "presupuestista@buildcost.local",
          role: { id: "ROLE-PRESUPUESTISTA", name: "Presupuestista", permissions: { "budget:read": true } },
        },
      },
      {
        label: "Carlos",
        state: createState(),
        payload: {
          id: "USR-REV-001",
          name: "Carlos Revisor",
          email: "revisor@buildcost.local",
          role: { id: "ROLE-REVISOR", name: "Revisor Técnico", permissions: { "budget:read": true, "workflow:technical-review": true } },
        },
      },
    ];

    for (const { label, state, payload } of users) {
      const accepted = createApplyAuthenticatedUser(state)(payload);
      assert.equal(accepted, true, label);
      assert.equal(state.session.currentUserId, payload.id, label);
      assert.equal(state.session.currentRole, payload.role.name, label);
      assert.deepEqual(state.session.permissions, payload.role.permissions, label);
      const localUser = state.data.users.find(user => user.id === payload.id);
      assert.deepEqual(localUser, {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role.name,
        permissions: Object.keys(payload.role.permissions),
        active: true,
      }, label);
      assert.equal(Object.prototype.hasOwnProperty.call(localUser, "password"), false, label);
      assert.equal(Object.prototype.hasOwnProperty.call(localUser, "password_hash"), false, label);
    }
  });
});

describe("user seed removal contract", () => {
  it("does not expose a seed script or seed npm command", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    assert.equal(packageJson.scripts["seed:users"], undefined);
    await assert.rejects(
      () => readFile(new URL("../server/seed-users.js", import.meta.url), "utf8"),
      error => error?.code === "ENOENT",
    );
  });

  it("keeps bcrypt comparison in authentication and does not mutate users during login", async () => {
    const authSource = await readFile(new URL("../server/auth.js", import.meta.url), "utf8");
    const serverSource = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
    assert.match(authSource, /bcrypt\.compare\(/);
    assert.doesNotMatch(serverSource, /INSERT\s+INTO\s+users/i);
    assert.doesNotMatch(serverSource, /UPDATE\s+users/i);
  });
});

describe("role permissions synchronization contract", () => {
  it("matches every SQL JSONB permission key to the frontend rolePermissions contract", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const rolePermissionsMatch = html.match(/const rolePermissions = ([\s\S]*?\n    });/);
    assert.ok(rolePermissionsMatch, "rolePermissions block not found in index.html");
    const frontendPermissions = Function(`return (${rolePermissionsMatch[1]})`)();
    const roleIds = {
      "Presupuestista": "ROLE-PRESUPUESTISTA",
      "Revisor Técnico": "ROLE-REVISOR",
      "Director Financiero": "ROLE-FINANCIERO",
      "Gerente General": "ROLE-GERENTE",
      "Cliente": "ROLE-CLIENTE",
      "Oficial Legal": "ROLE-LEGAL",
    };
    const sql = await readFile(new URL("../server/migrations/002_sync_role_permissions.sql", import.meta.url), "utf8");
    const updates = [...sql.matchAll(/UPDATE\s+roles\s+SET\s+permissions\s*=\s*'([\s\S]*?)'::jsonb\s+WHERE\s+id\s*=\s*'([^']+)'\s*;/gi)];

    assert.equal(updates.length, 6);
    assert.equal((sql.match(/^\s*UPDATE\s+roles\b/gim) || []).length, 6);
    assert.doesNotMatch(sql, /^\s*(INSERT|DELETE|ALTER|CREATE|DROP)\b/im);

    for (const [roleName, roleId] of Object.entries(roleIds)) {
      const update = updates.find(([, , id]) => id === roleId);
      assert.ok(update, `missing SQL update for ${roleId}`);
      const permissions = JSON.parse(update[1]);
      const expected = frontendPermissions[roleName];
      assert.deepEqual(Object.keys(permissions), expected, roleName);
      assert.ok(Object.values(permissions).every(value => value === true), roleName);
      assert.equal(new Set(Object.keys(permissions)).size, expected.length, roleName);
    }
  });
});
