import Card from '../base/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconColor,
  trend,
  description 
}: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <i 
                className={`${trend.isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
                aria-hidden="true"
              ></i>
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value}
              </span>
            </div>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${iconColor}`}>
          <i className={`${icon} text-2xl text-white`} aria-hidden="true"></i>
        </div>
      </div>
    </Card>
  );
}