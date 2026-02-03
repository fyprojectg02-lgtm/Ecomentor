import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: "Student ID is required" },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const submissions = await db
            .collection('action_submissions')
            .find({ studentId })
            .sort({ submittedAt: -1 })
            .toArray();

        // Convert ObjectId to string for JSON serialization
        const serializedSubmissions = submissions.map(sub => ({
            ...sub,
            _id: sub._id.toString()
        }));

        return NextResponse.json({
            success: true,
            submissions: serializedSubmissions
        });

    } catch (error) {
        console.error('Fetch student submissions error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
