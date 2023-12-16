import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const whitelist = [
  "node_modules",
  "src",
  ".gitignore",
  ".npmignore",
  "CHANGELOG.md",
  "clean.mjs",
  "package.json",
  "README.md",
  "tsconfig.json",
  "typedoc.json",
];

function removeFilesExceptWhitelist(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file);

      // Check if the file is in the whitelist
      if (!whitelist.includes(file)) {
        // Check if it's a file or a directory
        fs.stat(filePath, (statErr, stats) => {
          if (statErr) {
            console.error("Error getting file stats:", statErr);
            return;
          }

          if (stats.isDirectory()) {
            // If it's a directory, recursively remove it
            removeFilesExceptWhitelist(filePath);
          } else {
            // If it's a file, unlink it
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Error deleting file:", unlinkErr);
              } else {
                console.log(`Removed: ${filePath}`);
              }
            });
          }
        });
      }
    });
  });
}

// Call the function with the current directory
removeFilesExceptWhitelist(__dirname);
