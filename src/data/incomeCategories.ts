import { IncomeCategory } from '@/types'

export const DEFAULT_INCOME_CATEGORIES: IncomeCategory[] = [
  { id: 'income-salary', name: 'Salário', icon: 'Briefcase', color: '#10b981', isDefault: true },
  { id: 'income-freelance', name: 'Freelance', icon: 'Laptop', color: '#06b6d4', isDefault: true },
  { id: 'income-investments', name: 'Investimentos', icon: 'TrendingUp', color: '#8b5cf6', isDefault: true },
  { id: 'income-rent', name: 'Aluguel', icon: 'Home', color: '#f59e0b', isDefault: true },
  { id: 'income-sales', name: 'Vendas', icon: 'ShoppingCart', color: '#f43f5e', isDefault: true },
  { id: 'income-other', name: 'Outros', icon: 'MoreHorizontal', color: '#6b7280', isDefault: true },
]

export const INCOME_CATEGORY_COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b',
  '#ef4444', '#6b7280', '#3b82f6', '#ec4899',
  '#84cc16', '#f97316', '#14b8a6', '#a855f7',
]
