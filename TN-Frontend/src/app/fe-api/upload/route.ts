import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'equipment';

    // Get the JWT token from cookies
    const token = req.cookies.get('token')?.value;

    // Retrieve the client's FormData body
    const formData = await req.formData();

    // Map type to backend endpoint
    let backendEndpoint = '/equipment/upload';
    if (type === 'video') {
      backendEndpoint = '/homepage-content/video';
    } else if (type === 'poster') {
      backendEndpoint = '/homepage-content/poster';
    } else if (type === 'gallery') {
      backendEndpoint = '/homepage-gallery/upload';
    } else if (type === 'avatar') {
      backendEndpoint = '/auth/avatar';
    }

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Proxy the upload to NestJS backend
    const response = await fetch(`${BASE_URL}${backendEndpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || 'Lỗi từ phía máy chủ' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi tải tệp lên' },
      { status: 500 }
    );
  }
}
