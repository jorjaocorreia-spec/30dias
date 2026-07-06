export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isDefault?: boolean
}

export type PaymentMethod = 'credit_card' | 'pix' | 'ted' | 'cash'

export interface ExpenseParticipant {
  id: string
  name: string
  amount: number
  paid: boolean
  paidAt?: string  // YYYY-MM-DD
  shares?: number  // partes que essa pessoa representa (ex: casal = 2); padrão 1
}

export interface Establishment {
  id: string
  name: string
  categoryId: string
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  description: string
  date: string // ISO date string YYYY-MM-DD
  time?: string // HH:mm (hora local do lançamento)
  notes?: string
  weekKey: string // YYYY-WNN format
  paymentMethod: PaymentMethod
  establishmentId?: string
  creditCardId?: string         // qual cartão gerou esta despesa (obrigatório em novas despesas com paymentMethod === 'credit_card')
  fixedExpenseId?: string       // links to FixedExpense template
  fixedExpenseMonthId?: string  // links to the specific FixedExpenseMonth that generated this entry
  sharedWith?: ExpenseParticipant[]  // defined when expense is split among multiple people
  userShares?: number                // partes do próprio usuário (ex: casal = 2); padrão 1
  installmentGroupId?: string        // nanoid compartilhado entre todas as parcelas do mesmo parcelamento
  installmentCurrent?: number        // número da parcela (1-based)
  installmentTotal?: number          // total de parcelas
}

export interface FixedExpense {
  id: string
  description: string
  suggestedAmount: number  // default value pre-filled when registering each month
  categoryId: string
  establishmentId?: string
  paymentMethod: PaymentMethod
  creditCardId?: string    // obrigatório em novos templates com paymentMethod === 'credit_card'
  notes?: string
  isActive: boolean
  createdAt: string        // YYYY-MM-DD
  dueDateDay?: number      // dia do mês do vencimento (1–31)
  reminderEnabled?: boolean
}

export interface FixedExpenseMonth {
  id: string
  fixedExpenseId: string
  month: string   // YYYY-MM
  amount: number  // actual amount confirmed for this month
  date?: string   // YYYY-MM-DD — data real do lançamento no mês
}

export interface CreditCard {
  id: string
  name: string              // ex: "Nubank", "Inter"
  closingDay: number         // 1–31, dia de fechamento do ciclo
  dueDay: number             // 1–31, dia de vencimento da fatura
  color: string
  isActive: boolean
  createdAt: string          // YYYY-MM-DD
}

export interface CreditCardInvoice {
  id: string
  creditCardId: string
  month: string              // YYYY-MM — mês de VENCIMENTO da fatura
  paid: boolean
  paidAt?: string            // YYYY-MM-DD
}

export interface IncomeCategory {
  id: string
  name: string
  icon: string
  color: string
  isDefault?: boolean
}

export interface IncomeSource {
  id: string
  description: string
  expectedAmount: number
  categoryId: string
  paymentMethod: PaymentMethod
  notes?: string
  isActive: boolean
  createdAt: string  // YYYY-MM-DD
}

export interface IncomeEntry {
  id: string
  incomeSourceId?: string   // undefined = receita avulsa
  categoryId: string
  description: string
  amount: number
  month: string             // YYYY-MM
  receivedDate?: string     // YYYY-MM-DD opcional
  paymentMethod: PaymentMethod
  notes?: string
}

export interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  deadline: string           // YYYY-MM
  icon: string
  color: string
  notes?: string
  weeklyAmount?: number      // override manual; senão auto-calculado
  deductFromBudget: boolean
  isActive: boolean
  createdAt: string          // YYYY-MM-DD
  completedAt?: string       // YYYY-MM-DD
}

export interface GoalContribution {
  id: string
  goalId: string
  month: string   // YYYY-MM
  amount: number
}

export interface WeekSummary {
  weekKey: string
  totalAmount: number
  budget: number
  expenses: Expense[]
  byCategory: Record<string, number>
  byDay: Record<string, number>
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  monthlyBudget: number
  budgetMode: 'fixed' | 'per_category'
  categoryBudgets: Record<string, number>
  currency: string
  whatsappNumber?: string  // número pessoal do usuário para integração WhatsApp
  availableMode?: 'budget' | 'income'
}

export interface MonthlyBudget {
  id: string
  month: string  // YYYY-MM
  monthlyBudget: number
  categoryBudgets: Record<string, number>
}

export interface UserAchievement {
  id: string
  achievementId: string
  unlockedAt: string  // YYYY-MM-DD
}
