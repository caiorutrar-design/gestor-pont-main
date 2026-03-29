import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("card-institutional overflow-hidden", className)}>
      <div className="hidden md:block overflow-x-auto">{children}</div>
    </div>
  );
}

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardList({ children, className }: MobileCardListProps) {
  return (
    <div className={cn("md:hidden space-y-3", className)}>{children}</div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <Card className={cn("card-institutional", className)}>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-center py-1.5", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function MobileCardHeader({
  title,
  subtitle,
  badge,
  className,
}: MobileCardHeaderProps) {
  return (
    <div className={cn("flex justify-between items-start pb-2 border-b mb-2", className)}>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {badge && <div className="ml-2 shrink-0">{badge}</div>}
    </div>
  );
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn("flex gap-2 pt-3 mt-2 border-t", className)}>
      {children}
    </div>
  );
}
