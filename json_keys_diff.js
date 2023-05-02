const fs = require('fs');


// Check if command line arguments are provided
if (process.argv.length < 4) {
  console.log('Usage: node index.js file1.json file2.json');
  process.exit(1);
}

// Get the file paths from the command line arguments
const filePath1 = process.argv[2];
const filePath2 = process.argv[3];

// Read the first JSON file
const file1 = fs.readFileSync(filePath1);
const obj1 = JSON.parse(file1);

// Read the second JSON file
const file2 = fs.readFileSync(filePath2);
const obj2 = JSON.parse(file2);

// Recursively get all keys for an object
function getKeys(obj) {
  let keys = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
      if (typeof obj[key] === 'object') {
        const nestedKeys = getKeys(obj[key]).map(nestedKey => `${key}.${nestedKey}`);
        keys = keys.concat(nestedKeys);
      }
    }
  }
  return keys;
}

// Get the keys for each object
const keys1 = getKeys(obj1);
const keys2 = getKeys(obj2);

// Find the difference in keys
const diff1 = keys2.filter(key => !keys1.includes(key));

// Print the difference
console.log(`Keys present in ${filePath2} but not in ${filePath1}:\n${diff1.join('\n')}`);

// Find the difference in keys
const diff2 = keys1.filter(key => !keys2.includes(key));

// Print the difference
console.log(`Keys present in ${filePath1} but not in ${filePath2}:\n${diff2.join('\n')}`);
