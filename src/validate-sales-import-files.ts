import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { SalesService } from './sales/sales.service';

const dataSource = {
  getRepository() {
    return {
      createQueryBuilder: () => ({
        select() { return this; },
        where() { return this; },
        async getRawMany() { return []; },
      }),
    };
  },
};
const service = new SalesService({} as never, dataSource as never);
const directory = resolve(__dirname, '../../outputs/sales-import-hardening');
const files = [
  'persian-sales-import.xlsx',
  'english-sales-import.xlsx',
  'title-rows-sales-import.xlsx',
  'empty-columns-sales-import.xlsx',
];

async function validate() {
  for (const fileName of files) {
    const buffer = await readFile(resolve(directory, fileName));
    const preview = await service.previewReport({ buffer, originalname: basename(fileName) } as Express.Multer.File, 'DAILY');
    if (preview.missingColumns.length || preview.invalidRows) {
      throw new Error(`${fileName}: ${JSON.stringify({ missing: preview.missingColumns, invalidRows: preview.invalidRows })}`);
    }
    console.log(JSON.stringify({ fileName, headers: preview.headers, mapping: preview.mapping, rows: preview.totalRows }));
  }
}

void validate().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
