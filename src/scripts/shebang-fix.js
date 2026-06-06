import fs from "fs";

const file = "src/cli.js";
const backup = "src/cli.js.shebang";

const mode = process.argv[2];

if (!mode || !["pre", "post"].includes(mode)) {
  console.error("Usage: node scripts/shebang-fix.js <pre|post>");
  process.exit(1);
}

if (mode === "pre") {
  const content = fs.readFileSync(file, "utf8");

  if (content.startsWith("#!")) {
    const firstLineEnd = content.indexOf("\n");
    const shebang = content.slice(0, firstLineEnd + 1);
    const rest = content.slice(firstLineEnd + 1);

    fs.writeFileSync(backup, shebang);
    fs.writeFileSync(file, rest);
  } else {
    console.log("ℹ no shebang found, skipping backup");
  }
}

if (mode === "post") {
  if (!fs.existsSync(backup)) {
    console.log("ℹ no backup found");
    process.exit(0);
  }

  const shebang = fs.readFileSync(backup, "utf8");
  const content = fs.readFileSync(file, "utf8");

  if (!content.startsWith("#!")) {
    fs.writeFileSync(file, shebang + content);
  }

  fs.unlinkSync(backup);
}
