import { NextRequest, NextResponse } from 'next/server';
import { blacklistService } from '@/lib/services/blacklist';

export async function GET() {
    try {
        const rules = await blacklistService.getAllRules();
        return NextResponse.json(rules);
    } catch (error: any) {
        console.error('Error fetching blacklist rules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, value, description } = body;

        if (!type || !value) {
            return NextResponse.json({ error: 'Type and value are required' }, { status: 400 });
        }

        if (!['source', 'title', 'url'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type. Must be source, title, or url' }, { status: 400 });
        }

        const rule = await blacklistService.addRule(type, value, description);
        return NextResponse.json(rule, { status: 201 });
    } catch (error: any) {
        console.error('Error adding blacklist rule:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
        }

        await blacklistService.removeRule(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting blacklist rule:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
