const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

const directory = process.argv[2];
const removeDuplicates = process.argv[3] === '-r';

if (!directory) {
  console.error('Usage: node find_duplicates.js <directory> [-r]');
  return;
}

(async function main() {
  const hashes = new Map();
  const duplicates = new Set();
  try {
    const files = await getFiles(directory);
    for (const file of files) {
      try {
        const fileHash = await getFileHash(file);
        const existingFile = hashes.get(fileHash);

        if (existingFile) {
          duplicates.add(file);
          if (removeDuplicates) {
            console.log(`Removing duplicate file ${file}`);
            await unlink(file);
          } else {
            console.log(`${file} and ${existingFile} are duplicates.`);
          }
        } else {
          hashes.set(fileHash, file);
        }
      } catch (err) {
        console.error(`Error processing file ${file}: ${err}`);
      }
    }
    if (removeDuplicates) {
      console.log(`Removed ${duplicates.size} duplicate files.`);
    }
  } catch (err) {
    console.error(`Error reading directory ${directory}: ${err}`);
  }
})();

async function getFiles(dir) {
  const files = await readdir(dir);
  const allFiles = await Promise.all(files.map(async (file) => {
    const fullPath = `${dir}/${file}`;
    const fileStat = await stat(fullPath);
    if (fileStat.isDirectory()) {
      return getFiles(fullPath);
    } else {
      return fullPath;
    }
  }));
  return Array.prototype.concat(...allFiles);
}

async function getFileHash(file) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(file);
  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

