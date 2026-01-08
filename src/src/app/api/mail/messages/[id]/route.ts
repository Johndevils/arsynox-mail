import { NextRequest, NextResponse } from 'next/server'

const MAIL_API_BASE = 'https://api.mail.tm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const response = await fetch(`${MAIL_API_BASE}/messages/${params.id}`, {
      headers: {
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch message' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Message API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const response = await fetch(`${MAIL_API_BASE}/messages/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Message PATCH API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
