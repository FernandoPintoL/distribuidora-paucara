import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'highlighted' | 'info' | 'warning';

interface ProformaCardProps {
  variant?: CardVariant;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: '',
  highlighted: 'border-l-4 border-l-[var(--brand-primary)] bg-[var(--surface-highlighted)]',
  info: 'border-l-4 border-l-[var(--brand-accent)] bg-[var(--surface-info)]',
  warning: 'border-l-4 border-l-[var(--status-warning)] bg-[var(--surface-warning)]',
};

export function ProformaCard({
  variant = 'default',
  title,
  icon,
  children,
  className
}: ProformaCardProps) {
  return (
    <Card className={cn(variantStyles[variant], className)}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={!title ? 'pt-6' : ''}>
        {children}
      </CardContent>
    </Card>
  );
}
