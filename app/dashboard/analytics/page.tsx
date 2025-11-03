"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

interface Activity {
  id: string;
  action_type: string;
  file_id: string | null;
  description: string | null;
  created_at: string;
}

const actionIcons: Record<string, any> = {
  upload: Upload,
  download: Download,
  delete: Trash2,
  share: Share2,
  view: Eye,
};

const actionColors: Record<string, string> = {
  upload: "bg-blue-500/10 text-blue-700",
  download: "bg-green-500/10 text-green-700",
  delete: "bg-red-500/10 text-red-700",
  share: "bg-purple-500/10 text-purple-700",
  view: "bg-gray-500/10 text-gray-700",
};

export default function AnalyticsPage() {
  const { isLoaded } = useUser();
  const { toast } = useToast();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
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
        fetch("/api/analytics/activity?limit=20"),
      ]);

      if (!statsRes.ok || !activitiesRes.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const statsData = await statsRes.json();
      const activitiesData = await activitiesRes.json();

      setStats(statsData);
      setActivities(activitiesData.activities || []);
    } catch (error) {
      console.error("[v0] Analytics fetch error:", error);
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

  if (!isLoaded || isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const activityChartData = Object.entries(stats.activities).map(
    ([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill:
        actionColors[key]
          ?.split(" ")[0]
          .replace("bg-", "")
          .replace("/10", "") || "#8884d8",
    })
  );

  const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#a855f7", "#6b7280"];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border bg-card">
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

        <Card className="p-6 border-border bg-card">
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

        <Card className="p-6 border-border bg-card">
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <Card className="p-6 border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4">
            Activity Distribution
          </h3>
          <ChartContainer
            config={{
              value: {
                label: "Count",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Storage Trend */}
        <Card className="p-6 border-border bg-card">
          <h3 className="font-semibold text-foreground mb-4">
            Storage Usage Trend
          </h3>
          <ChartContainer
            config={{
              size: {
                label: "Storage (MB)",
                color: "hsl(var(--chart-1))",
              },
              files: {
                label: "File Count",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.storageTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="size"
                  stroke="var(--color-size)"
                  name="Storage (Bytes)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border bg-card">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-border">
            {activities.map((activity) => {
              const ActionIcon = actionIcons[activity.action_type] || Eye;
              return (
                <div
                  key={activity.id}
                  className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      actionColors[activity.action_type] || "bg-gray-500/10"
                    }`}
                  >
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground capitalize">
                        {activity.action_type}
                      </span>
                      {activity.description && (
                        <span className="text-sm text-muted-foreground truncate">
                          {activity.description}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No activity yet</p>
          </div>
        )}
      </Card>
    </div>
  );
}
