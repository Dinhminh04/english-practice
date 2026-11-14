const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

// Read an uploaded CSV file into an array of row objects.
// The temporary upload is always deleted, and a broken file rejects the promise
// instead of leaving the request hanging.
const readCsv = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .on("error", reject)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  }).finally(() => fs.promises.unlink(filePath).catch(() => {}));

// Rows -> CSV text with the given columns
const toCsv = (rows, fields) => new Parser({ fields }).parse(rows);

module.exports = { readCsv, toCsv };
