import { NextResponse } from 'next/server';
import { exportAllData } from '@/lib/services/backup';

export async function GET() {
    try {
        const backupData = await exportAllData();
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `japan-politics-backup-${dateStr}.json`;

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Backup export failed:', error);
        return NextResponse.json(
            { error: '備份導出失敗' },
            { status: 500 }
        );
    }
}
