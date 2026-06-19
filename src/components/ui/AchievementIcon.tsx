import {
  PlusCircle, TrendingUp, Tag, Store, Smartphone, Flame, Receipt,
  CheckCircle2, Target, Trophy, Gem, CalendarCheck, ShieldCheck,
  TrendingDown, PieChart, DollarSign, Users, CreditCard, Award, LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  PlusCircle, TrendingUp, Tag, Store, Smartphone, Flame, Receipt,
  CheckCircle2, Target, Trophy, Gem, CalendarCheck, ShieldCheck,
  TrendingDown, PieChart, DollarSign, Users, CreditCard,
}

interface AchievementIconProps extends LucideProps {
  name: string
}

export function AchievementIcon({ name, ...props }: AchievementIconProps) {
  const Icon = iconMap[name] ?? Award
  return <Icon {...props} />
}
