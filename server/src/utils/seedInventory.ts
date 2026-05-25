/**
 * Inventory Seed — seeds Departments, Categories, and Brands.
 * Run with: npm run seed:inventory
 *
 * Safe to run multiple times — skips existing records.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { Department } from '../models/Department.model';
import { Category } from '../models/Category.model';
import { Brand } from '../models/Brand.model';
import { logger } from './logger';

// ─────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Electronics', description: 'Electronic components and devices' },
  { name: 'Furniture', description: 'Office and home furniture' },
  { name: 'Industrial Access', description: 'Scaffolding, access equipment and safety gear' },
  { name: 'Stationery', description: 'Office stationery and supplies' },
  { name: 'Tools', description: 'Hand tools and power tools' },
  { name: 'Lighting', description: 'LED panels, bulbs and fixtures' },
];

const CATEGORIES_BY_DEPT: Record<string, string[]> = {
  Electronics: ['Consumer', 'Industrial', 'Specialty'],
  Furniture: ['General', 'Premium', 'Budget'],
  'Industrial Access': ['General', 'Heavy Duty', 'Safety'],
  Stationery: ['General', 'Premium'],
  Tools: ['Hand Tools', 'Power Tools', 'Precision'],
  Lighting: ['Indoor', 'Outdoor', 'Industrial'],
};

const BRANDS = [
  'Acme Co.',
  'Generic',
  'Philips',
  'Bosch',
  'Godrej',
  'Havells',
  'Syska',
  'Supreme',
];

// ─────────────────────────────────────────────
// Seed runner
// ─────────────────────────────────────────────
async function seedInventory(): Promise<void> {
  logger.info('Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  // ── Departments ──────────────────────────────
  let deptSeeded = 0;
  const deptMap = new Map<string, mongoose.Types.ObjectId>();

  for (const dept of DEPARTMENTS) {
    let existing = await Department.findOne({ name: dept.name }).exec();
    if (!existing) {
      existing = await new Department(dept).save();
      deptSeeded++;
    }
    deptMap.set(dept.name, existing._id as mongoose.Types.ObjectId);
  }

  logger.info(`Departments: ${deptSeeded} new, ${DEPARTMENTS.length - deptSeeded} already exist`);

  // ── Categories ───────────────────────────────
  let catSeeded = 0;
  for (const [deptName, cats] of Object.entries(CATEGORIES_BY_DEPT)) {
    const deptId = deptMap.get(deptName);
    if (!deptId) continue;

    for (const catName of cats) {
      const exists = await Category.findOne({ name: catName, departmentId: deptId }).exec();
      if (!exists) {
        await new Category({ name: catName, departmentId: deptId }).save();
        catSeeded++;
      }
    }
  }

  const totalCats = Object.values(CATEGORIES_BY_DEPT).flat().length;
  logger.info(`Categories: ${catSeeded} new, ${totalCats - catSeeded} already exist`);

  // ── Brands ───────────────────────────────────
  let brandSeeded = 0;
  for (const name of BRANDS) {
    const exists = await Brand.findOne({ name }).exec();
    if (!exists) {
      await new Brand({ name }).save();
      brandSeeded++;
    }
  }

  logger.info(`Brands: ${brandSeeded} new, ${BRANDS.length - brandSeeded} already exist`);

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  Inventory seed complete!');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
}

seedInventory().catch((error: unknown) => {
  const err = error as Error;
  logger.error('Inventory seed failed:', err.message);
  process.exit(1);
});
