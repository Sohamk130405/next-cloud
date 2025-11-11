"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Upload,
  Download,
  Trash2,
  Share2,
  Eye,
  HardDrive,
  File,
  TrendingUp,
  Activity,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatsData {
  storage: {
    totalFiles: number;
    totalSize: number;
    filesShared: number;
  };
  activities: Record<string, number>;
  storageTrend: Array<{
    date: string;
    size: number;
    files: number;
  }>;
}

interface ActivityLog {
  id: string;
  actionType: string;
  fileId: string | null;
  description: string | null;
  createdAt: string;
}

const actionIcons: Record<string, any> = {
  upload: Upload,
  download: Download,
  delete: Trash2,
  share: Share2,
  view: Eye,
  login: Eye,
  logout: Eye,
  password_change: Lock,
  account_delete: Trash2,
};

const actionColors: Record<string, string> = {
  upload: "bg-blue-500/10 text-blue-700",
  download: "bg-green-500/10 text-green-700",
  delete: "bg-red-500/10 text-red-700",
  share: "bg-purple-500/10 text-purple-700",
  view: "bg-gray-500/10 text-gray-700",
  login: "bg-cyan-500/10 text-cyan-700",
  logout: "bg-amber-500/10 text-amber-700",
  password_change: "bg-indigo-500/10 text-indigo-700",
  account_delete: "bg-rose-500/10 text-rose-700",
};

const getColorForAction = (action: string): string => {
  const colorMap: Record<string, string> = {
    upload: "#3b82f6",
    download: "#10b981",
    delete: "#ef4444",
    share: "#a855f7",
    view: "#6b7280",
    login: "#06b6d4",
    logout: "#f59e0b",
    password_change: "#6366f1",
    account_delete: "#ec4899",
  };
  return colorMap[action] || "#8884d8";
};

export default function AnalyticsPage() {
  const { isLoaded } = useUser();
  const { toast } = useToast();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      fetchAnalytics();
    }
  }, [isLoaded]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      const [statsRes, activitiesRes] = await Promise.all([
        fetch("/api/analytics/stats"),
        fetch("/api/analytics/activity?limit=30&days=30"),
      ]);

      if (!statsRes.ok) {
        throw new Error("Failed to fetch stats");
      }

      const statsData = await statsRes.json();
      const activitiesData = activitiesRes.ok
        ? await activitiesRes.json()
        : { activities: [] };

      setStats(statsData);
      setActivities(activitiesData.activities || []);
    } catch (error) {
      console.error("[Analytics] Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Prepare activity distribution data
  const activityChartData = Object.entries(stats.activities)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number,
      fill: getColorForAction(key),
    }))
    .filter((item) => item.value > 0);

  const mostActiveType = Object.entries(stats.activities).reduce(
    (prev, current) =>
      (current[1] as number) > (prev[1] as number) ? current : prev,
    ["none", 0]
  )[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Analytics & Stats
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your storage usage and activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.storage.totalFiles}
              </p>
            </div>
            <File className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Storage</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatFileSize(stats.storage.totalSize)}
              </p>
            </div>
            <HardDrive className="w-10 h-10 text-accent/20" />
          </div>
        </Card>

        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Files Shared</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.storage.filesShared}
              </p>
            </div>
            <Share2 className="w-10 h-10 text-primary/20" />
          </div>
        </Card>

        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {activities.length}
              </p>
            </div>
            <Activity className="w-10 h-10 text-primary/20" />
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Activity Type - Bar Chart */}
        <Card className="p-6 border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Activity Breakdown
          </h3>
          {activityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  cursor={{ fill: "var(--primary)/10" }}
                  formatter={(value) => [`${value} activities`, "Count"]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No activity data available
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border bg-card">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Last 30 activities
          </p>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const ActionIcon = actionIcons[activity.actionType] || Activity;
              return (
                <div
                  key={activity.id}
                  className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      actionColors[activity.actionType] ||
                      "bg-gray-500/10 text-gray-700"
                    }`}
                  >
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground capitalize">
                        {activity.actionType.replace(/_/g, " ")}
                      </span>
                      {activity.description && (
                        <span className="text-sm text-muted-foreground truncate">
                          {activity.description}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
          </div>
        )}
      </Card>
    </div>
  );
}
