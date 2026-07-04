export interface SqlMigration {
  version: number;
  statements: string[];
}

export const SQL_MIGRATIONS: SqlMigration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS drafts (
        locale TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS published_cache (
        locale TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        commit_sha TEXT,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS publish_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        state TEXT NOT NULL,
        commit_sha TEXT,
        run_url TEXT,
        started_at INTEGER,
        finished_at INTEGER,
        error TEXT
      )`,
      `INSERT OR IGNORE INTO publish_state (id, state, commit_sha, run_url, started_at, finished_at, error)
       VALUES (1, 'idle', NULL, NULL, NULL, NULL, NULL)`,
    ],
  },
];

export function ensureMigrationsTable(sql: SqlStorage): void {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
}

export function getAppliedMigrationVersions(sql: SqlStorage): Set<number> {
  ensureMigrationsTable(sql);
  const versions = new Set<number>();
  for (const row of sql.exec('SELECT version FROM _sql_schema_migrations')) {
    versions.add(row.version as number);
  }
  return versions;
}

export function runMigrations(sql: SqlStorage): void {
  const applied = getAppliedMigrationVersions(sql);
  const now = Date.now();

  for (const migration of SQL_MIGRATIONS) {
    if (applied.has(migration.version)) {
      continue;
    }
    for (const statement of migration.statements) {
      sql.exec(statement);
    }
    sql.exec(
      'INSERT INTO _sql_schema_migrations (version, applied_at) VALUES (?, ?)',
      migration.version,
      now,
    );
  }
}

export function isPublishedCacheEmpty(sql: SqlStorage): boolean {
  const row = sql.exec('SELECT COUNT(*) AS count FROM published_cache').one();
  return (row?.count as number) === 0;
}
