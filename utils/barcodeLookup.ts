type BarcodeInfo = {
  name: string | null
  category: string | null
}

export async function barcodeLookup(barcode: string): Promise<BarcodeInfo> {
  // Primary: Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const product = data?.product
      if (product?.product_name) {
        const rawCategory = product.categories_tags?.[0] ?? null
        const category = rawCategory
          ? rawCategory.replace(/^[a-z]{2}:/, '')
          : null
        return { name: product.product_name, category }
      }
    }
  } catch {
    // timeout or network error — fall through to fallback
  }

  // Fallback: UPC Item DB
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const item = data?.items?.[0]
      if (item?.title) {
        return { name: item.title, category: item.category ?? null }
      }
    }
  } catch {
    // timeout or network error
  }

  return { name: null, category: null }
}
