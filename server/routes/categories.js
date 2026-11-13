import { Router } from 'express';
import Category from '../models/Category.js';
import Listing from '../models/Listing.js';
import requireUser from '../middleware/requireUser.js';
import requireAdmin from '../middleware/requireAdmin.js';

export const defaultCategories = [
  { name: 'Sofas', icon: '▱' }, { name: 'Chairs', icon: '♧' }, { name: 'Tables', icon: '⌑' },
  { name: 'Bedroom', icon: '▰' }, { name: 'Storage', icon: '▤' }, { name: 'Lighting', icon: '☼' }, { name: 'Outdoor', icon: '♧' },
];
export async function ensureCategories() {
  if (!(await Category.exists({}))) await Category.insertMany(defaultCategories.map((category, sortOrder) => ({ ...category, sortOrder })));
}

const router = Router();
router.get('/', async (_req, res) => {
  try {
    await ensureCategories();
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select('name icon');
    res.json({ categories });
  } catch { res.status(500).json({ message: 'Could not load furniture categories.' }); }
});

router.get('/manage', requireUser, requireAdmin, async (_req, res) => {
  try { await ensureCategories(); res.json({ categories: await Category.find().sort({ sortOrder: 1, name: 1 }) }); }
  catch { res.status(500).json({ message: 'Could not load categories.' }); }
});

router.post('/', requireUser, requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (name.length < 2 || name.length > 40) return res.status(400).json({ message: 'Category names must be 2 to 40 characters.' });
    const category = await Category.create({ name, icon: req.body.icon || '✳', sortOrder: Number(req.body.sortOrder) || 0 });
    res.status(201).json({ category });
  } catch (error) { res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'That category already exists.' : 'Could not create category.' }); }
});

router.patch('/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    const changes = {};
    if (req.body.name !== undefined) changes.name = String(req.body.name).trim();
    if (req.body.icon !== undefined) changes.icon = String(req.body.icon).slice(0, 8);
    if (req.body.active !== undefined) changes.active = Boolean(req.body.active);
    if (req.body.sortOrder !== undefined) changes.sortOrder = Number(req.body.sortOrder) || 0;
    const category = await Category.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category });
  } catch (error) { res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? 'That category already exists.' : 'Could not update category.' }); }
});

router.delete('/:id', requireUser, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    if (await Listing.exists({ category: category.name })) return res.status(409).json({ message: 'This category is used by listings. Deactivate it instead.' });
    await category.deleteOne();
    res.json({ message: 'Category deleted.' });
  } catch { res.status(500).json({ message: 'Could not delete category.' }); }
});
export default router;
