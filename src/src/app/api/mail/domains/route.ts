import { NextRequest, NextResponse } from 'next/server'

const MAIL_API_BASE = 'https://api.mail.tm'

export async function GET() {
  try {
    const response = await fetch(`${MAIL_API_BASE}/domains`)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Domains API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
