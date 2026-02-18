import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ name: null, category: null })

  // Primary: Open Food Facts v2
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,categories_tags`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const product = data?.product
      if (product?.product_name) {
        const rawCategory = product.categories_tags?.[0] ?? null
        const category = rawCategory ? rawCategory.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ') : null
        return NextResponse.json({ name: product.product_name, category })
      }
    }
  } catch {
    // timeout or network error — fall through
  }

  // Fallback: UPC Item DB
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const item = data?.items?.[0]
      if (item?.title) {
        return NextResponse.json({ name: item.title, category: item.category ?? null })
      }
    }
  } catch {
    // timeout or network error
  }

  return NextResponse.json({ name: null, category: null })
}
