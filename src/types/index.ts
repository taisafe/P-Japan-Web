import { sources, articles, fetchRuns } from "@/lib/db/schema";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Source = InferSelectModel<typeof sources>;
export type NewSource = InferInsertModel<typeof sources>;

export type Article = InferSelectModel<typeof articles>;
export type NewArticle = InferInsertModel<typeof articles>;

export type FetchRun = InferSelectModel<typeof fetchRuns>;
