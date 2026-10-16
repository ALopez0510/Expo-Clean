UPDATE roles
SET permissions = '{
  "apu:read": true,
  "budget:read": true,
  "budget:write": true,
  "budget:delete": true,
  "budget:quantity": true,
  "settings:write": true,
  "workflow:internal-read": true,
  "workflow:submit-technical": true,
  "comments:create": true,
  "documents:read": true,
  "documents:preview": true,
  "proposal:read": true,
  "proposal:view": true,
  "proposal:generate": true,
  "proposal:send": true,
  "scenario:read": true,
  "scenario:create": true,
  "scenario:write": true,
  "scenario:delete": true,
  "scenario:adjust": true,
  "scenario:optimize": true,
  "scenario:conservative": true,
  "scenario:promote": true,
  "price:read": true,
  "price:apply": true,
  "variance:read": true,
  "risk:read": true,
  "dashboard:view": true,
  "dashboard:internal": true,
  "dashboard:financial": true,
  "dashboard:risk": true,
  "audit:view": true
}'::jsonb
WHERE id = 'ROLE-PRESUPUESTISTA';

UPDATE roles
SET permissions = '{
  "budget:read": true,
  "workflow:internal-read": true,
  "workflow:technical-review": true,
  "workflow:technical-approve": true,
  "workflow:technical-reject": true,
  "comments:create": true,
  "documents:read": true,
  "documents:preview": true,
  "scenario:read": true,
  "variance:read": true,
  "risk:read": true,
  "dashboard:view": true,
  "dashboard:internal": true,
  "dashboard:financial": true,
  "dashboard:risk": true,
  "audit:view": true
}'::jsonb
WHERE id = 'ROLE-REVISOR';

UPDATE roles
SET permissions = '{
  "budget:read": true,
  "workflow:internal-read": true,
  "workflow:financial-review": true,
  "workflow:financial-approve": true,
  "workflow:financial-reject": true,
  "comments:create": true,
  "documents:read": true,
  "documents:preview": true,
  "proposal:read": true,
  "proposal:view": true,
  "proposal:generate": true,
  "proposal:send": true,
  "scenario:read": true,
  "scenario:create": true,
  "scenario:write": true,
  "scenario:adjust": true,
  "scenario:promote": true,
  "price:read": true,
  "price:apply": true,
  "variance:read": true,
  "risk:read": true,
  "dashboard:view": true,
  "dashboard:internal": true,
  "dashboard:financial": true,
  "dashboard:risk": true,
  "audit:view": true
}'::jsonb
WHERE id = 'ROLE-FINANCIERO';

UPDATE roles
SET permissions = '{
  "budget:read": true,
  "workflow:internal-read": true,
  "workflow:management-review": true,
  "workflow:management-approve": true,
  "workflow:management-reject": true,
  "comments:create": true,
  "documents:read": true,
  "documents:preview": true,
  "proposal:read": true,
  "proposal:view": true,
  "contract:read": true,
  "contract:sign": true,
  "scenario:read": true,
  "variance:read": true,
  "risk:read": true,
  "dashboard:view": true,
  "dashboard:internal": true,
  "dashboard:financial": true,
  "dashboard:risk": true,
  "audit:view": true
}'::jsonb
WHERE id = 'ROLE-GERENTE';

UPDATE roles
SET permissions = '{
  "budget:read": true,
  "proposal:read": true,
  "proposal:view": true,
  "proposal:approve": true,
  "proposal:request-changes": true,
  "comments:create-client": true,
  "contract:read": true,
  "contract:sign": true,
  "workflow:client-approve": true,
  "workflow:client-request-changes": true,
  "workflow:changes-return": true,
  "dashboard:view": true
}'::jsonb
WHERE id = 'ROLE-CLIENTE';

UPDATE roles
SET permissions = '{
  "budget:read": true,
  "workflow:internal-read": true,
  "legal:read": true,
  "documents:read": true,
  "documents:preview": true,
  "proposal:read": true,
  "proposal:view": true,
  "legal:review": true,
  "legal:approve": true,
  "legal:request-changes": true,
  "contract:create": true,
  "contract:read": true,
  "contract:approve-signature": true,
  "comments:create": true,
  "workflow:legal-review": true,
  "workflow:legal-approve": true,
  "workflow:legal-request-changes": true,
  "dashboard:view": true,
  "dashboard:internal": true,
  "audit:view": true
}'::jsonb
WHERE id = 'ROLE-LEGAL';
