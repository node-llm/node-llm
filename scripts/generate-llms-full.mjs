import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, "../docs");
const OUTPUT_FILE = path.join(DOCS_DIR, "llms-full.txt");

// Order matters for context!
// We want to present the high-level concepts first, then details.
const PATTERN = [
  "llms.txt", // Start with the summary
  "intro.md",
  "getting_started/**/*.md",
  "core-features/**/*.md",
  "providers/**/*.md",
  "orm/**/*.md",
  "advanced/**/*.md"
];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== "_site" && file !== ".jekyll-cache") {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith(".md") || file === "llms.txt") {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

// Simple glob-like matcher
function matchesPattern(filePath, pattern) {
  const relativePath = path.relative(DOCS_DIR, filePath);

  if (pattern.includes("**")) {
    const parts = pattern.split("/**/");
    const dir = parts[0];
    return relativePath.startsWith(dir);
  }
  return relativePath === pattern;
}

function generate() {
  console.log("Generating llms-full.txt...");

  // Get all potential files
  const allFiles = getAllFiles(DOCS_DIR);

  // Sort them based on our preferred reading order
  const sortedFiles = [];
  const seen = new Set();

  // 1. Add files matching explicit patterns first
  PATTERN.forEach((pattern) => {
    allFiles.forEach((file) => {
      if (!seen.has(file) && matchesPattern(file, pattern)) {
        sortedFiles.push(file);
        seen.add(file);
      }
    });
  });

  // 2. Add any remaining markdown files (appendices)
  allFiles.forEach((file) => {
    if (!seen.has(file)) {
      sortedFiles.push(file);
    }
  });

  let content = "# NodeLLM Full Documentation\n\n";
  content += "> Auto-generated context for LLMs containing all project documentation.\n\n";

  sortedFiles.forEach((file) => {
    const relativePath = path.relative(DOCS_DIR, file);
    if (relativePath === "llms-full.txt") return;

    console.log(`Adding ${relativePath}`);

    const fileContent = fs.readFileSync(file, "utf8");

    content += `\n\n<!-- FILE: ${relativePath} -->\n`;
    content += `\n# 📄 ${relativePath}\n\n`;
    content += fileContent;
    content += `\n\n<!-- END FILE: ${relativePath} -->\n`;
    content += "-".repeat(40);
  });

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`\n✅ Generated ${OUTPUT_FILE} (${(content.length / 1024).toFixed(2)} KB)`);
}

generate();
