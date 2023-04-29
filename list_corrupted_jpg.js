const fs = require('fs');
const { promisify } = require('util');
const read = promisify(fs.read);
const unlink = promisify(fs.unlink);
const { join } = require('path');

const directory = process.argv[2];
const removeCorruptedFlag = process.argv[3] === '-r';

if (!directory) {
  console.error('Usage: node filter.js <directory> [-r]');
  return;
}

(async function walk(dir) {
  try {
    const files = await promisify(fs.readdir)(dir);

    for (const filename of files) {
      const filepath = join(dir, filename);

      try {
        const stat = await promisify(fs.stat)(filepath);

        if (stat.isDirectory()) {
          await walk(filepath);
        } else if (stat.isFile()) {
          const fd = await promisify(fs.open)(filepath, 'r');
          const buffer = Buffer.alloc(3);
          await read(fd, buffer, 0, 3, 0);
          await promisify(fs.close)(fd);

          if (!isValidJpeg(buffer)) {
            console.log(`${filename} is not a valid JPEG or JPG file`);
          } else if (await isCorruptedJpeg(filepath)) {
            console.log(`${filename} is a corrupted JPEG or JPG file`);

            if (removeCorruptedFlag) {
              await unlink(filepath);
              console.log(`${filename} has been removed`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing ${filename}: ${err}`);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err}`);
  }
})(directory);

async function isCorruptedJpeg(filepath) {
  try {
    const buffer = await promisify(fs.readFile)(filepath);
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) {
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error checking if ${filepath} is corrupted: ${err}`);
    return true;
  }
}

function isValidJpeg(buffer) {
  return (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff);
}

