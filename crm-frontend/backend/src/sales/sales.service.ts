import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerHistory } from '../entities/customer-history.entity';
import { Sale } from '../entities/sale.entity';
import { Invoice } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';
import { SalesReportImport } from '../entities/sales-report-import.entity';
import * as XLSX from 'xlsx';

type AuthenticatedUser = { id: number; role: string };

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly sales: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async getReportSummary(actor: AuthenticatedUser, startDate?: string, endDate?: string) {
    const sales = await this.reportInvoices(actor, startDate, endDate);
    return {
      totalSalesAmount: sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0),
      totalInvoices: sales.length,
      totalCustomers: new Set(sales.map(sale => sale.customerId)).size,
      totalProducts: new Set(sales.map(sale => sale.productCode || sale.productName)).size,
    };
  }

  async getReportCharts(actor: AuthenticatedUser, startDate?: string, endDate?: string) {
    const sales = await this.reportInvoices(actor, startDate, endDate);
    const group = (keyOf: (date: Date) => string, labelOf: (date: Date) => string) => {
      const map = new Map<string, { key: string; label: string; revenue: number; invoices: number }>();
      sales.forEach(sale => {
        const date = new Date(sale.saleDate || sale.createdAt);
        const key = keyOf(date), current = map.get(key) || { key, label: labelOf(date), revenue: 0, invoices: 0 };
        current.revenue += Number(sale.amount || 0); current.invoices++; map.set(key, current);
      });
      return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    };
    const salespersonMap = new Map<number, { userId: number; name: string; revenue: number; sales: number }>();
    const customerMap = new Map<number, { customerId: number; name: string; revenue: number; sales: number }>();
    sales.forEach(sale => {
      const salespersonId = sale.userId ?? 0;
      const person = salespersonMap.get(salespersonId) || { userId: salespersonId, name: sale.user?.name || 'Ø¨Ø¯ÙˆÙ† Ú©Ø§Ø±Ø´Ù†Ø§Ø³', revenue: 0, sales: 0 };
      person.revenue += Number(sale.amount || 0); person.sales++; salespersonMap.set(salespersonId, person);
      const customer = customerMap.get(sale.customerId) || { customerId: sale.customerId, name: sale.customer?.name || 'Ù†Ø§Ù…Ø´Ø®Øµ', revenue: 0, sales: 0 };
      customer.revenue += Number(sale.amount || 0); customer.sales++; customerMap.set(sale.customerId, customer);
    });
    return {
      dailySales: group(date => date.toISOString().slice(0, 10), date => date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })),
      monthlySales: group(date => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'), date => date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' })),
      yearlySales: group(date => String(date.getFullYear()), date => date.getFullYear().toLocaleString('fa-IR', { useGrouping: false })),
      salespersonPerformance: [...salespersonMap.values()].sort((a, b) => b.revenue - a.revenue),
      customerRanking: [...customerMap.values()].sort((a, b) => b.revenue - a.revenue),
    };
  }

  private async reportSales(actor: AuthenticatedUser, startDate?: string, endDate?: string) {
    const query = this.sales.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.customer', 'customer')
      .orderBy('COALESCE(sale.saleDate, sale.createdAt)', 'ASC');
    if (actor.role !== 'ADMIN') query.andWhere('sale.userId = :userId', { userId: actor.id });
    if (startDate) {
      const start = new Date(startDate + (startDate.includes('T') ? '' : 'T00:00:00'));
      if (Number.isNaN(start.getTime())) throw new BadRequestException('startDate is invalid');
      query.andWhere('COALESCE(sale.saleDate, sale.createdAt) >= :start', { start });
    }
    if (endDate) {
      const end = new Date(endDate + (endDate.includes('T') ? '' : 'T23:59:59.999'));
      if (Number.isNaN(end.getTime())) throw new BadRequestException('endDate is invalid');
      query.andWhere('COALESCE(sale.saleDate, sale.createdAt) <= :end', { end });
    }
    return query.getMany();
  }

  private async reportInvoices(actor: AuthenticatedUser, startDate?: string, endDate?: string) {
    const query = this.dataSource.getRepository(Invoice).createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('customer.assignedTo', 'salesperson')
      .where('invoice.status != :cancelled', { cancelled: 'CANCELLED' })
      .orderBy('COALESCE(invoice.invoiceDate, invoice.createdAt)', 'ASC');
    if (actor.role !== 'ADMIN') query.andWhere('customer.salespersonId = :userId', { userId: actor.id });
    if (startDate) {
      const start = new Date(startDate + (startDate.includes('T') ? '' : 'T00:00:00'));
      if (Number.isNaN(start.getTime())) throw new BadRequestException('startDate is invalid');
      query.andWhere('COALESCE(invoice.invoiceDate, invoice.createdAt) >= :start', { start });
    }
    if (endDate) {
      const end = new Date(endDate + (endDate.includes('T') ? '' : 'T23:59:59.999'));
      if (Number.isNaN(end.getTime())) throw new BadRequestException('endDate is invalid');
      query.andWhere('COALESCE(invoice.invoiceDate, invoice.createdAt) <= :end', { end });
    }
    const invoices = await query.getMany();
    return invoices.map(invoice => ({
      amount: invoice.total,
      customerId: invoice.customerId,
      productCode: null,
      productName: invoice.items?.map(item => item.productName).join(', ') || '',
      userId: invoice.customer?.salespersonId ?? 0,
      user: invoice.customer?.assignedTo ?? null,
      customer: invoice.customer,
      saleDate: invoice.invoiceDate,
      createdAt: invoice.createdAt,
    }));
  }

  async previewReport(file: Express.Multer.File | undefined, reportType: string, rawMapping?: string) {
    this.validateReportType(reportType);
    if (!file) throw new BadRequestException('CSV or Excel file is required');
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) throw new BadRequestException('Only CSV, XLSX and XLS files are supported');
    let sourceRows: Record<string, unknown>[];
    let headers: string[] = [];
    let firstDataRowNumber = 2;
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false, cellDates: true });
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], {
        header: 1,
        defval: '',
        blankrows: false,
      });
      const hasValue = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '';
      let headerIndex = 0;
      let bestHeaderScore = -1;
      matrix.slice(0, 30).forEach((row, index) => {
        const candidates = row.filter(value => {
          const header = String(value ?? '').trim();
          return header && !/^(?:__)?EMPTY(?:_\d+)?$/i.test(header);
        });
        const scores = new Map<string, number>();
        candidates.forEach(value => {
          const detected = this.detectHeaderField(value);
          if (detected.field) scores.set(detected.field, Math.max(scores.get(detected.field) || 0, detected.score));
        });
        const score = [...scores.values()].reduce((sum, value) => sum + value, 0) * 100 + candidates.length;
        if (score > bestHeaderScore) {
          bestHeaderScore = score;
          headerIndex = index;
        }
      });
      const headerRow = matrix[headerIndex] || [];
      firstDataRowNumber = headerIndex + 2;
      let lastUsedColumn = -1;
      for (const row of matrix.slice(headerIndex)) {
        for (let column = row.length - 1; column > lastUsedColumn; column--) {
          if (hasValue(row[column])) {
            lastUsedColumn = column;
            break;
          }
        }
      }
      const usedColumns = Array.from({ length: lastUsedColumn + 1 }, (_, index) => index).filter(index => {
        const header = String(headerRow[index] ?? '').trim();
        if (!header || /^(?:__)?EMPTY(?:_\d+)?$/i.test(header) || this.isIgnoredSalespersonHeader(header)) return false;
        return matrix.slice(headerIndex + 1).some(row => hasValue(row[index]));
      });
      headers = usedColumns.map(index => String(headerRow[index]).trim());
      sourceRows = matrix.slice(headerIndex + 1).map(row => Object.fromEntries(
        usedColumns.map(index => [String(headerRow[index]).trim(), row[index] ?? '']),
      )).filter(row => Object.values(row).some(hasValue));
    } catch {
      throw new BadRequestException('The sales report file could not be read');
    }
    if (!sourceRows.length) throw new BadRequestException('The report has no data rows');
    if (!headers.length) throw new BadRequestException('The report header row could not be detected');
    headers = headers.filter(header => !this.isIgnoredSalespersonHeader(header));
    let requestedMapping: Record<string, string> = {};
    if (rawMapping) {
      try { requestedMapping = JSON.parse(rawMapping); } catch { throw new BadRequestException('Some columns could not be identified. Please review mapping.'); }
    }
    const mapping = { ...this.suggestReportMapping(headers), ...requestedMapping };
    const rows = [];
    for (let index = 0; index < sourceRows.length; index++) {
      rows.push(this.normalizeReportRow(sourceRows[index], firstDataRowNumber + index, mapping));
      if (index > 0 && index % 1000 === 0) await new Promise<void>(resolve => setImmediate(resolve));
    }
    const requiredFields = ['date', 'invoiceNumber', 'productName', 'quantity', 'amount'];
    const missingColumns = requiredFields.filter(field => !mapping[field] || !headers.includes(mapping[field]));
    if (![mapping.customerPhone, mapping.customerName].some(header => header && headers.includes(header))) missingColumns.push('customer');
    const invoiceNumbers = rows.map(row => row.invoiceNumber).filter(Boolean);
    const existing: Array<{ invoiceNumber: string }> = [];
    for (let offset = 0; offset < invoiceNumbers.length; offset += 1000) {
      const batch = invoiceNumbers.slice(offset, offset + 1000);
      existing.push(...await this.dataSource.getRepository(Invoice).createQueryBuilder('invoice').select('invoice.invoiceNumber', 'invoiceNumber').where('invoice.invoiceNumber IN (:...invoiceNumbers)', { invoiceNumbers: batch }).getRawMany<{ invoiceNumber: string }>());
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    const existingNumbers = new Set(existing.map(item => item.invoiceNumber)), fileNumbers = new Set<string>();
    for (const row of rows) {
      if (!row.date || Number.isNaN(new Date(row.date).getTime())) row.errors.push('ØªØ§Ø±ÛŒØ® Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª');
      if (!row.invoiceNumber) row.errors.push('Ø´Ù…Ø§Ø±Ù‡ ÙØ§Ú©ØªÙˆØ± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª');
      else if (existingNumbers.has(row.invoiceNumber)) row.errors.push('Ø´Ù…Ø§Ø±Ù‡ ÙØ§Ú©ØªÙˆØ± Ù‚Ø¨Ù„Ø§Ù‹ ÙˆØ§Ø±Ø¯ Ø´Ø¯Ù‡ Ø§Ø³Øª');
      else if (fileNumbers.has(row.invoiceNumber)) row.errors.push('Ø´Ù…Ø§Ø±Ù‡ ÙØ§Ú©ØªÙˆØ± Ø¯Ø± ÙØ§ÛŒÙ„ ØªÚ©Ø±Ø§Ø±ÛŒ Ø§Ø³Øª');
      else fileNumbers.add(row.invoiceNumber);
      if (!row.customerName && !row.customerPhone) row.errors.push('Ù…Ø´ØªØ±ÛŒ Ù…Ø´Ø®Øµ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª');
      if (!Number.isFinite(row.amount) || row.amount <= 0) row.errors.push('Ù…Ø¨Ù„Øº ÙØ±ÙˆØ´ Ø§Ù„Ø²Ø§Ù…ÛŒ Ùˆ Ø¨Ø§ÛŒØ¯ Ø¨ÛŒØ´ØªØ± Ø§Ø² ØµÙØ± Ø¨Ø§Ø´Ø¯');
      if (!row.productName) row.errors.push('Ù†Ø§Ù… Ú©Ø§Ù„Ø§ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª');
      if (!Number.isFinite(row.quantity) || row.quantity < 1) row.errors.push('ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§ÛŒØ¯ Ø¹Ø¯Ø¯ÛŒ Ùˆ Ø¨ÛŒØ´ØªØ± Ø§Ø² ØµÙØ± Ø¨Ø§Ø´Ø¯');
      if (missingColumns.length) row.errors.push('Ø³ØªÙˆÙ†â€ŒÙ‡Ø§ÛŒ Ø§Ù„Ø²Ø§Ù…ÛŒ Ù†Ú¯Ø§Ø´Øª Ù†Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯: ' + missingColumns.join(', '));
    }
    return {
      fileName: file.originalname, reportType, headers, mapping, missingColumns,
      analysis: {
        customer: Boolean(mapping.customerName || mapping.customerPhone),
        date: Boolean(mapping.date),
        product: Boolean(mapping.productName),
        amount: Boolean(mapping.amount),
      },
      totalRows: rows.length, validRows: rows.filter(row => !row.errors.length).length,
      invalidRows: rows.filter(row => row.errors.length).length, rows,
      groups: this.groupReportRows(rows.filter(row => !row.errors.length), reportType),
    };
  }

  importReport(data: any, adminId: number) {
    this.validateReportType(data.reportType);
    const inputRows = Array.isArray(data.rows) ? data.rows : [];
    if (!inputRows.length) throw new BadRequestException('No sales rows were provided');
    return this.dataSource.transaction(async manager => {
      const errors: Array<{ row: number; message: string }> = [];
      let importedRows = 0;
      const seen = new Set<string>();
      for (let index = 0; index < inputRows.length; index++) {
        const input = inputRows[index];
        const row = this.normalizeReportRow(input, Number(input.rowNumber || 0));
        if (Array.isArray(input.errors) && input.errors.length) { errors.push({ row: row.rowNumber, message: input.errors.join('ØŒ ') }); continue; }
        if (!row.invoiceNumber || seen.has(row.invoiceNumber)) { errors.push({ row: row.rowNumber, message: 'Ø´Ù…Ø§Ø±Ù‡ ÙØ§Ú©ØªÙˆØ± Ù†Ø§Ù…Ø¹ØªØ¨Ø± ÛŒØ§ ØªÚ©Ø±Ø§Ø±ÛŒ Ø§Ø³Øª' }); continue; }
        seen.add(row.invoiceNumber);
        if (await manager.getRepository(Invoice).findOneBy({ invoiceNumber: row.invoiceNumber })) { errors.push({ row: row.rowNumber, message: 'Ø´Ù…Ø§Ø±Ù‡ ÙØ§Ú©ØªÙˆØ± Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª' }); continue; }
        const customerRepo = manager.getRepository(Customer);
        let customer = row.customerPhone
          ? await customerRepo.findOneBy({ phone: row.customerPhone })
          : null;
        if (!customer && row.customerName) customer = await customerRepo.findOneBy({ name: row.customerName });
        if (!customer) {
          if (!row.customerName) { errors.push({ row: row.rowNumber, message: 'Customer name is required when creating a new customer' }); continue; }
          customer = await customerRepo.save({
            name: row.customerName,
            phone: row.customerPhone || null,
            storeName: null,
            province: null,
            city: null,
            address: null,
            nationalCode: null,
            description: null,
            status: 'FREE',
            customerType: 'NORMAL',
            initialScore: 0,
            healthScore: 0,
            salespersonId: null,
          });
          await manager.getRepository(CustomerHistory).save({ customerId: customer.id, userId: adminId, action: 'CUSTOMER_CREATED_FROM_INVOICE', description: 'Customer created automatically from sales report' });
        }
        const saleDate = new Date(row.date);
        if (Number.isNaN(saleDate.getTime()) || !row.amount) { errors.push({ row: row.rowNumber, message: 'ØªØ§Ø±ÛŒØ® ÛŒØ§ Ù…Ø¨Ù„Øº Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª' }); continue; }
        const invoice = await manager.getRepository(Invoice).save({
          customerId: customer.id,
          userId: null,
          invoiceNumber: row.invoiceNumber,
          total: row.amount,
          invoiceDate: saleDate,
          items: [{
            productName: row.productName,
            productCode: row.productCode || null,
            quantity: Math.max(1, Math.floor(row.quantity || 1)),
            unitPrice: row.amount / Math.max(1, Math.floor(row.quantity || 1)),
            discount: 0,
            totalPrice: row.amount,
          }],
          status: 'PENDING',
          createdAt: saleDate,
        });
        await manager.getRepository(CustomerHistory).save({ customerId: customer.id, userId: adminId, action: 'INVOICE_IMPORT', description: 'Imported invoice #' + invoice.invoiceNumber + ' from ' + String(data.fileName || 'sales report') });
        importedRows++;
        if (index > 0 && index % 100 === 0) await new Promise<void>(resolve => setImmediate(resolve));
      }
      const history = await manager.getRepository(SalesReportImport).save({ userId: adminId, fileName: String(data.fileName || 'sales-report'), reportType: data.reportType, totalRows: inputRows.length, importedRows, failedRows: errors.length, errors: errors.length ? errors : null });
      return { importId: history.id, reportType: data.reportType, totalRows: inputRows.length, importedRows, failedRows: errors.length, errors };
    });
  }

  create(data: any, actor: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      this.validateSale(data, true);
      const userId = actor.role === 'SALES' ? actor.id : this.requiredId(data.userId, 'userId');
      await this.requireSalesperson(userId, manager);
      const customer = await manager.getRepository(Customer).findOneBy({ id: this.requiredId(data.customerId, 'customerId') });
      if (!customer) throw new BadRequestException('Customer not found');
      if (actor.role === 'SALES' && customer.salespersonId !== actor.id) {
        throw new BadRequestException('Sales users can only create sales for their own customers');
      }

      const sale = await manager.getRepository(Sale).save({
        customerId: customer.id,
        userId,
        productName: data.productName.trim(),
        quantity: Number(data.quantity ?? 1),
        amount: Number(data.amount),
      });
      await manager.getRepository(CustomerHistory).save({
        customerId: customer.id,
        userId: actor.id,
        action: 'SALE',
        description: `Sale #${sale.id}: ${sale.productName}, quantity ${sale.quantity}, amount ${sale.amount}`,
      });
      return this.findByIdForResponse(sale.id, manager);
    });
  }

  async getImportHistory() {
    const imports = await this.dataSource.getRepository(SalesReportImport).find({
      relations: { user: true }, order: { createdAt: 'DESC' }, take: 30,
    });
    return imports.map(item => ({
      id: item.id, fileName: item.fileName, reportType: item.reportType,
      uploadedBy: item.user ? { id: item.user.id, name: item.user.name } : null,
      totalRows: item.totalRows, importedRows: item.importedRows, failedRows: item.failedRows,
      status: item.failedRows === 0 ? 'SUCCESS' : item.importedRows > 0 ? 'PARTIAL' : 'FAILED',
      errors: item.errors || [],
      createdAt: item.createdAt,
    }));
  }

  createImportSample() {
    const rows = [
      { '\u062a\u0627\u0631\u06cc\u062e \u0641\u0631\u0648\u0634': '2026-08-01', '\u0634\u0645\u0627\u0631\u0647 \u0641\u0627\u06a9\u062a\u0648\u0631': 'TAK-SAMPLE-001', '\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc': '\u0641\u0631\u0648\u0634\u06af\u0627\u0647 \u062a\u0633\u062a \u06cc\u06a9', '\u0645\u0648\u0628\u0627\u06cc\u0644': '09121111111', '\u06a9\u062f \u06a9\u0627\u0644\u0627': 'PRD-001', '\u0646\u0627\u0645 \u06a9\u0627\u0644\u0627': '\u06a9\u0627\u0628\u0644 \u062a\u0633\u062a', '\u062a\u0639\u062f\u0627\u062f': 2, '\u0645\u0628\u0644\u063a': 1250000 },
      { '\u062a\u0627\u0631\u06cc\u062e \u0641\u0631\u0648\u0634': '2026-08-02', '\u0634\u0645\u0627\u0631\u0647 \u0641\u0627\u06a9\u062a\u0648\u0631': 'TAK-SAMPLE-002', '\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc': '\u0641\u0631\u0648\u0634\u06af\u0627\u0647 \u062a\u0633\u062a \u062f\u0648', '\u0645\u0648\u0628\u0627\u06cc\u0644': '09122222222', '\u06a9\u062f \u06a9\u0627\u0644\u0627': 'PRD-002', '\u0646\u0627\u0645 \u06a9\u0627\u0644\u0627': '\u0645\u062d\u0635\u0648\u0644 \u062a\u0633\u062a', '\u062a\u0639\u062f\u0627\u062f': 1, '\u0645\u0628\u0644\u063a': 950000 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [12, 20, 24, 16, 14, 20, 10, 16].map(width => ({ wch: width }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Import');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async findAll(actor: AuthenticatedUser) {
    const sales = await this.sales.find({
      where: actor.role === 'ADMIN' ? {} : { userId: actor.id },
      relations: { customer: true, user: true },
      order: { createdAt: 'DESC' },
    });
    return sales.map((sale) => this.sanitize(sale));
  }

  async findOne(id: number, actor: AuthenticatedUser) {
    const sale = await this.sales.findOne({
      where: actor.role === 'ADMIN' ? { id } : { id, userId: actor.id },
      relations: { customer: true, user: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return this.sanitize(sale);
  }

  update(id: number, data: any, actor: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      this.validateSale(data, false);
      const repository = manager.getRepository(Sale);
      const sale = await repository.findOneBy(actor.role === 'ADMIN' ? { id } : { id, userId: actor.id });
      if (!sale) throw new NotFoundException('Sale not found');

      if (data.productName !== undefined) sale.productName = data.productName.trim();
      if (data.quantity !== undefined) sale.quantity = Number(data.quantity);
      if (data.amount !== undefined) sale.amount = Number(data.amount);
      await repository.save(sale);
      await manager.getRepository(CustomerHistory).save({
        customerId: sale.customerId,
        userId: actor.id,
        action: 'SALE_UPDATE',
        description: `Sale #${sale.id} updated`,
      });
      return this.findByIdForResponse(sale.id, manager);
    });
  }

  remove(id: number, actor: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Sale);
      const sale = await repository.findOneBy(actor.role === 'ADMIN' ? { id } : { id, userId: actor.id });
      if (!sale) throw new NotFoundException('Sale not found');
      await manager.getRepository(CustomerHistory).save({
        customerId: sale.customerId,
        userId: actor.id,
        action: 'SALE_DELETE',
        description: `Sale #${sale.id} deleted`,
      });
      return repository.remove(sale);
    });
  }

  private validateSale(data: any, create: boolean) {
    if ((create || data.productName !== undefined) &&
        (typeof data.productName !== 'string' || !data.productName.trim())) {
      throw new BadRequestException('productName is required');
    }
    if (create || data.quantity !== undefined) {
      const quantity = Number(data.quantity ?? 1);
      if (!Number.isInteger(quantity) || quantity < 1) throw new BadRequestException('quantity must be a positive integer');
    }
    if (create || data.amount !== undefined) {
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be greater than zero');
    }
  }

  private validateReportType(value: string) {
    if (!['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'].includes(value)) throw new BadRequestException('Invalid report type');
  }

  private reportAliases(): Record<string, string[]> {
    return {
      date: ['date', 'saleDate', 'sale date', 'invoiceDate', 'invoice date', '\u062a\u0627\u0631\u06cc\u062e', '\u062a\u0627\u0631\u06cc\u062e \u0641\u0631\u0648\u0634'],
      invoiceNumber: ['invoice', 'invoiceNumber', 'invoice number', 'factor', '\u0634\u0645\u0627\u0631\u0647 \u0641\u0627\u06a9\u062a\u0648\u0631', '\u0634\u0645\u0627\u0631\u0647'],
      customerName: ['customer', 'customerName', 'customer name', 'buyer', '\u0645\u0634\u062a\u0631\u06cc', '\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc', '\u062e\u0631\u06cc\u062f\u0627\u0631'],
      customerPhone: ['phone', 'mobile', 'customerPhone', 'customer phone', '\u062a\u0644\u0641\u0646', '\u0645\u0648\u0628\u0627\u06cc\u0644', '\u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633'],
      productName: ['product', 'productName', 'product name', 'item', '\u06a9\u0627\u0644\u0627', '\u0634\u0631\u062d \u06a9\u0627\u0644\u0627', '\u0646\u0627\u0645 \u06a9\u0627\u0644\u0627', '\u0645\u062d\u0635\u0648\u0644'],
      productCode: ['sku', 'productCode', 'product code', '\u06a9\u062f \u06a9\u0627\u0644\u0627'],
      quantity: ['qty', 'quantity', '\u062a\u0639\u062f\u0627\u062f'],
      amount: ['amount', 'total', 'price', 'sale amount', 'revenue', '\u0645\u0628\u0644\u063a', '\u062c\u0645\u0639', '\u062c\u0645\u0639 \u0641\u0631\u0648\u0634'],
    };
  }

  private normalizeHeaderKey(value: unknown) {
    return String(value ?? '').trim().toLowerCase().replace(/[\u200c\u200f\s_.\-/]+/g, '');
  }

  private headerMatchScore(field: string, value: unknown) {
    const key = this.normalizeHeaderKey(value);
    if (!key) return 0;
    return this.reportAliases()[field].reduce((best, alias) => {
      const aliasKey = this.normalizeHeaderKey(alias);
      if (key === aliasKey) return Math.max(best, 100);
      if (Math.min(key.length, aliasKey.length) >= 3 && (key.includes(aliasKey) || aliasKey.includes(key))) return Math.max(best, 55);
      return best;
    }, 0);
  }

  private detectHeaderField(value: unknown) {
    const best = Object.keys(this.reportAliases())
      .map(field => ({ field, score: this.headerMatchScore(field, value) }))
      .sort((left, right) => right.score - left.score)[0];
    return best?.score ? best : { field: '', score: 0 };
  }

  private isIgnoredSalespersonHeader(value: unknown) {
    const key = this.normalizeHeaderKey(value);
    return ['salesperson', 'seller', 'sales', 'salesuser', '\u06a9\u0627\u0631\u0634\u0646\u0627\u0633\u0641\u0631\u0648\u0634', '\u0641\u0631\u0648\u0634\u0646\u062f\u0647'].includes(key);
  }

  private latinDigits(value: unknown) {
    return String(value ?? '')
      .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660));
  }

  private reportNumber(value: unknown) {
    if (typeof value === 'number') return value;
    const normalized = this.latinDigits(value).trim().toUpperCase().replace(/[\u066c\u066b,\s]/g, '').replace(/(?:RIAL|IRR|\u0631\u06cc\u0627\u0644|\u062a\u0648\u0645\u0627\u0646)/g, '');
    const match = normalized.match(/^([+-]?\d+(?:\.\d+)?)([KMB])?$/);
    if (!match) return Number.NaN;
    const multiplier = match[2] === 'K' ? 1e3 : match[2] === 'M' ? 1e6 : match[2] === 'B' ? 1e9 : 1;
    return Number(match[1]) * multiplier;
  }

  private normalizeReportRow(source: Record<string, unknown>, rowNumber: number, mapping: Record<string, string> = {}) {
    const aliases = this.reportAliases();
    const values = Object.fromEntries(Object.entries(source).map(([key, value]) => [this.normalizeHeaderKey(key), value]));
    const read = (field: string) => {
      const mappedHeader = mapping[field];
      if (mappedHeader && source[mappedHeader] !== undefined) return source[mappedHeader];
      const key = aliases[field].map(alias => this.normalizeHeaderKey(alias)).find(alias => values[alias] !== undefined);
      return key ? values[key] : '';
    };
    const rawDate = read('date');
    const date = rawDate instanceof Date ? rawDate.toISOString() : typeof rawDate === 'number' ? this.excelDate(rawDate) : this.latinDigits(rawDate).trim();
    return {
      rowNumber, date, invoiceNumber: this.latinDigits(read('invoiceNumber')).trim(),
      customerName: String(read('customerName') || '').trim(), customerPhone: this.latinPhone(String(read('customerPhone') || '')),
      productCode: String(read('productCode') || '').trim(), productName: String(read('productName') || '').trim(),
      quantity: this.reportNumber(read('quantity')),
      amount: this.reportNumber(read('amount')), errors: [] as string[],
    };
  }

  private suggestReportMapping(headers: string[]) {
    return Object.fromEntries(Object.keys(this.reportAliases()).map(field => {
      const best = headers.map(header => ({ header, score: this.headerMatchScore(field, header) })).sort((left, right) => right.score - left.score)[0];
      return [field, best?.score ? best.header : ''];
    }));
  }

  private excelDate(serial: number) {
    const parsed = XLSX.SSF.parse_date_code(serial);
    return parsed ? new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, Math.floor(parsed.S))).toISOString() : '';
  }

  private latinPhone(value: string) {
    return this.latinDigits(value).replace(/[^\d]/g, '');
  }

  private groupReportRows(rows: Array<{ date: string; amount: number }>, reportType: string) {
    const map = new Map<string, { period: string; sales: number; revenue: number }>();
    rows.forEach(row => { const date = new Date(row.date); if (Number.isNaN(date.getTime())) return; const key = reportType === 'YEARLY' ? String(date.getFullYear()) : reportType === 'MONTHLY' ? date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') : date.toISOString().slice(0, 10); const current = map.get(key) || { period: key, sales: 0, revenue: 0 }; current.sales++; current.revenue += row.amount; map.set(key, current); });
    return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
  }

  private requiredId(value: unknown, field: string) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new BadRequestException(`${field} must be a positive integer`);
    return id;
  }

  private async requireSalesperson(id: number, manager: EntityManager) {
    const user = await manager.getRepository(User).findOneBy({ id, role: 'SALES' });
    if (!user) throw new BadRequestException('userId must reference a SALES user');
    return user;
  }

  private async findByIdForResponse(id: number, manager: EntityManager) {
    const sale = await manager.getRepository(Sale).findOne({
      where: { id },
      relations: { customer: true, user: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return this.sanitize(sale);
  }

  private sanitize(sale: Sale) {
    return {
      ...sale,
      user: sale.user ? { id: sale.user.id, name: sale.user.name, phone: sale.user.phone, role: sale.user.role } : null,
    };
  }
}
