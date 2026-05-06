import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export default function StatsCard({ icon: Icon, label, value, trend, color = 'emerald' }) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] || TREND_ICONS.neutral : null;

  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={20} />
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {trend && (
          <div className={`stat-trend ${trend.direction}`}>
            {TrendIcon && <TrendIcon size={12} />}
            {trend.text}
          </div>
        )}
      </div>
    </div>
  );
}
