import { db } from "@/lib/db";
import { sources, articles, fetchRuns } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, FileText, CheckCircle2 } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight italic">System Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Monitor news collection and system health.
          </p>
        </div>
        <Badge variant={stats.dbStatus === "Connected" ? "default" : "destructive"} className="px-3 py-1">
          <div className="flex items-center gap-1.5 font-medium">
            <div className={`h-2 w-2 rounded-full ${stats.dbStatus === "Connected" ? "bg-green-500" : "bg-red-500"}`} />
            DB: {stats.dbStatus}
          </div>
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-pink shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Total Sources
            </CardTitle>
            <Database className="h-4 w-4 text-editorial-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sources}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Configured JP/EN outlets</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-editorial-pink shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Total Articles
            </CardTitle>
            <FileText className="h-4 w-4 text-editorial-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.articles}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Processed entries in DB</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Last Fetch Run
            </CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.lastRun?.status === "completed" ? "Successfully Done" : stats.lastRun?.status || "No runs yet"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {stats.lastRun?.completedAt ? new Date(stats.lastRun.completedAt).toLocaleString() : "---"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Brief Ready
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Waiting</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Generate after fetching</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-muted/30 p-8 text-center border-dashed">
        <h3 className="text-lg font-serif italic text-muted-foreground">
          Ready to begin collection. Head to "Update" to trigger your first scrape.
        </h3>
      </div>
    </div>
  );
}
