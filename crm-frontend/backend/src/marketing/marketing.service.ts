import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { MelipayamakProvider } from './melipayamak.provider';

@Injectable()
export class MarketingService implements OnModuleInit, OnModuleDestroy {
  private automationScheduler: ReturnType<typeof setInterval> | null = null;
  private campaignScheduler: ReturnType<typeof setInterval> | null = null;
  private deliveryRunning = false;
  constructor(private readonly db: DataSource, private readonly intelligence: IntelligenceService, private readonly sms: MelipayamakProvider) {}
  onModuleInit() {
    this.automationScheduler = setInterval(() => void this.runEnabledRules(), 60 * 60 * 1000);
    this.campaignScheduler = setInterval(() => void this.processCampaignQueue(), 5000);
    void this.runEnabledRules();
    void this.recoverInterruptedDeliveries().then(() => this.processCampaignQueue());
  }
  onModuleDestroy() {
    if (this.automationScheduler) clearInterval(this.automationScheduler);
    if (this.campaignScheduler) clearInterval(this.campaignScheduler);
  }
  deliveryStatus() { return { provider: 'melipayamak', configured: this.sms.isConfigured() }; }
  campaigns() { return this.db.query(`SELECT * FROM "SmsCampaign" ORDER BY "createdAt" DESC LIMIT 100`); }
  async recipients(id: number) {
    await this.campaign(id);
    return this.db.query(`SELECT r.id, r."customerId", r."phone", r."status", r."providerMessageId", r."error", r."createdAt", r."sentAt" FROM "SmsCampaignRecipient" r WHERE r."campaignId"=$1 ORDER BY r.id DESC LIMIT 500`, [id]);
  }
  templates() { return this.db.query(`SELECT * FROM "SmsTemplate" ORDER BY "createdAt" DESC`); }
  async createCampaign(body: any, userId: number) {
    const name = String(body?.name || '').trim(), message = String(body?.message || '').trim();
    if (!name || !message) throw new BadRequestException('Campaign name and message are required');
    if (/\{(?!name\})[^{}]*\}/i.test(message)) throw new BadRequestException('Only the {name} message placeholder is supported');
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (scheduledAt && !Number.isFinite(scheduledAt.getTime())) throw new BadRequestException('scheduledAt is invalid');
    if (scheduledAt) throw new BadRequestException('Campaign scheduling is unavailable until a delivery worker is configured');
    const rows = await this.db.query(`INSERT INTO "SmsCampaign" ("name","message","filters","status","scheduledAt","createdBy") VALUES ($1,$2,$3::jsonb,'DRAFT',NULL,$4) RETURNING *`, [name.slice(0, 150), message.slice(0, 2000), JSON.stringify(body.filters || {}), userId]);
    return rows[0];
  }
  async preview(id: number) {
    const campaign = await this.campaign(id);
    const result = await this.intelligence.filterCustomers({ ...campaign.filters, requirePhone: true, smsMarketingOnly: true, smsPhoneOnly: true, limit: 100 }, { id: Number(campaign.createdBy || 0), role: 'ADMIN' });
    await this.db.query(`UPDATE "SmsCampaign" SET "recipientCount"=$1,"updatedAt"=now() WHERE id=$2`, [result.count, id]);
    return { campaign: { ...campaign, recipientCount: result.count }, count: result.count, sample: result.customers.slice(0, 10) };
  }
  async send(id: number, body: any) {
    if (body?.confirm !== true) throw new BadRequestException('Explicit confirmation is required before sending');
    this.sms.assertConfigured();
    const campaign = await this.campaign(id);
    if (campaign.status !== 'DRAFT') throw new ConflictException('This campaign has already been queued or processed');
    const filters = { ...campaign.filters, requirePhone: true, smsMarketingOnly: true, smsPhoneOnly: true, limit: 100 };
    const total = await this.intelligence.filterCustomers(filters, { id: Number(campaign.createdBy || 0), role: 'ADMIN' });
    const expected = Number(body.expectedRecipientCount);
    if (!Number.isInteger(expected) || expected !== total.count) throw new ConflictException('The eligible audience changed after preview. Preview the campaign again before sending.');
    if (!total.count) throw new BadRequestException('There are no customers with recorded SMS consent and a valid mobile number');
    if (total.count > 1000) throw new BadRequestException('Campaigns are limited to 1,000 opted-in recipients; narrow the filters and preview again');

    let offset = 0;
    while (offset < total.count) {
      const page = await this.intelligence.filterCustomers({ ...filters, offset }, { id: Number(campaign.createdBy || 0), role: 'ADMIN' });
      if (!page.customers.length) break;
      const values: unknown[] = [];
      const tuples = page.customers.map((customer: any) => {
        const start = values.length;
        values.push(id, customer.id, customer.phone);
        return `($${start + 1},$${start + 2},$${start + 3},'QUEUED')`;
      });
      await this.db.query(`INSERT INTO "SmsCampaignRecipient" ("campaignId","customerId","phone","status") VALUES ${tuples.join(',')} ON CONFLICT ("campaignId","customerId") DO NOTHING`, values);
      offset += page.limit;
    }

    const queued = await this.db.query(`SELECT COUNT(*)::int AS count FROM "SmsCampaignRecipient" WHERE "campaignId"=$1 AND "status"='QUEUED'`, [id]);
    const queuedCount = Number(queued[0]?.count || 0);
    if (!queuedCount) throw new ConflictException('No new recipients could be queued for this campaign');
    await this.db.query(`UPDATE "SmsCampaign" SET "status"='QUEUED',"recipientCount"=$1,"sentCount"=0,"failedCount"=0,"skippedCount"=0,"sentAt"=NULL,"updatedAt"=now() WHERE id=$2`, [queuedCount, id]);
    void this.processCampaignQueue();
    return { campaignId: id, status: 'QUEUED', recipientCount: queuedCount, message: 'Campaign queued for delivery to customers with recorded SMS consent.' };
  }
  async createTemplate(body: any) {
    const name = String(body?.name || '').trim(), message = String(body?.message || '').trim();
    if (!name || !message) throw new BadRequestException('Template name and message are required');
    const rows = await this.db.query(`INSERT INTO "SmsTemplate" ("name","message") VALUES ($1,$2) RETURNING *`, [name.slice(0, 150), message.slice(0, 2000)]);
    return rows[0];
  }
  automations() { return this.db.query(`SELECT * FROM "AutomationRule" ORDER BY id`); }
  async createAutomation(body: any) {
    const name = String(body?.name || '').trim(), type = String(body?.type || '').toUpperCase(), message = String(body?.message || '').trim();
    if (!name || !message || !['REENGAGEMENT','BIRTHDAY'].includes(type)) throw new BadRequestException('Valid automation name, type and message are required');
    const delayDays = Number(body.delayDays ?? (type === 'REENGAGEMENT' ? 30 : 0)), cooldownDays = Number(body.cooldownDays ?? 30);
    if (!Number.isInteger(delayDays) || delayDays < 0 || !Number.isInteger(cooldownDays) || cooldownDays < 0) throw new BadRequestException('Automation periods must be non-negative integers');
    const rows = await this.db.query(`INSERT INTO "AutomationRule" ("name","type","enabled","delayDays","cooldownDays","message","targetFilters") VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`, [name.slice(0, 150), type, Boolean(body.enabled), delayDays, cooldownDays, message.slice(0, 2000), JSON.stringify(body.targetFilters || {})]);
    return rows[0];
  }
  async updateAutomation(id: number, body: any) {
    const current = await this.db.query(`SELECT * FROM "AutomationRule" WHERE id=$1`, [id]);
    if (!current[0]) throw new NotFoundException('Automation rule not found');
    const old = current[0];
    const delay = body.delayDays === undefined ? old.delayDays : Number(body.delayDays), cooldown = body.cooldownDays === undefined ? old.cooldownDays : Number(body.cooldownDays);
    if (!Number.isInteger(delay) || delay < 0 || !Number.isInteger(cooldown) || cooldown < 0) throw new BadRequestException('Automation periods must be non-negative integers');
    const rows = await this.db.query(`UPDATE "AutomationRule" SET "enabled"=$2,"delayDays"=$3,"cooldownDays"=$4,"message"=$5,"targetFilters"=$6::jsonb,"updatedAt"=now() WHERE id=$1 RETURNING *`, [id, body.enabled === undefined ? old.enabled : Boolean(body.enabled), delay, cooldown, body.message === undefined ? old.message : String(body.message).slice(0, 2000), JSON.stringify(body.targetFilters === undefined ? old.targetFilters : body.targetFilters)]);
    return rows[0];
  }
  async runAutomation(id: number) {
    const rows = await this.db.query(`SELECT * FROM "AutomationRule" WHERE id=$1 AND "enabled"=true`, [id]);
    const rule = rows[0]; if (!rule) throw new NotFoundException('Enabled automation rule not found');
    const filters = rule.type === 'REENGAGEMENT' ? { ...rule.targetFilters, daysSinceLastPurchase: rule.delayDays, limit: 100 } : { ...rule.targetFilters, birthdayMonth: new Date().getMonth() + 1, limit: 100 };
    let offset = 0, matched = 0;
    let prepared = 0;
    while (true) {
      const matches = await this.intelligence.filterCustomers({ ...filters, offset }, { id: 0, role: 'ADMIN' });
      matched = matches.count;
      if (!matches.customers.length) break;
      for (const customer of matches.customers as any[]) {
        if (rule.type === 'BIRTHDAY' && new Date(customer.dateOfBirth).getDate() !== new Date().getDate()) continue;
        const periodKey = rule.type === 'BIRTHDAY' ? String(new Date().getFullYear()) : `window-${Math.floor(Date.now() / (Math.max(Number(rule.cooldownDays), 1) * 86400000))}`;
        const result = await this.db.query(`INSERT INTO "AutomationExecution" ("ruleId","customerId","periodKey","status","reason") VALUES ($1,$2,$3,'PREPARED',$4) ON CONFLICT ("ruleId","customerId","periodKey") DO NOTHING RETURNING id`, [id, customer.id, periodKey, `${rule.type} message prepared; external delivery requires a configured campaign-capable SMS provider.`]);
        prepared += result.length;
      }
      offset += matches.limit;
      if (offset >= matches.count) break;
    }
    return { automationId: id, matched, prepared, status: 'PREPARED', message: 'No SMS was sent. Prepared records are deduplicated by customer and cooldown/year.' };
  }
  private async runEnabledRules() {
    try { const rules = await this.db.query(`SELECT id FROM "AutomationRule" WHERE "enabled"=true`); for (const rule of rules) await this.runAutomation(Number(rule.id)); }
    catch (error) { console.error('Marketing automation cycle failed:', error instanceof Error ? error.message : String(error)); }
  }
  private async processCampaignQueue() {
    if (this.deliveryRunning || !this.sms.isConfigured()) return;
    this.deliveryRunning = true;
    try {
      for (let sent = 0; sent < 5; sent++) {
        const claimed = await this.db.transaction(async manager => manager.query(`WITH candidate AS (
          SELECT r.id FROM "SmsCampaignRecipient" r JOIN "SmsCampaign" c ON c.id=r."campaignId" WHERE r."status"='QUEUED' AND c."status" IN ('QUEUED','SENDING') ORDER BY r.id FOR UPDATE OF r SKIP LOCKED LIMIT 1
        ) UPDATE "SmsCampaignRecipient" r SET "status"='SENDING',"updatedAt"=now() FROM candidate WHERE r.id=candidate.id RETURNING r.id,r."campaignId",r."customerId",r."phone"`));
        if (!claimed.length) break;
        const recipient = claimed[0];
        try {
          const rows = await this.db.query(`SELECT r."phone" AS "queuedPhone", c.phone, c.name, c."smsMarketingOptIn", campaign.message FROM "SmsCampaignRecipient" r JOIN "Customer" c ON c.id=r."customerId" JOIN "SmsCampaign" campaign ON campaign.id=r."campaignId" WHERE r.id=$1`, [recipient.id]);
          const customer = rows[0];
          if (!customer || !customer.smsMarketingOptIn || !customer.phone || customer.phone !== customer.queuedPhone) {
            await this.finishRecipient(recipient.id, recipient.campaignId, 'SKIPPED', 'Consent was withdrawn or the customer phone changed after queueing.');
            continue;
          }
          const text = String(customer.message).replace(/\{name\}/gi, String(customer.name || '').trim());
          const providerMessageId = await this.sms.send(customer.phone, text);
          await this.db.query(`UPDATE "SmsCampaignRecipient" SET "status"='SENT',"providerMessageId"=$2,"error"=NULL,"sentAt"=now(),"updatedAt"=now() WHERE id=$1`, [recipient.id, providerMessageId]);
          await this.refreshCampaignCounts(recipient.campaignId);
        } catch (error) {
          await this.finishRecipient(recipient.id, recipient.campaignId, 'FAILED', error instanceof Error ? error.message.slice(0, 500) : 'SMS delivery failed');
        }
      }
    } catch (error) {
      console.error('Campaign SMS worker failed:', error instanceof Error ? error.message : String(error));
    } finally {
      this.deliveryRunning = false;
    }
  }
  private async recoverInterruptedDeliveries() {
    const [interrupted] = await this.db.query(`UPDATE "SmsCampaignRecipient" SET "status"='FAILED',"error"='Delivery outcome is unknown after worker interruption; verify provider records before retry.',"updatedAt"=now() WHERE "status"='SENDING' AND "updatedAt" < now() - interval '1 minute' RETURNING "campaignId"`);
    for (const campaignId of new Set<number>(interrupted.map((row: any) => Number(row.campaignId)))) await this.refreshCampaignCounts(campaignId);
  }
  private async finishRecipient(recipientId: number, campaignId: number, status: 'FAILED' | 'SKIPPED', reason: string) {
    await this.db.query(`UPDATE "SmsCampaignRecipient" SET "status"=$2,"error"=$3,"updatedAt"=now() WHERE id=$1`, [recipientId, status, reason]);
    await this.refreshCampaignCounts(campaignId);
  }
  private async refreshCampaignCounts(campaignId: number) {
    await this.db.query(`UPDATE "SmsCampaign" campaign SET
      "sentCount"=stats.sent,"failedCount"=stats.failed,"skippedCount"=stats.skipped,
      "status"=CASE WHEN stats.pending>0 THEN 'SENDING' WHEN stats.sent>0 AND stats.failed=0 AND stats.skipped=0 THEN 'SENT' WHEN stats.sent>0 THEN 'PARTIAL' WHEN stats.skipped=stats.total THEN 'CANCELLED' ELSE 'FAILED' END,
      "sentAt"=CASE WHEN stats.pending=0 AND stats.sent>0 THEN COALESCE(campaign."sentAt",now()) ELSE NULL END,"updatedAt"=now()
      FROM (SELECT COUNT(*) FILTER (WHERE "status" IN ('QUEUED','SENDING'))::int AS pending,
        COUNT(*) FILTER (WHERE "status"='SENT')::int AS sent, COUNT(*) FILTER (WHERE "status"='FAILED')::int AS failed,
        COUNT(*) FILTER (WHERE "status"='SKIPPED')::int AS skipped, COUNT(*)::int AS total
        FROM "SmsCampaignRecipient" WHERE "campaignId"=$1) stats WHERE campaign.id=$1`, [campaignId]);
  }
  private async campaign(id: number) { const rows = await this.db.query(`SELECT * FROM "SmsCampaign" WHERE id=$1`, [id]); if (!rows[0]) throw new NotFoundException('Campaign not found'); return rows[0]; }
}
