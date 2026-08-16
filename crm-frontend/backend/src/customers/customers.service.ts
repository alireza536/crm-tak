import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerHistory } from '../entities/customer-history.entity';
import { User } from '../entities/user.entity';
import { CustomerImport } from '../entities/customer-import.entity';
import { Invoice } from '../entities/invoice.entity';
import * as XLSX from 'xlsx';

type AuthenticatedUser = { id: number; role: string };

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(CustomerHistory) private readonly histories: Repository<CustomerHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async previewImport(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('CSV or Excel file is required');
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException('Only CSV, XLSX and XLS files are supported');
    }
    let sheetRows: Record<string, unknown>[];
    let firstDataRowNumber = 2;
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false, cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: true });
      const hasValue = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '';
      let headerIndex = 0;
      let bestScore = 0;
      matrix.slice(0, 30).forEach((row, index) => {
        const scores = new Map<string, number>();
        row.forEach(value => {
          const detected = this.detectCustomerHeader(value);
          if (detected.field) scores.set(detected.field, Math.max(scores.get(detected.field) || 0, detected.score));
        });
        const score = [...scores.values()].reduce((sum, value) => sum + value, 0);
        if (score > bestScore) { bestScore = score; headerIndex = index; }
      });
      if (!bestScore) throw new Error('header not found');
      const headerRow = matrix[headerIndex] || [];
      firstDataRowNumber = headerIndex + 2;
      const personsListNameColumn = headerRow.findIndex(value => this.normalizeImportHeader(value) === this.normalizeImportHeader('\u0646\u0627\u0645 \u0634\u062e\u0635'));
      let lastUsedColumn = -1;
      matrix.slice(headerIndex).forEach(row => row.forEach((value, index) => { if (hasValue(value)) lastUsedColumn = Math.max(lastUsedColumn, index); }));
      const usedColumns = Array.from({ length: lastUsedColumn + 1 }, (_, index) => index).filter(index => {
        const header = String(headerRow[index] ?? '').trim();
        return Boolean(header) && !/^(?:__)?EMPTY(?:_\d+)?$/i.test(header) && matrix.slice(headerIndex + 1).some(row => hasValue(row[index]));
      });
      sheetRows = matrix.slice(headerIndex + 1)
        .filter(row => personsListNameColumn < 0 || hasValue(row[personsListNameColumn]))
        .map(row => Object.fromEntries(usedColumns.map(index => [String(headerRow[index]).trim(), row[index] ?? ''])))
        .filter(row => Object.values(row).some(hasValue));
    } catch {
      throw new BadRequestException('The uploaded file could not be read');
    }
    if (!sheetRows.length) throw new BadRequestException('The uploaded file has no data rows');

    const rows = sheetRows.map((source, index) => this.normalizeImportRow(source, firstDataRowNumber + index));
    const phones = rows.map((row) => row.phone).filter(Boolean);
    const nationalCodes = rows.map((row) => row.nationalCode).filter(Boolean);
    const existing: Array<{ phone: string }> = [];
    for (let offset = 0; offset < phones.length; offset += 1000) {
      const batch = phones.slice(offset, offset + 1000);
      existing.push(...await this.customers.createQueryBuilder('customer').select('customer.phone', 'phone').where('customer.phone IN (:...phones)', { phones: batch }).getRawMany<{ phone: string }>());
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    const existingPhones = new Set(existing.map((item) => item.phone));
    const existingNationalCodeRows: Array<{ nationalCode: string }> = [];
    for (let offset = 0; offset < nationalCodes.length; offset += 1000) {
      const batch = nationalCodes.slice(offset, offset + 1000);
      existingNationalCodeRows.push(...await this.customers.createQueryBuilder('customer').select('customer.nationalCode', 'nationalCode').where('customer.nationalCode IN (:...nationalCodes)', { nationalCodes: batch }).getRawMany<{ nationalCode: string }>());
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    const existingNationalCodes = new Set(existingNationalCodeRows.map(item => item.nationalCode));
    const filePhones = new Set<string>(), fileNationalCodes = new Set<string>();
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (!row.name) row.errors.push('\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc \u0627\u0644\u0632\u0627\u0645\u06cc \u0627\u0633\u062a');
      if (row.phone) {
        if (!/^\d{7,11}$/.test(row.phone)) row.errors.push('\u0641\u0631\u0645\u062a \u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633 \u0645\u0639\u062a\u0628\u0631 \u0646\u06cc\u0633\u062a');
        else if (existingPhones.has(row.phone)) row.errors.push('\u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633 \u0642\u0628\u0644\u0627\u064b \u062b\u0628\u062a \u0634\u062f\u0647 \u0627\u0633\u062a');
        else if (filePhones.has(row.phone)) row.errors.push('\u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633 \u062f\u0631 \u0647\u0645\u06cc\u0646 \u0641\u0627\u06cc\u0644 \u062a\u06a9\u0631\u0627\u0631\u06cc \u0627\u0633\u062a');
        else filePhones.add(row.phone);
      }
      if (row.nationalCode) {
        if (existingNationalCodes.has(row.nationalCode)) row.errors.push('\u06a9\u062f \u0645\u0644\u06cc \u0642\u0628\u0644\u0627\u064b \u062b\u0628\u062a \u0634\u062f\u0647 \u0627\u0633\u062a');
        else if (fileNationalCodes.has(row.nationalCode)) row.errors.push('\u06a9\u062f \u0645\u0644\u06cc \u062f\u0631 \u0647\u0645\u06cc\u0646 \u0641\u0627\u06cc\u0644 \u062a\u06a9\u0631\u0627\u0631\u06cc \u0627\u0633\u062a');
        else fileNationalCodes.add(row.nationalCode);
      }
      if (index > 0 && index % 1000 === 0) await new Promise<void>(resolve => setImmediate(resolve));
    }
    return {
      fileName: file.originalname,
      totalRows: rows.length,
      validRows: rows.filter((row) => !row.errors.length).length,
      invalidRows: rows.filter((row) => row.errors.length).length,
      rows,
    };
  }

  async importCustomers(data: any, adminId: number) {
    const inputRows = Array.isArray(data.rows) ? data.rows : [];
    if (!inputRows.length) throw new BadRequestException('No rows were provided for import');
    return this.dataSource.transaction(async (manager) => {
      const errors: Array<{ row: number; message: string }> = [];
      const createdCustomers: Array<{ id: number; name: string; phone: string }> = [];
      let importedRows = 0;
      const seen = new Set<string>(), seenNationalCodes = new Set<string>();
      for (let index = 0; index < inputRows.length; index++) {
        const input = inputRows[index];
        const row = this.normalizeImportRow(input, Number(input.rowNumber || importedRows + errors.length + 2));
        if (Array.isArray(input.errors) && input.errors.length) {
          errors.push({ row: row.rowNumber, message: input.errors.join('ØŒ ') });
          continue;
        }
        if (!row.name) {
          errors.push({ row: row.rowNumber, message: '\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc \u0627\u0644\u0632\u0627\u0645\u06cc \u0627\u0633\u062a' });
          continue;
        }
        if (row.phone && seen.has(row.phone)) {
          errors.push({ row: row.rowNumber, message: '\u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633 \u062f\u0631 \u0641\u0627\u06cc\u0644 \u062a\u06a9\u0631\u0627\u0631\u06cc \u0627\u0633\u062a' });
          continue;
        }
        if (row.phone) seen.add(row.phone);
        if (row.nationalCode && seenNationalCodes.has(row.nationalCode)) {
          errors.push({ row: row.rowNumber, message: 'Ú©Ø¯ Ù…Ù„ÛŒ Ø¯Ø± ÙØ§ÛŒÙ„ ØªÚ©Ø±Ø§Ø±ÛŒ Ø§Ø³Øª' });
          continue;
        }
        if (row.nationalCode) seenNationalCodes.add(row.nationalCode);
        const duplicate = row.phone ? await manager.getRepository(Customer).findOneBy({ phone: row.phone }) : null;
        if (duplicate) {
          errors.push({ row: row.rowNumber, message: 'Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³ Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª' });
          continue;
        }
        if (row.nationalCode && await manager.getRepository(Customer).findOneBy({ nationalCode: row.nationalCode })) {
          errors.push({ row: row.rowNumber, message: 'Ú©Ø¯ Ù…Ù„ÛŒ Ù‚Ø¨Ù„Ø§Ù‹ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª' });
          continue;
        }
        const customer = await manager.getRepository(Customer).save({
          name: row.name,
          storeName: row.storeName || null,
          phone: row.phone || null,
          province: row.province || null,
          city: row.city || null,
          address: row.address || null,
          nationalCode: row.nationalCode || null,
          customerType: row.customerType || 'NORMAL',
          status: 'FREE',
          initialScore: 0,
          healthScore: 0,
          salespersonId: null,
        });
        await this.addHistory(manager, customer.id, adminId, 'IMPORT', `Imported from ${String(data.fileName || 'customer file')}`);
        if (createdCustomers.length < 100) createdCustomers.push({ id: customer.id, name: customer.name, phone: customer.phone || '' });
        importedRows++;
        if (index > 0 && index % 100 === 0) await new Promise<void>(resolve => setImmediate(resolve));
      }
      const history = await manager.getRepository(CustomerImport).save({
        userId: adminId,
        fileName: String(data.fileName || 'customers-import'),
        totalRows: inputRows.length,
        importedRows,
        failedRows: errors.length,
        errors: errors.length ? errors : null,
      });
      return { importId: history.id, totalRows: inputRows.length, importedRows, failedRows: errors.length, errors, createdCustomers };
    });
  }

  getImportHistory() {
    return this.dataSource.getRepository(CustomerImport).find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async findAll(user: AuthenticatedUser) {
    const customers = await this.customers.find({
      where: user.role === 'ADMIN' ? {} : { salespersonId: user.id },
      relations: { assignedTo: true },
      order: { id: 'DESC' },
    });
    const invoices = customers.length ? await this.dataSource.getRepository(Invoice).find({
      where: { customerId: In(customers.map(customer => customer.id)) },
      order: { invoiceDate: 'DESC', createdAt: 'DESC' },
    }) : [];
    const statistics = new Map<number, { totalSale: number; invoiceCount: number; lastPurchase: Date | null }>();
    for (const invoice of invoices.filter(item => item.status !== 'CANCELLED')) {
      const current = statistics.get(invoice.customerId) || { totalSale: 0, invoiceCount: 0, lastPurchase: null };
      current.totalSale += Number(invoice.total || 0); current.invoiceCount += 1;
      const purchaseDate = invoice.invoiceDate || invoice.createdAt;
      if (!current.lastPurchase || purchaseDate > current.lastPurchase) current.lastPurchase = purchaseDate;
      statistics.set(invoice.customerId, current);
    }
    return customers.map(customer => ({ ...this.sanitizeCustomer(customer), ...(statistics.get(customer.id) || { totalSale: 0, invoiceCount: 0, lastPurchase: null }) }));
  }

  async getFreeCustomers() {
    const customers = await this.customers
      .createQueryBuilder('customer')
      .where('customer.salespersonId IS NULL')
      .andWhere('customer.status = :free', { free: 'FREE' })
      .orderBy('customer.id', 'DESC')
      .getMany();
    const invoices = customers.length ? await this.dataSource.getRepository(Invoice).find({
      where: { customerId: In(customers.map(customer => customer.id)) },
      order: { invoiceDate: 'DESC', createdAt: 'DESC' },
    }) : [];
    const statistics = new Map<number, { totalSale: number; invoiceCount: number; lastPurchase: Date | null }>();
    for (const invoice of invoices.filter(item => item.status !== 'CANCELLED')) {
      const current = statistics.get(invoice.customerId) || { totalSale: 0, invoiceCount: 0, lastPurchase: null };
      current.totalSale += Number(invoice.total || 0);
      current.invoiceCount += 1;
      const purchaseDate = invoice.invoiceDate || invoice.createdAt;
      if (!current.lastPurchase || purchaseDate > current.lastPurchase) current.lastPurchase = purchaseDate;
      statistics.set(invoice.customerId, current);
    }
    return customers.map(customer => ({
      ...this.sanitizeCustomer(customer),
      ...(statistics.get(customer.id) || { totalSale: 0, invoiceCount: 0, lastPurchase: null }),
    }));
  }

  getMyCustomers(userId: number) {
    return this.customers.find({ where: { salespersonId: userId }, order: { id: 'DESC' } });
  }

  claim(customerId: number, userId: number) {
    return this.dataSource.transaction(async manager => {
      await this.requireSalesUser(userId, manager);
      const repository = manager.getRepository(Customer);
      const customer = await repository.findOne({
        where: { id: customerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      if (customer.salespersonId !== null) throw new BadRequestException('Customer is already assigned to another salesperson');
      customer.salespersonId = userId;
      customer.status = 'ASSIGNED';
      await repository.save(customer);
      await this.addHistory(manager, customerId, userId, 'CLAIM', 'Customer claimed by salesperson');
      return repository.findOne({ where: { id: customerId }, relations: { assignedTo: true } });
    });
  }

  create(data: any, user: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      this.validateRequiredCustomerFields(data);
      await this.ensurePhoneAvailable(data.phone, null, manager);
      const salespersonId = user.role === 'SALES' ? user.id : this.optionalNumber(data.salespersonId ?? data.assignedToId);
      if (salespersonId !== null) await this.requireSalesUser(salespersonId, manager);

      const customer = await manager.getRepository(Customer).save({
        name: data.name.trim(),
        storeName: data.storeName ?? null,
        phone: data.phone.trim(),
        province: data.province ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
        nationalCode: data.nationalCode ?? null,
        description: data.description ?? null,
        status: salespersonId === null ? 'FREE' : 'ASSIGNED',
        customerType: data.customerType ?? 'NORMAL',
        initialScore: Number(data.initialScore ?? 0),
        healthScore: Number(data.healthScore ?? 0),
        salespersonId,
      });

      await this.addHistory(manager, customer.id, user.id, 'CREATE', 'Customer created');
      return customer;
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const customer = await this.customers.findOne({
      where: this.accessibleWhere(id, user),
      relations: { assignedTo: true, history: { user: true }, sales: { user: true }, invoices: true },
      order: { history: { createdAt: 'DESC' } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    const validInvoices = (customer.invoices || []).filter(invoice => invoice.status !== 'CANCELLED');
    const totalPurchases = validInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const lastPurchase = validInvoices.reduce<Date | null>((latest, invoice) => {
      const date = invoice.invoiceDate || invoice.createdAt;
      return !latest || date > latest ? date : latest;
    }, null);
    return { ...this.sanitizeCustomer(customer), totalPurchases, totalSale: totalPurchases, invoiceCount: validInvoices.length, lastPurchase };
  }

  update(id: number, data: any, user: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      const customer = await this.requireAccessibleCustomer(id, user, manager);
      this.validateCustomerUpdate(data);
      if (data.phone !== undefined) await this.ensurePhoneAvailable(data.phone, id, manager);
      const editableFields = [
        'name', 'storeName', 'phone', 'province', 'city', 'address', 'nationalCode', 'description',
        'customerType', 'initialScore', 'healthScore',
      ] as const;
      const changedFields: string[] = [];
      if (user.role === 'ADMIN' && data.status !== undefined) {
        customer.status = data.status;
        changedFields.push('status');
      }

      for (const field of editableFields) {
        if (data[field] !== undefined) {
          (customer as any)[field] = ['initialScore', 'healthScore'].includes(field)
            ? Number(data[field])
            : ['name', 'phone'].includes(field)
              ? data[field].trim()
              : data[field];
          changedFields.push(field);
        }
      }

      const saved = await manager.getRepository(Customer).save(customer);
      await this.addHistory(
        manager,
        id,
        user.id,
        'UPDATE',
        changedFields.length ? `Updated fields: ${changedFields.join(', ')}` : 'Customer update requested',
      );
      return saved;
    });
  }

  remove(id: number, adminId: number) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Customer);
      const customer = await repository.findOneBy({ id });
      if (!customer) throw new NotFoundException('Customer not found');
      await this.addHistory(
        manager,
        customer.id,
        adminId,
        'DELETE',
        `Deleted customer ${customer.name} (${customer.phone})`,
      );
      return repository.remove(customer);
    });
  }

  assign(customerId: number, userId: number, adminId: number) {
    if (!Number.isInteger(userId)) throw new BadRequestException('userId must be a number');

    return this.dataSource.transaction(async (manager) => {
      const customer = await manager.getRepository(Customer).findOneBy({ id: customerId });
      if (!customer) throw new NotFoundException('Customer not found');
      const salesperson = await this.requireSalesUser(userId, manager);

      customer.salespersonId = salesperson.id;
      customer.status = 'ASSIGNED';
      const saved = await manager.getRepository(Customer).save(customer);
      await this.addHistory(
        manager,
        customerId,
        adminId,
        'ASSIGN',
        `Customer assigned to ${salesperson.name}`,
      );
      return saved;
    });
  }

  release(customerId: number, adminId: number) {
    return this.dataSource.transaction(async (manager) => {
      const customer = await manager.getRepository(Customer).findOneBy({ id: customerId });
      if (!customer) throw new NotFoundException('Customer not found');
      customer.salespersonId = null;
      customer.status = 'FREE';
      const saved = await manager.getRepository(Customer).save(customer);
      await this.addHistory(manager, customerId, adminId, 'RELEASE', 'Customer released');
      return saved;
    });
  }

  async getHistory(customerId: number, user: AuthenticatedUser) {
    const customer = await this.customers.findOneBy(this.accessibleWhere(customerId, user));
    if (!customer) throw new NotFoundException('Customer not found');

    const history = await this.histories.find({
      where: { customerId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return history.map((item) => ({
      ...item,
      user: item.user ? { id: item.user.id, name: item.user.name, role: item.user.role } : null,
    }));
  }

  async addNote(customerId: number, data: any, user: AuthenticatedUser) {
    const customer = await this.customers.findOneBy(this.accessibleWhere(customerId, user));
    if (!customer) throw new NotFoundException('Customer not found');
    const description = String(data.description ?? data.note ?? '').trim();
    if (!description) throw new BadRequestException('note is required');
    const action = ['NOTE', 'COMMENT', 'FEEDBACK'].includes(String(data.action).toUpperCase())
      ? String(data.action).toUpperCase()
      : 'NOTE';
    const saved = await this.histories.save({ customerId, userId: user.id, action, description });
    return this.histories.findOne({ where: { id: saved.id }, relations: { user: true } });
  }

  async getCustomerStatistics() {
    const [totalCustomers, activeCustomers, unassignedCustomers, rawPerSalesperson] = await Promise.all([
      this.customers.count(),
      this.customers.countBy({ status: 'ACTIVE' }),
      this.customers.createQueryBuilder('customer').where('customer.salespersonId IS NULL').getCount(),
      this.customers.createQueryBuilder('customer')
        .innerJoin('customer.assignedTo', 'salesperson')
        .select('salesperson.id', 'userId')
        .addSelect('salesperson.name', 'name')
        .addSelect('COUNT(customer.id)', 'customerCount')
        .groupBy('salesperson.id')
        .addGroupBy('salesperson.name')
        .orderBy('COUNT(customer.id)', 'DESC')
        .getRawMany<{ userId: string; name: string; customerCount: string }>(),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      customersPerSalesperson: rawPerSalesperson.map((item) => ({
        userId: Number(item.userId),
        name: item.name,
        customerCount: Number(item.customerCount),
      })),
      unassignedCustomers,
    };
  }

  private accessibleWhere(id: number, user: AuthenticatedUser) {
    return user.role === 'ADMIN' ? { id } : { id, salespersonId: user.id };
  }

  private async requireAccessibleCustomer(id: number, user: AuthenticatedUser, manager: EntityManager) {
    const customer = await manager.getRepository(Customer).findOneBy(this.accessibleWhere(id, user));
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async requireSalesUser(id: number, manager: EntityManager) {
    const user = await manager.getRepository(User).findOneBy({ id, role: 'SALES' });
    if (!user) throw new BadRequestException('Assigned user must be a SALES user');
    return user;
  }

  private addHistory(
    manager: EntityManager,
    customerId: number | null,
    userId: number | null,
    action: string,
    description: string,
  ) {
    return manager.getRepository(CustomerHistory).save({ customerId, userId, action, description });
  }

  private optionalNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new BadRequestException('salespersonId must be a number');
    return parsed;
  }

  private validateRequiredCustomerFields(data: any) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw new BadRequestException('name is required');
    }
    if (typeof data.phone !== 'string' || !data.phone.trim()) {
      throw new BadRequestException('phone is required');
    }
    this.validateScores(data);
  }

  private validateCustomerUpdate(data: any) {
    if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim())) {
      throw new BadRequestException('name cannot be empty');
    }
    if (data.phone !== undefined && (typeof data.phone !== 'string' || !data.phone.trim())) {
      throw new BadRequestException('phone cannot be empty');
    }
    this.validateScores(data);
  }

  private validateScores(data: any) {
    for (const field of ['initialScore', 'healthScore']) {
      if (data[field] !== undefined && !Number.isInteger(Number(data[field]))) {
        throw new BadRequestException(`${field} must be an integer`);
      }
    }
  }

  private async ensurePhoneAvailable(phone: string, excludedId: number | null, manager: EntityManager) {
    const existing = await manager.getRepository(Customer).findOneBy({ phone: phone.trim() });
    if (existing && existing.id !== excludedId) {
      throw new BadRequestException('A customer with this phone already exists');
    }
  }

  private sanitizeCustomer(customer: Customer) {
    return {
      ...customer,
      assignedToId: customer.salespersonId,
      assignedTo: customer.assignedTo
        ? {
            id: customer.assignedTo.id,
            name: customer.assignedTo.name,
            phone: customer.assignedTo.phone,
            role: customer.assignedTo.role,
          }
        : null,
      history: customer.history?.map((item) => ({
        ...item,
        user: item.user ? { id: item.user.id, name: item.user.name, role: item.user.role } : null,
      })),
    };
  }

  private customerImportAliases(): Record<string, string[]> {
    return {
      name: ['name', 'customer', 'customerName', 'customer name', 'customer_name', '\u0646\u0627\u0645', '\u0645\u0634\u062a\u0631\u06cc', '\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc', '\u0646\u0627\u0645 \u0634\u062e\u0635', '\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc'],
      storeName: ['storeName', 'store name', 'storename', 'store_name', '\u0641\u0631\u0648\u0634\u06af\u0627\u0647', '\u0646\u0627\u0645 \u0641\u0631\u0648\u0634\u06af\u0627\u0647'],
      phone: ['phone', 'mobile', 'customerPhone', '\u062a\u0644\u0641\u0646', '\u062a\u0644\u0641\u0646 \u0647\u0645\u0631\u0627\u0647', '\u0634\u0645\u0627\u0631\u0647', '\u0634\u0645\u0627\u0631\u0647 \u062a\u0645\u0627\u0633', '\u0645\u0648\u0628\u0627\u06cc\u0644'],
      province: ['province', '\u0627\u0633\u062a\u0627\u0646'],
      city: ['city', '\u0634\u0647\u0631'],
      address: ['address', '\u0622\u062f\u0631\u0633'],
      nationalCode: ['nationalCode', 'nationalcode', 'national code', 'national_code', '\u06a9\u062f \u0645\u0644\u06cc'],
      status: ['status', '\u0648\u0636\u0639\u06cc\u062a'],
      customerType: ['customerType', 'customer type', 'customer_type', 'type', '\u0646\u0648\u0639 \u0645\u0634\u062a\u0631\u06cc'],
    };
  }

  private normalizeImportHeader(value: unknown) {
    return String(value ?? '').trim().toLowerCase().replace(/[\u200c\u200f\s_.\-/]+/g, '');
  }

  private customerHeaderScore(field: string, value: unknown) {
    const key = this.normalizeImportHeader(value);
    if (!key) return 0;
    return this.customerImportAliases()[field].reduce((best, alias) => {
      const aliasKey = this.normalizeImportHeader(alias);
      if (key === aliasKey) return Math.max(best, 100);
      if (Math.min(key.length, aliasKey.length) >= 3 && (key.includes(aliasKey) || aliasKey.includes(key))) return Math.max(best, 55);
      return best;
    }, 0);
  }

  private detectCustomerHeader(value: unknown) {
    const best = Object.keys(this.customerImportAliases()).map(field => ({ field, score: this.customerHeaderScore(field, value) })).sort((a, b) => b.score - a.score)[0];
    return best?.score ? best : { field: '', score: 0 };
  }

  private normalizeImportRow(source: Record<string, unknown>, rowNumber: number) {
    const aliases = this.customerImportAliases();
    const normalized = Object.fromEntries(Object.entries(source).map(([key, value]) => [this.normalizeImportHeader(key), value]));
    const read = (field: string) => {
      const key = aliases[field].map(alias => this.normalizeImportHeader(alias)).find(alias => normalized[alias] !== undefined);
      return key ? String(normalized[key] ?? '').trim() : '';
    };
    return {
      rowNumber,
      name: read('name'),
      storeName: read('storeName'),
      phone: preferredContactNumber(read('phone')),
      province: read('province'),
      city: read('city'),
      address: read('address'),
      nationalCode: latinDigits(read('nationalCode')).replace(/[^\d]/g, ''),
      status: 'FREE',
      customerType: read('customerType').toUpperCase() || 'NORMAL',
      errors: [] as string[],
    };
  }
}

function preferredContactNumber(value: string) {
  const groups = latinDigits(value).match(/\d+/g) || [];
  const normalized = groups.map(group => {
    if (/^989\d{9}$/.test(group)) return `0${group.slice(2)}`;
    if (/^00989\d{9}$/.test(group)) return `0${group.slice(4)}`;
    return group;
  });
  return normalized.find(group => /^09\d{9}$/.test(group))
    || normalized.find(group => /^\d{7,11}$/.test(group))
    || '';
}

function latinDigits(value: unknown) {
  return String(value ?? '')
    .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660));
}
