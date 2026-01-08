import { NextRequest, NextResponse } from 'next/server'

const MAIL_API_BASE = 'https://api.mail.tm'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'

    const response = await fetch(`${MAIL_API_BASE}/messages?page=${page}`, {
      headers: {
        'Authorization': authHeader,
      },
    })

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
