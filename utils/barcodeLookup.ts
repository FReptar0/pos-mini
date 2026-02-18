type BarcodeInfo = {
  name: string | null
  category: string | null
}

export async function barcodeLookup(barcode: string): Promise<BarcodeInfo> {
  try {
    const res = await fetch(`/api/barcode?code=${encodeURIComponent(barcode)}`)
    if (res.ok) return res.json()
  } catch {
    // network error
  }
  return { name: null, category: null }
}
