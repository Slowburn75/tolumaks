"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { SalesChart } from "@/components/admin/SalesChart";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import { adminApi, unwrapData } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { DashboardStats, Order } from "@/types";
import Link from "next/link";

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return Math.round(((current - previous) / previous) * 100);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<{ revenue?: number; orders?: number; customers?: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then((res: unknown) => {
        const payload = unwrapData<{
          stats?: Record<string, unknown>;
          recentOrders?: Order[];
          ordersByStatus?: Array<{ status: string; count: number }>;
        }>(res);

        const data = (payload?.stats || payload) as Record<string, unknown>;
        const currentRevenue = Number(data.currentMonthRevenue ?? 0);
        const lastRevenue = Number(data.lastMonthRevenue ?? 0);
        const currentOrders = Number(data.currentMonthOrders ?? 0);
        const lastOrders = Number(data.lastMonthOrders ?? 0);
        const currentUsers = Number(data.currentMonthUsers ?? 0);
        const lastUsers = Number(data.lastMonthUsers ?? 0);

        setTrends({
          revenue: pctChange(currentRevenue, lastRevenue),
          orders: pctChange(currentOrders, lastOrders),
          customers: pctChange(currentUsers, lastUsers),
        });

        setStats({
          totalOrders: Number(data.totalOrders || 0),
          totalRevenue: Number(data.totalRevenue || 0),
          totalCustomers: Number(data.totalUsers || data.totalCustomers || 0),
          totalProducts: Number(data.totalProducts || 0),
          ordersByStatus: (payload.ordersByStatus as DashboardStats["ordersByStatus"]) || [],
          revenueByMonth: (data.revenueByMonth as DashboardStats["revenueByMonth"]) || [],
          recentOrders: payload.recentOrders || [],
          topProducts: (data.topProducts as DashboardStats["topProducts"]) || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {loading ? "Loading stats..." : "Welcome to your admin dashboard"}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<DollarSign className="h-6 w-6" />}
            label="Total Revenue"
            value={stats ? formatPrice(stats.totalRevenue) : "₦0"}
            trend={trends.revenue}
            trendLabel="vs last month"
          />
          <StatsCard
            icon={<ShoppingBag className="h-6 w-6" />}
            label="Total Orders"
            value={stats?.totalOrders || 0}
            trend={trends.orders}
            trendLabel="vs last month"
          />
          <StatsCard
            icon={<Users className="h-6 w-6" />}
            label="Customers"
            value={stats?.totalCustomers || 0}
            trend={trends.customers}
            trendLabel="vs last month"
          />
          <StatsCard
            icon={<Package className="h-6 w-6" />}
            label="Products"
            value={stats?.totalProducts || 0}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SalesChart
              data={
                stats?.revenueByMonth?.map((r) => ({
                  date: r.month,
                  revenue: r.revenue,
                  orders: 0,
                })) || []
              }
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentOrders?.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">#{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
                {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
