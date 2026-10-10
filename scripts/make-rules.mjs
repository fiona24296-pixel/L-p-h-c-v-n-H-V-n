// In ra Security Rules đã điền email giáo viên.
// Cách dùng: node scripts/make-rules.mjs email@gmail.com
import { readFileSync } from "node:fs";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!/^[^@\s'"]+@[^@\s'"]+\.[^@\s'"]+$/.test(email)) {
  console.error("Cần truyền email hợp lệ: node scripts/make-rules.mjs email@gmail.com");
  process.exit(1);
}
const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
process.stdout.write(rules.replaceAll("__TEACHER_EMAIL__", email));
