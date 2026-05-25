import { Migration } from "@/lib/db/models/Migration";
import { Settings } from "@/lib/db/models/Settings";

interface MigrationDef {
  name: string;
  up: () => Promise<void>;
}

// ── Registered migrations (append only, never remove or reorder) ─────────────
const migrations: MigrationDef[] = [
  {
    name: "001_settings_schema_init",
    async up() {
      const count = await Settings.countDocuments();
      if (count === 0) {
        await Settings.create({
          siteName: "Halal Pizza Fun",
          delivery: {
            baseDeliveryFee: 9,
            pricePerKm: 3,
            freeDeliveryAbove: 500,
            taxPercentage: 8.5,
          },
          payment: { codEnabled: true },
        });
        console.log("[Migration] 001_settings_schema_init: default Settings document created");
      }
    },
  },
  {
    name: "002_idempotency_ttl_index",
    async up() {
      // IdempotencyKey TTL index is declared in the model schema; Mongoose
      // creates it automatically on connection. This migration is a no-op
      // placeholder that signals the index has been confirmed in production.
      console.log("[Migration] 002_idempotency_ttl_index: index managed by schema, no action needed");
    },
  },
];

// ── Runner: called once after the first successful MongoDB connect ─────────────
export async function runMigrations(): Promise<void> {
  try {
    const applied = new Set(
      (await Migration.find({}).select("name").lean()).map((m: any) => m.name)
    );

    for (const migration of migrations) {
      if (applied.has(migration.name)) continue;

      console.log(`[Migration] Running: ${migration.name}`);
      await migration.up();
      await Migration.create({ name: migration.name });
      console.log(`[Migration] Done: ${migration.name}`);
    }
  } catch (err) {
    console.error("[Migration] Runner failed:", err);
    // Non-fatal: app continues; alert on-call if this happens in prod
  }
}
