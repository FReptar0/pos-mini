export function margin(costPrice: number, salePrice: number): number {
  if (salePrice === 0) return 0
  return ((salePrice - costPrice) / salePrice) * 100
}

export function markup(costPrice: number, salePrice: number): number {
  if (costPrice === 0) return 0
  return ((salePrice - costPrice) / costPrice) * 100
}

export function profit(costPrice: number, salePrice: number, quantity = 1): number {
  return (salePrice - costPrice) * quantity
}

export function stockValue(costPrice: number, stock: number): number {
  return costPrice * stock
}

export function isLowStock(stock: number, minStock: number): boolean {
  return stock <= minStock
}

export function stockStatus(stock: number, minStock: number): 'ok' | 'low' | 'out' {
  if (stock === 0) return 'out'
  if (stock <= minStock) return 'low'
  return 'ok'
}
