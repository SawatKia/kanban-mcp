import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backupDir = path.join(rootDir, "kanban_backup");

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Created backup directory: ${backupDir}`);
}

// Generate timestamp for filename: backup_YYYY-MM-DD_HHmmss.sql
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

console.log(`[${now.toISOString()}] Starting Kanban Database Backup...`);

try {
  // Execute pg_dump inside postgres container
  const dumpCommand = `docker compose --env-file "${path.join(rootDir, ".env")}" exec -T postgres pg_dump -U postgres planka`;
  const dumpOutput = execSync(dumpCommand, { cwd: rootDir, maxBuffer: 1024 * 1024 * 50 });
  fs.writeFileSync(backupFile, dumpOutput);
  console.log(`Backup completed successfully: ${backupFile} (${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB)`);
} catch (error) {
  console.error("Failed to execute database backup:", error.message);
  process.exit(1);
}

// Retention policy: Delete backups older than 30 days (30 * 24 * 60 * 60 * 1000 ms)
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const currentTime = Date.now();

try {
  const files = fs.readdirSync(backupDir);
  let deletedCount = 0;

  for (const file of files) {
    if (file.startsWith("backup_") && file.endsWith(".sql")) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const ageMs = currentTime - stats.mtimeMs;

      if (ageMs > RETENTION_MS) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup (>30 days): ${file}`);
        deletedCount++;
      }
    }
  }

  if (deletedCount === 0) {
    console.log("No outdated backups found to delete (>30 days).");
  }
} catch (err) {
  console.warn("Warning: Error during old backup cleanup:", err.message);
}
