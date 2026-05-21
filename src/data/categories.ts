import { Category } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentação', icon: 'Utensils', color: '#10b981', isDefault: true },
  { id: 'transport', name: 'Transporte', icon: 'Car', color: '#3b82f6', isDefault: true },
  { id: 'bills', name: 'Contas', icon: 'FileText', color: '#f59e0b', isDefault: true },
  { id: 'health', name: 'Saúde', icon: 'Heart', color: '#ef4444', isDefault: true },
  { id: 'leisure', name: 'Lazer', icon: 'Gamepad2', color: '#8b5cf6', isDefault: true },
  { id: 'shopping', name: 'Compras', icon: 'ShoppingBag', color: '#ec4899', isDefault: true },
  { id: 'education', name: 'Educação', icon: 'BookOpen', color: '#06b6d4', isDefault: true },
  { id: 'other', name: 'Outros', icon: 'MoreHorizontal', color: '#6b7280', isDefault: true },
]

export const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280',
  '#84cc16', '#f97316', '#14b8a6', '#a855f7',
]
