import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, Invoice, Sale } from '../entities';

type Actor = { id: number; role: string };

@Injectable()
export class IntelligenceService {
  constructor(@InjectRepository(Customer) private readonly customers: Repository<Customer>, @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>, @InjectRepository(Sale) private readonly sales: Repository<Sale>) {}

  async filterCustomers(filters: any, actor: Actor) {
    const query = this.baseCustomerQuery(actor);
    if (filters.city) query.andWhere('LOWER(customer.city) = LOWER(:city)', { city: String(filters.city).slice(0, 100) });
    if (filters.province) query.andWhere('LOWER(customer.province) = LOWER(:province)', { province: String(filters.province).slice(0, 100) });
    if (filters.salespersonId && actor.role === 'ADMIN') query.andWhere('customer.salespersonId = :salespersonId', { salespersonId: this.numeric(filters.salespersonId, 'salespersonId') });
    if (filters.status) query.andWhere('UPPER(customer.status) = :status', { status: String(filters.status).toUpperCase() });
    if (filters.requirePhone === true || filters.requirePhone === 'true') query.andWhere("customer.phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(customer.phone, '[^0-9]', '', 'g')) BETWEEN 10 AND 15");
    if (filters.smsMarketingOnly === true || filters.smsMarketingOnly === 'true') query.andWhere('customer."smsMarketingOptIn" = true');
    if (filters.smsPhoneOnly === true || filters.smsPhoneOnly === 'true') query.andWhere(`REGEXP_REPLACE(customer.phone, '[^0-9]', '', 'g') ~ '^(09[0-9]{9}|9[0-9]{9}|989[0-9]{9}|00989[0-9]{9})$'`);
    if (filters.customerAge === 'new') query.andWhere('customer."createdAt" >= :newSince', { newSince: new Date(Date.now() - 30 * 86400000) });
    if (filters.customerAge === 'old') query.andWhere('customer."createdAt" < :newSince', { newSince: new Date(Date.now() - 30 * 86400000) });
    if (filters.birthdayMonth) {
      const month = this.numeric(filters.birthdayMonth, 'birthdayMonth');
      if (!Number.isInteger(month) || month < 1 || month > 12) throw new BadRequestException('birthdayMonth must be between 1 and 12');
      query.andWhere('EXTRACT(MONTH FROM customer."dateOfBirth") = :birthdayMonth', { birthdayMonth: month });
    }
    if (filters.minPurchase !== undefined && filters.minPurchase !== '') query.andWhere('COALESCE(purchases.total, salespurchases.total, 0) >= :minPurchase', { minPurchase: this.numeric(filters.minPurchase, 'minPurchase') });
    if (filters.maxPurchase !== undefined && filters.maxPurchase !== '') query.andWhere('COALESCE(purchases.total, salespurchases.total, 0) <= :maxPurchase', { maxPurchase: this.numeric(filters.maxPurchase, 'maxPurchase') });
    if (filters.minPurchases !== undefined && filters.minPurchases !== '') query.andWhere('COALESCE(purchases.count, salespurchases.count, 0) >= :minPurchases', { minPurchases: this.numeric(filters.minPurchases, 'minPurchases') });
    if (filters.maxPurchases !== undefined && filters.maxPurchases !== '') query.andWhere('COALESCE(purchases.count, salespurchases.count, 0) <= :maxPurchases', { maxPurchases: this.numeric(filters.maxPurchases, 'maxPurchases') });
    const lastPurchaseSql = 'COALESCE(purchases.last_purchase, salespurchases.last_purchase)';
    if (filters.daysSinceLastPurchase !== undefined && filters.daysSinceLastPurchase !== '') query.andWhere(`(${lastPurchaseSql} IS NULL OR ${lastPurchaseSql} <= NOW() - (:daysSince * INTERVAL '1 day'))`, { daysSince: this.numeric(filters.daysSinceLastPurchase, 'daysSinceLastPurchase') });
    if (filters.purchasedAfterDays) query.andWhere(`${lastPurchaseSql} >= NOW() - (:recentDays * INTERVAL '1 day')`, { recentDays: this.numeric(filters.purchasedAfterDays, 'purchasedAfterDays') });
    if (filters.lastPurchaseAfter) query.andWhere(`${lastPurchaseSql} >= :lastPurchaseAfter`, { lastPurchaseAfter: this.validDate(filters.lastPurchaseAfter, 'lastPurchaseAfter') });
    if (filters.lastPurchaseBefore) query.andWhere(`${lastPurchaseSql} < :lastPurchaseBefore`, { lastPurchaseBefore: this.validDate(filters.lastPurchaseBefore, 'lastPurchaseBefore') });
    if (filters.product) query.andWhere('(EXISTS (SELECT 1 FROM "Sale" s WHERE s."customerId" = customer.id AND s."productName" ILIKE :product) OR EXISTS (SELECT 1 FROM "Invoice" i JOIN LATERAL jsonb_array_elements(COALESCE(i.items, \'[]\'::jsonb)) x ON TRUE WHERE i."customerId" = customer.id AND x->>\'productName\' ILIKE :product))', { product: `%${String(filters.product).slice(0, 100)}%` });
    if (filters.brand) query.andWhere('(EXISTS (SELECT 1 FROM "Sale" s WHERE s."customerId" = customer.id AND s."productName" ILIKE :brand) OR EXISTS (SELECT 1 FROM "Invoice" i JOIN LATERAL jsonb_array_elements(COALESCE(i.items, \'[]\'::jsonb)) x ON TRUE WHERE i."customerId" = customer.id AND x->>\'productName\' ILIKE :brand))', { brand: `%${String(filters.brand).slice(0, 100)}%` });
    const count = await query.clone().getCount();
    const limit = Math.min(Math.max(this.integer(filters.limit || 50, 'limit'), 1), 100);
    const offset = Math.max(this.integer(filters.offset || 0, 'offset'), 0);
    const [rows, totals] = await Promise.all([
      query.clone().select(['customer.id AS id', 'customer.name AS name', 'customer.phone AS phone', 'customer.city AS city', 'customer.province AS province', 'customer.status AS status', 'customer."dateOfBirth" AS "dateOfBirth"', 'customer."smsMarketingOptIn" AS "smsMarketingOptIn"', 'customer."salespersonId" AS "salespersonId"', 'customer."createdAt" AS "createdAt"', 'COALESCE(purchases.total, salespurchases.total, 0) AS "totalPurchase"', 'COALESCE(purchases.count, salespurchases.count, 0) AS "purchaseCount"', `${lastPurchaseSql} AS "lastPurchase"`]).orderBy(filters.smsMarketingOnly ? 'customer.id' : 'COALESCE(purchases.total, salespurchases.total)', filters.smsMarketingOnly ? 'ASC' : 'DESC', 'NULLS LAST').addOrderBy('customer.id', 'ASC').limit(limit).offset(offset).getRawMany(),
      query.clone().select('COALESCE(SUM(COALESCE(purchases.total, salespurchases.total, 0)),0)', 'totalPurchaseValue').addSelect('COALESCE(AVG(COALESCE(purchases.total, salespurchases.total, 0)),0)', 'averageCustomerValue').getRawOne(),
    ]);
    return { customers: rows, count, limit, offset, summary: { totalPurchaseValue: Number(totals?.totalPurchaseValue || 0), averageCustomerValue: Number(totals?.averageCustomerValue || 0) } };
  }

  async customerInsight(id: number, actor: Actor) {
    if (!Number.isInteger(id) || id < 1) throw new BadRequestException('customer id must be a positive integer');
    const customer = await this.baseCustomerQuery(actor).andWhere('customer.id = :id', { id }).getOne();
    if (!customer) throw new NotFoundException('Customer not found');
    const invoices = await this.invoices.createQueryBuilder('invoice').where('invoice.customerId = :id', { id }).andWhere("invoice.status != 'CANCELLED'").orderBy('COALESCE(invoice.invoiceDate, invoice.createdAt)', 'ASC').getMany();
    const sales = invoices.length ? [] : await this.sales.find({ where: { customerId: id }, order: { saleDate: 'ASC', createdAt: 'ASC' } });
    let values = invoices.map(x => Number(x.total));
    let purchaseDates = invoices.map(x => x.invoiceDate || x.createdAt);
    if (!invoices.length) {
      const orders = new Map<string, { total: number; date: Date }>();
      for (const sale of sales) { const key = sale.invoiceNumber || `sale-${sale.id}`, current = orders.get(key); const date = sale.saleDate || sale.createdAt; orders.set(key, { total: (current?.total || 0) + Number(sale.amount || 0), date: current && current.date > date ? current.date : date }); }
      values = [...orders.values()].map(order => order.total); purchaseDates = [...orders.values()].map(order => order.date);
    }
    const dates = purchaseDates.filter(Boolean).map(x => new Date(x).getTime());
    const gaps = dates.slice(1).map((x, i) => (x - dates[i]) / 86400000);
    const avgInterval = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    const products = new Map<string, number>();
    if (invoices.length) for (const invoice of invoices) for (const item of invoice.items || []) products.set(item.productName, (products.get(item.productName) || 0) + Number(item.quantity || 1));
    else for (const sale of sales) products.set(sale.productName, (products.get(sale.productName) || 0) + Number(sale.quantity || 1));
    const currentGap = dates.length ? (Date.now() - dates.at(-1)!) / 86400000 : null;
    return { customer: { id, name: customer.name, city: customer.city, province: customer.province, status: customer.status }, purchaseCount: values.length, totalPurchaseValue: values.reduce((a, b) => a + b, 0), averageOrderValue: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0, highestOrder: values.length ? Math.max(...values) : 0, lowestOrder: values.length ? Math.min(...values) : 0, firstPurchase: dates.length ? new Date(dates[0]) : null, lastPurchase: dates.length ? new Date(dates.at(-1)!) : null, averagePurchaseIntervalDays: avgInterval, daysSinceLastPurchase: currentGap === null ? null : Math.floor(currentGap), preferredPurchaseDay: dates.length ? Math.round(dates.reduce((sum, date) => sum + new Date(date).getDate(), 0) / dates.length) : null, topProducts: [...products].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([product, quantity]) => ({ product, quantity })) };
  }

  async churn(filters: any, actor: Actor) {
    const result = await this.filterCustomers({ ...filters, daysSinceLastPurchase: Number(filters.inactiveDays) || 30, limit: Math.min(Number(filters.limit) || 100, 100) }, actor);
    const rows = await Promise.all(result.customers.map(async (c: any) => {
      const insight = await this.customerInsight(Number(c.id), actor);
      if (!insight.daysSinceLastPurchase) return null;
      const interval = insight.averagePurchaseIntervalDays;
      const threshold = Number(filters.inactiveDays) || 30;
      const atRisk = insight.daysSinceLastPurchase >= Math.max(threshold, interval || threshold);
      if (!atRisk) return null;
      return { ...c, averagePurchaseIntervalDays: interval, daysSinceLastPurchase: insight.daysSinceLastPurchase, reason: interval ? `Customer normally purchases every ${Math.round(interval)} days; ${insight.daysSinceLastPurchase} days have passed since last purchase.` : `${insight.daysSinceLastPurchase} days have passed since the last purchase.` };
    }));
    return { customers: rows.filter(Boolean), count: rows.filter(Boolean).length, rule: "At risk when time since last purchase is at least the configured inactivity threshold or the customer's historical average purchase interval." };
  }

  async recommendations(actor: Actor) {
    const churn = await this.churn({ inactiveDays: 30, limit: 100 }, actor);
    const byCityAndProduct = new Map<string, { city: string; product: string; count: number }>();
    for (const customer of churn.customers as any[]) {
      const insight = await this.customerInsight(customer.id, actor);
      if (!insight.customer.city || !insight.topProducts.length) continue;
      const product = insight.topProducts[0].product;
      const key = `${insight.customer.city}\0${product}`;
      const record = byCityAndProduct.get(key) || { city: insight.customer.city, product, count: 0 };
      record.count++; byCityAndProduct.set(key, record);
    }
    return [...byCityAndProduct.values()].sort((a, b) => b.count - a.count).slice(0, 10).map(item => ({ ...item, reason: `${item.count} at-risk customers in ${item.city} have previously purchased ${item.product}.` }));
  }

  async dashboard(actor: Actor) {
    const customers = this.baseCustomerQuery(actor);
    const [totalCustomers, activeCustomers, inactive] = await Promise.all([customers.clone().getCount(), customers.clone().andWhere("UPPER(customer.status) = 'ACTIVE'").getCount(), this.churn({ inactiveDays: 30, limit: 100 }, actor)]);
    return { totalCustomers, activeCustomers, inactiveCustomers: inactive.count, churnRiskCustomers: inactive.count, recommendations: await this.recommendations(actor) };
  }

  async safeQuery(body: any, actor: Actor) {
    const intent = String(body?.intent || '');
    const allowed = new Set(['customer_search', 'churn_risk', 'customer_insight', 'recommendations']);
    if (!allowed.has(intent)) throw new BadRequestException('Unsupported read-only CRM query intent');
    if (intent === 'customer_search') return { intent, ...await this.filterCustomers(body.filters || {}, actor) };
    if (intent === 'churn_risk') return { intent, ...await this.churn(body.filters || {}, actor) };
    if (intent === 'recommendations') return { intent, recommendations: await this.recommendations(actor) };
    const customerId = this.numeric(body.customerId, 'customerId');
    return { intent, ...await this.customerInsight(customerId, actor) };
  }

  private baseCustomerQuery(actor: Actor) {
    return this.customers.createQueryBuilder('customer')
      .leftJoin(q => q.select('i."customerId"', 'customerId').addSelect('SUM(i.total)', 'total').addSelect('COUNT(i.id)', 'count').addSelect('MAX(COALESCE(i."invoiceDate", i."createdAt"))', 'last_purchase').from(Invoice, 'i').where("i.status != 'CANCELLED'").groupBy('i."customerId"'), 'purchases', 'purchases."customerId" = customer.id')
      .leftJoin(q => q.select('s."customerId"', 'customerId').addSelect('SUM(s.amount)', 'total').addSelect('COUNT(DISTINCT COALESCE(s."invoiceNumber", CAST(s.id AS text)))', 'count').addSelect('MAX(COALESCE(s."saleDate", s."createdAt"))', 'last_purchase').from(Sale, 's').groupBy('s."customerId"'), 'salespurchases', 'salespurchases."customerId" = customer.id')
      .where(actor.role === 'ADMIN' ? '1=1' : 'customer."salespersonId" = :actorId', { actorId: actor.id });
  }
  private numeric(value: unknown, name: string) { const n = Number(value); if (!Number.isFinite(n) || n < 0) throw new BadRequestException(`${name} must be a non-negative number`); return n; }
  private integer(value: unknown, name: string) { const n = this.numeric(value, name); if (!Number.isInteger(n)) throw new BadRequestException(`${name} must be an integer`); return n; }
  private validDate(value: unknown, name: string) { const date = new Date(String(value)); if (Number.isNaN(date.getTime())) throw new BadRequestException(`${name} must be a valid date`); return date; }
}
