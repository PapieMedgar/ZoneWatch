import { Card, CardContent } from "@/components/ui/card";
import { Shield, MapPin, Users, Clock } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "stable";
  variant?: "safe" | "warning" | "primary" | "accent";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
}: StatCardProps) {
  const variantStyles = {
    safe: "from-safe-zone to-safe-zone/80",
    warning: "from-warning-zone to-accent",
    primary: "from-primary to-primary-glow",
    accent: "from-accent to-accent/80",
  };

  return (
    <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${variantStyles[variant]} shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Kids Safe"
        value="3"
        subtitle="All in designated zones"
        icon={Shield}
        variant="safe"
      />
      <StatCard
        title="Active Zones"
        value="8"
        subtitle="2 home, 3 school, 3 custom"
        icon={MapPin}
        variant="primary"
      />
      <StatCard
        title="Total Children"
        value="3"
        subtitle="All profiles active"
        icon={Users}
        variant="accent"
      />
      <StatCard
        title="Last Check"
        value="2m"
        subtitle="All locations updated"
        icon={Clock}
        variant="primary"
      />
    </div>
  );
}
