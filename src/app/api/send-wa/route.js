import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { target, message } = await request.json();

    if (!target || !message) {
      return NextResponse.json(
        { error: 'target & message wajib diisi' },
        { status: 400 }
      );
    }

    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'FONNTE_TOKEN belum diset di Vercel' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message,
        countryCode: '62',
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}