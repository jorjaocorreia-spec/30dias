import {
  Utensils, Car, FileText, Heart, Gamepad2, ShoppingBag,
  BookOpen, MoreHorizontal, Dumbbell, Activity, Tv, Music,
  Coffee, Plane, Home, Smartphone, Zap, Wifi, Gift, Scissors,
  PawPrint, Pill, ShoppingCart, Briefcase, Bike, Fuel, Baby,
  TrendingUp, Laptop, Target, LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Utensils, Car, FileText, Heart, Gamepad2, ShoppingBag, BookOpen, MoreHorizontal,
  Dumbbell, Activity, Tv, Music, Coffee, Plane, Home, Smartphone,
  Zap, Wifi, Gift, Scissors, PawPrint, Pill, ShoppingCart, Briefcase,
  Bike, Fuel, Baby, TrendingUp, Laptop, Target,
}

interface CategoryIconProps extends LucideProps {
  name: string
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = iconMap[name] ?? MoreHorizontal
  return <Icon {...props} />
}
