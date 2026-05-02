import { Pool } from "pg";
import {
  FeedbackRecord,
  FeedbackStatus,
  RoutingRule,
  TeamMember
} from "@/lib/types";

const IS_POSTGRES_ENABLED = Boolean(process.env.DATABASE_URL);

interface MemoryStore {
  feedback: FeedbackRecord[];
  teamMembers: TeamMember[];
  routingRules: RoutingRule[];
}

const nowIso = () => new Date().toISOString();

const seededTeamMembers: TeamMember[] = [
  {
    id: "tm-csm-01",
    name: "Avery Patel",
    email: "avery@company.com",
    slackUserId: "UCSM001",
    roles: ["customer-success", "onboarding"],
    skills: ["onboarding", "support", "praise"],
    maxDailyLoad: 30,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "tm-product-01",
    name: "Mina Rodriguez",
    email: "mina@company.com",
    slackUserId: "UPRD001",
    roles: ["product-manager"],
    skills: ["feature-request", "integration", "churn-risk"],
    maxDailyLoad: 25,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "tm-eng-01",
    name: "Noah Chen",
    email: "noah@company.com",
    slackUserId: "UENG001",
    roles: ["engineering"],
    skills: ["bug-report", "security", "integration"],
    maxDailyLoad: 20,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "tm-billing-01",
    name: "Jordan Williams",
    email: "jordan@company.com",
    slackUserId: "UBIL001",
    roles: ["finance", "customer-success"],
    skills: ["billing", "churn-risk", "support"],
    maxDailyLoad: 35,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

const seededRules: RoutingRule[] = [
  {
    id: "rr-security-critical",
    name: "Security incidents route to engineering",
    enabled: true,
    category: "security",
    urgency: "critical",
    keywords: ["breach", "vulnerability", "security"],
    assignToTeamMemberId: "tm-eng-01",
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "rr-billing",
    name: "Billing issues route to finance",
    enabled: true,
    category: "billing",
    keywords: ["invoice", "refund", "charge", "billing"],
    assignToTeamMemberId: "tm-billing-01",
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: "rr-feature-request",
    name: "Feature requests route to product",
    enabled: true,
    category: "feature-request",
    keywords: ["feature", "roadmap", "improve", "wishlist"],
    assignToTeamMemberId: "tm-product-01",
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

const globalStore = globalThis as unknown as { __feedbackRouterStore?: MemoryStore };

function getMemoryStore(): MemoryStore {
  if (!globalStore.__feedbackRouterStore) {
    globalStore.__feedbackRouterStore = {
      feedback: [],
      teamMembers: seededTeamMembers,
      routingRules: seededRules
    };
  }
  return globalStore.__feedbackRouterStore;
}

let pool: Pool | null = null;
let schemaReady = false;

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!IS_POSTGRES_ENABLED || schemaReady) {
    return;
  }
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        slack_user_id TEXT,
        roles TEXT[] NOT NULL DEFAULT '{}',
        skills TEXT[] NOT NULL DEFAULT '{}',
        max_daily_load INTEGER NOT NULL DEFAULT 20,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS routing_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        channel TEXT,
        category TEXT,
        urgency TEXT,
        sentiment TEXT,
        keywords TEXT[] NOT NULL DEFAULT '{}',
        assign_to_team_member_id TEXT NOT NULL REFERENCES team_members(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        category TEXT NOT NULL,
        urgency TEXT NOT NULL,
        sentiment TEXT NOT NULL,
        confidence DOUBLE PRECISION NOT NULL,
        summary TEXT NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        assigned_team_member_id TEXT,
        recommended_team_member_id TEXT,
        matched_rule_id TEXT,
        status TEXT NOT NULL,
        source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const memberCount = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM team_members"
    );
    if (Number(memberCount.rows[0]?.count ?? "0") === 0) {
      for (const member of seededTeamMembers) {
        await client.query(
          `
          INSERT INTO team_members (
            id, name, email, slack_user_id, roles, skills, max_daily_load, active, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          `,
          [
            member.id,
            member.name,
            member.email,
            member.slackUserId ?? null,
            member.roles,
            member.skills,
            member.maxDailyLoad,
            member.active,
            member.createdAt,
            member.updatedAt
          ]
        );
      }
    }

    const rulesCount = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM routing_rules"
    );
    if (Number(rulesCount.rows[0]?.count ?? "0") === 0) {
      for (const rule of seededRules) {
        await client.query(
          `
          INSERT INTO routing_rules (
            id, name, enabled, channel, category, urgency, sentiment, keywords,
            assign_to_team_member_id, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          `,
          [
            rule.id,
            rule.name,
            rule.enabled,
            rule.channel ?? null,
            rule.category ?? null,
            rule.urgency ?? null,
            rule.sentiment ?? null,
            rule.keywords,
            rule.assignToTeamMemberId,
            rule.createdAt,
            rule.updatedAt
          ]
        );
      }
    }

    await client.query("COMMIT");
    schemaReady = true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function mapMemberRow(row: Record<string, unknown>): TeamMember {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    slackUserId: row.slack_user_id ? String(row.slack_user_id) : undefined,
    roles: Array.isArray(row.roles) ? (row.roles as string[]) : [],
    skills: Array.isArray(row.skills) ? (row.skills as TeamMember["skills"]) : [],
    maxDailyLoad: Number(row.max_daily_load),
    active: Boolean(row.active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

function mapRuleRow(row: Record<string, unknown>): RoutingRule {
  return {
    id: String(row.id),
    name: String(row.name),
    enabled: Boolean(row.enabled),
    channel: row.channel ? String(row.channel) as RoutingRule["channel"] : undefined,
    category: row.category ? String(row.category) as RoutingRule["category"] : undefined,
    urgency: row.urgency ? String(row.urgency) as RoutingRule["urgency"] : undefined,
    sentiment: row.sentiment ? String(row.sentiment) as RoutingRule["sentiment"] : undefined,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    assignToTeamMemberId: String(row.assign_to_team_member_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

function mapFeedbackRow(row: Record<string, unknown>): FeedbackRecord {
  return {
    id: String(row.id),
    channel: String(row.channel) as FeedbackRecord["channel"],
    customerName: row.customer_name ? String(row.customer_name) : undefined,
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    subject: row.subject ? String(row.subject) : undefined,
    message: String(row.message),
    category: String(row.category) as FeedbackRecord["category"],
    urgency: String(row.urgency) as FeedbackRecord["urgency"],
    sentiment: String(row.sentiment) as FeedbackRecord["sentiment"],
    confidence: Number(row.confidence),
    summary: String(row.summary),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    assignedTeamMemberId: row.assigned_team_member_id
      ? String(row.assigned_team_member_id)
      : undefined,
    recommendedTeamMemberId: row.recommended_team_member_id
      ? String(row.recommended_team_member_id)
      : undefined,
    matchedRuleId: row.matched_rule_id ? String(row.matched_rule_id) : undefined,
    status: String(row.status) as FeedbackStatus,
    sourceMetadata:
      row.source_metadata && typeof row.source_metadata === "object"
        ? (row.source_metadata as Record<string, unknown>)
        : {},
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  if (!IS_POSTGRES_ENABLED) {
    return getMemoryStore().teamMembers;
  }
  await ensureSchema();
  const result = await getPool().query("SELECT * FROM team_members ORDER BY name ASC");
  return result.rows.map((row) => mapMemberRow(row));
}

export async function upsertTeamMember(
  payload: Omit<TeamMember, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<TeamMember> {
  const id = payload.id ?? `tm-${crypto.randomUUID()}`;
  const timestamp = nowIso();

  if (!IS_POSTGRES_ENABLED) {
    const store = getMemoryStore();
    const existing = store.teamMembers.find((member) => member.id === id);
    const teamMember: TeamMember = {
      id,
      name: payload.name,
      email: payload.email,
      slackUserId: payload.slackUserId,
      roles: payload.roles,
      skills: payload.skills,
      maxDailyLoad: payload.maxDailyLoad,
      active: payload.active,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    if (existing) {
      Object.assign(existing, teamMember);
    } else {
      store.teamMembers.push(teamMember);
    }
    return teamMember;
  }

  await ensureSchema();
  await getPool().query(
    `
      INSERT INTO team_members (id, name, email, slack_user_id, roles, skills, max_daily_load, active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        slack_user_id = EXCLUDED.slack_user_id,
        roles = EXCLUDED.roles,
        skills = EXCLUDED.skills,
        max_daily_load = EXCLUDED.max_daily_load,
        active = EXCLUDED.active,
        updated_at = EXCLUDED.updated_at
    `,
    [
      id,
      payload.name,
      payload.email,
      payload.slackUserId ?? null,
      payload.roles,
      payload.skills,
      payload.maxDailyLoad,
      payload.active,
      timestamp,
      timestamp
    ]
  );
  const saved = await getPool().query("SELECT * FROM team_members WHERE id = $1", [id]);
  return mapMemberRow(saved.rows[0]);
}

export async function listRoutingRules(): Promise<RoutingRule[]> {
  if (!IS_POSTGRES_ENABLED) {
    return getMemoryStore().routingRules;
  }
  await ensureSchema();
  const result = await getPool().query(
    "SELECT * FROM routing_rules ORDER BY updated_at DESC"
  );
  return result.rows.map((row) => mapRuleRow(row));
}

export async function saveRoutingRules(rules: RoutingRule[]): Promise<RoutingRule[]> {
  const cleanedRules = rules.map((rule) => ({
    ...rule,
    id: rule.id || `rr-${crypto.randomUUID()}`,
    updatedAt: nowIso(),
    createdAt: rule.createdAt || nowIso()
  }));

  if (!IS_POSTGRES_ENABLED) {
    getMemoryStore().routingRules = cleanedRules;
    return cleanedRules;
  }

  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM routing_rules");
    for (const rule of cleanedRules) {
      await client.query(
        `
        INSERT INTO routing_rules (
          id, name, enabled, channel, category, urgency, sentiment, keywords,
          assign_to_team_member_id, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          rule.id,
          rule.name,
          rule.enabled,
          rule.channel ?? null,
          rule.category ?? null,
          rule.urgency ?? null,
          rule.sentiment ?? null,
          rule.keywords,
          rule.assignToTeamMemberId,
          rule.createdAt,
          rule.updatedAt
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const result = await getPool().query(
    "SELECT * FROM routing_rules ORDER BY updated_at DESC"
  );
  return result.rows.map((row) => mapRuleRow(row));
}

export async function createFeedback(
  feedback: Omit<FeedbackRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<FeedbackRecord> {
  const id = feedback.id ?? `fb-${crypto.randomUUID()}`;
  const timestamp = nowIso();
  const record: FeedbackRecord = {
    ...feedback,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (!IS_POSTGRES_ENABLED) {
    getMemoryStore().feedback.unshift(record);
    return record;
  }

  await ensureSchema();
  await getPool().query(
    `
      INSERT INTO feedback (
        id, channel, customer_name, customer_email, subject, message,
        category, urgency, sentiment, confidence, summary, tags,
        assigned_team_member_id, recommended_team_member_id, matched_rule_id,
        status, source_metadata, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
    `,
    [
      record.id,
      record.channel,
      record.customerName ?? null,
      record.customerEmail ?? null,
      record.subject ?? null,
      record.message,
      record.category,
      record.urgency,
      record.sentiment,
      record.confidence,
      record.summary,
      record.tags,
      record.assignedTeamMemberId ?? null,
      record.recommendedTeamMemberId ?? null,
      record.matchedRuleId ?? null,
      record.status,
      record.sourceMetadata,
      record.createdAt,
      record.updatedAt
    ]
  );

  return record;
}

export async function listFeedback(limit = 200): Promise<FeedbackRecord[]> {
  if (!IS_POSTGRES_ENABLED) {
    return getMemoryStore().feedback.slice(0, limit);
  }
  await ensureSchema();
  const result = await getPool().query(
    "SELECT * FROM feedback ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows.map((row) => mapFeedbackRow(row));
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  assignedTeamMemberId?: string
): Promise<void> {
  if (!IS_POSTGRES_ENABLED) {
    const store = getMemoryStore();
    const record = store.feedback.find((item) => item.id === feedbackId);
    if (!record) {
      return;
    }
    record.status = status;
    if (assignedTeamMemberId) {
      record.assignedTeamMemberId = assignedTeamMemberId;
    }
    record.updatedAt = nowIso();
    return;
  }

  await ensureSchema();
  await getPool().query(
    `
      UPDATE feedback
      SET status = $1,
          assigned_team_member_id = COALESCE($2, assigned_team_member_id),
          updated_at = NOW()
      WHERE id = $3
    `,
    [status, assignedTeamMemberId ?? null, feedbackId]
  );
}

export async function getOpenLoadByMember(): Promise<Record<string, number>> {
  const feedback = await listFeedback(2000);
  return feedback.reduce<Record<string, number>>((acc, item) => {
    if (!item.assignedTeamMemberId) {
      return acc;
    }
    if (item.status === "resolved") {
      return acc;
    }
    acc[item.assignedTeamMemberId] = (acc[item.assignedTeamMemberId] ?? 0) + 1;
    return acc;
  }, {});
}
