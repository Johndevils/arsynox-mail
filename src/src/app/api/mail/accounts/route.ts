import { NextRequest, NextResponse } from 'next/server'

const MAIL_API_BASE = 'https://api.mail.tm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${MAIL_API_BASE}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Failed to create account', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Accounts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
