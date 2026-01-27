import { NextRequest, NextResponse } from 'next/server';
import { translationService } from '@/lib/services/translator';
interface TranslateRequest {
    articleId: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as TranslateRequest;

        if (!body.articleId) {
            return NextResponse.json(
                { error: 'articleId is required' },
                { status: 400 }
            );
        }

        const result = await translationService.translateArticle(body.articleId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            translatedText: result.translatedText
        });

    } catch (error) {
        console.error('API Translation error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
