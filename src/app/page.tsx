import { db } from "@/lib/db";
import { sources, articles, fetchRuns } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, FileText, CheckCircle2 } from "lucide-react";

import { MergeReview } from "@/components/events/merge-review";

async function getStats() {
  try {
    const sourceCount = await db.select({ count: sql`count(*)` }).from(sources);
    const articleCount = await db.select({ count: sql`count(*)` }).from(articles);
    const lastRun = await db.select().from(fetchRuns).orderBy(sql`${fetchRuns.startedAt} desc`).limit(1);

    return {
      sources: Number(sourceCount[0].count),
      articles: Number(articleCount[0].count),
      lastRun: lastRun[0] || null,
      dbStatus: "Connected",
    };
  } catch (error) {
    console.error("DB Stats Error:", error);
    return {
      sources: 0,
      articles: 0,
      lastRun: null,
      dbStatus: "Disconnected",
    };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">系統儀表板</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            監控新聞蒐集系統與服務健康狀態。
          </p>
        </div>
        <Badge variant={stats.dbStatus === "Connected" ? "default" : "destructive"} className="px-3 py-1 self-start md:self-center">
          <div className="flex items-center gap-1.5 font-medium">
            <div className={`h-2 w-2 rounded-full ${stats.dbStatus === "Connected" ? "bg-green-500" : "bg-red-500"}`} />
            資料庫: {stats.dbStatus === "Connected" ? "已連線" : "斷線"}
          </div>
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-pink shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              總情報來源
            </CardTitle>
            <Database className="h-4 w-4 text-editorial-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sources}</div>
            <p className="text-xs text-muted-foreground mt-1 text-nowrap">已配置的日文/英文媒體</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-editorial-pink shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已收錄文章
            </CardTitle>
            <FileText className="h-4 w-4 text-editorial-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.articles}</div>
            <p className="text-xs text-muted-foreground mt-1 text-nowrap">資料庫中的處理條目</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              上次抓取執行
            </CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.lastRun?.status === "completed" ? "執行成功" : stats.lastRun?.status || "尚未執行"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lastRun?.completedAt ? new Date(stats.lastRun.completedAt).toLocaleString('zh-TW') : "---"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              自動簡報生成
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">待機中</div>
            <p className="text-xs text-muted-foreground mt-1">抓取完成後自動觸發</p>
          </CardContent>
        </Card>
      </div>

      <MergeReview />


    </div>
  );
}
