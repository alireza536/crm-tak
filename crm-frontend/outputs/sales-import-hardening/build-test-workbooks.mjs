import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.dirname(fileURLToPath(import.meta.url));

const formats = {
  header: {
    fill: "#312E81",
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#6366F1" },
  },
  body: {
    borders: { preset: "all", style: "thin", color: "#CBD5E1" },
    verticalAlignment: "center",
  },
};

async function createWorkbook(fileName, rows, headerRow = 1, rtl = false) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("Sales Import");
  sheet.showGridLines = false;
  sheet.rightToLeft = rtl;
  const rowCount = rows.length;
  const columnCount = Math.max(...rows.map(row => row.length));
  const endColumn = String.fromCharCode(64 + columnCount);
  sheet.getRange(`A1:${endColumn}${rowCount}`).values = rows.map(row => [...row, ...Array(columnCount - row.length).fill(null)]);
  sheet.getRange(`A${headerRow}:${endColumn}${headerRow}`).format = formats.header;
  if (rowCount > headerRow) sheet.getRange(`A${headerRow + 1}:${endColumn}${rowCount}`).format = formats.body;
  sheet.getRange(`A1:${endColumn}${rowCount}`).format.rowHeight = 23;
  sheet.getRange(`A1:${endColumn}${rowCount}`).format.autofitColumns();
  sheet.getRange(`A1:${endColumn}${rowCount}`).format.columnWidth = 18;
  sheet.freezePanes.freezeRows(headerRow);
  const inspect = await workbook.inspect({ kind: "region", sheetId: "Sales Import", range: `A1:${endColumn}${Math.min(rowCount, 12)}`, maxChars: 5000 });
  console.log(fileName, inspect.ndjson);
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outputDir, fileName));
  const preview = await workbook.render({ sheetName: "Sales Import", autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, fileName.replace(/\.xlsx$/i, ".png")), new Uint8Array(await preview.arrayBuffer()));
}

await fs.mkdir(outputDir, { recursive: true });

await createWorkbook("persian-sales-import.xlsx", [
  ["تاریخ", "شماره فاکتور", "مشتری", "موبایل", "شرح کالا", "کد کالا", "تعداد", "مبلغ"],
  ["2026-08-01", "FA-1001", "فروشگاه آفتاب", "۰۹۱۲۱۲۳۴۵۶۷", "کابل شبکه", "CB-01", "۲", "۱,۲۰۰,۰۰۰"],
  ["2026-08-02", "FA-1002", "شرکت سپهر", "۰۹۱۲۷۶۵۴۳۲۱", "سوکت صنعتی", "SK-02", "۳", "1.2M"],
], 1, true);

await createWorkbook("english-sales-import.xlsx", [
  ["invoiceDate", "invoiceNumber", "customerName", "customerPhone", "productName", "productCode", "quantity", "amount"],
  ["2026-08-03", "EN-1001", "Atlas Trading", "09123334444", "Network Cable", "NC-01", 4, 2450000],
  ["2026-08-04", "EN-1002", "Orion Store", "09125556666", "Industrial Plug", "IP-02", 1, 780000],
]);

await createWorkbook("title-rows-sales-import.xlsx", [
  ["TAK Company Sales Report"],
  ["Reporting period: August 2026"],
  [],
  ["saleDate", "factor", "buyer", "mobile", "item", "sku", "qty", "total"],
  ["2026-08-05", "TR-1001", "Nova Customer", "09127778888", "Power Adapter", "PA-01", 2, "3,600,000"],
  ["2026-08-06", "TR-1002", "Delta Customer", "09129990000", "Patch Cord", "PC-02", 5, 900000],
], 4);

await createWorkbook("empty-columns-sales-import.xlsx", [
  ["date", null, "invoice", "customer", null, "phone", "product", null, "productCode", "quantity", "amount", null],
  ["2026-08-07", null, "EC-1001", "Empty Columns Co", null, "09121112222", "Fiber Cable", null, "FC-01", 2, 1500000, null],
  ["2026-08-08", null, "EC-1002", "Sparse Sheet Ltd", null, "09123332222", "Connector", null, "CN-02", 6, 660000, null],
]);
