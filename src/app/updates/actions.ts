'use server';

import { TaggingService } from "@/lib/services/tagging";
import { ArticlesService } from "@/lib/services/articles";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const taggingService = new TaggingService();
const articlesService = new ArticlesService();

export async function analyzeAndTagArticle(articleId: string) {
    const article = await articlesService.get(articleId);
    if (!article) throw new Error("Article not found");

    if (!article.content) throw new Error("Article has no content");

    // Run AI Analysis
    const result = await taggingService.analyzeArticle(article.title, article.content);

    // Save TitleCN
    if (result.titleCN) {
        await articlesService.updateTitleCN(articleId, result.titleCN);
    }

    // Save Tags
    if (result.keywords.length > 0) {
        await articlesService.updateTags(articleId, result.keywords);
    }

    // Auto-link people (Naive match)
    const matchedPeople = await taggingService.matchPeople(result.people);
    for (const person of matchedPeople) {
        await articlesService.linkPerson(articleId, person.id);
    }

    revalidatePath(`/updates/${articleId}`);
    return result;
}

export async function linkPersonToArticle(articleId: string, personId: string) {
    await articlesService.linkPerson(articleId, personId);
    revalidatePath(`/updates/${articleId}`);
}

export async function unlinkPersonFromArticle(articleId: string, personId: string) {
    await articlesService.unlinkPerson(articleId, personId);
    revalidatePath(`/updates/${articleId}`);
}

export async function updateArticleTags(articleId: string, tags: string[]) {
    await articlesService.updateTags(articleId, tags);
    revalidatePath(`/updates/${articleId}`);
}

export async function translateContent(articleId: string) {
    const { translationService } = await import("@/lib/services/translator");
    await translationService.translateArticle(articleId);
    revalidatePath(`/updates/${articleId}`);
}
