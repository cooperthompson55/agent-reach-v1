import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const timestamp = new Date().toLocaleString();
    const userAgent = request.headers.get('user-agent') || 'Unknown device';
    
    // Send email notification
    const data = await resend.emails.send({
      from: 'Cooper Thompson <cooper@rephotos.ca>',
      to: ['cooperthompson55955@gmail.com'],
      subject: 'New Sign In to Agent Reach',
      html: `
        <h2>New Sign In Detected</h2>
        <p>A new sign-in was detected in your Agent Reach application.</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <p><strong>Device:</strong> ${userAgent}</p>
      `,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to send auth notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}