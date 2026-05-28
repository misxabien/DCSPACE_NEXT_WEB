import { NextResponse } from 'next/server';

export function withCors(response: NextResponse, methods = 'POST, OPTIONS') {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', methods);
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export function optionsResponse(methods = 'POST, OPTIONS') {
  return withCors(new NextResponse(null, { status: 204 }), methods);
}
