import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function SearchSelect({ label, options, value, onChange, placeholder }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const selectedName = options.find(o => o.id === value)?.name || ''

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50)

  const handleSelect = (id) => {
    onChange(id)
    setSearch('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div
        className={`flex items-center border rounded-lg bg-white transition-all ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input
          className="flex-1 px-3 py-3 text-base bg-transparent outline-none"
          placeholder={value ? selectedName : placeholder}
          value={open ? search : (value ? selectedName : '')}
          onFocus={() => { setOpen(true); setSearch('') }}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
        />
        {value && (
          <button onClick={handleClear} className="px-2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="px-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {open && (
        <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-64 overflow-y-auto" style={{WebkitOverflowScrolling:'touch'}}>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 italic">No results</li>
          ) : filtered.map(o => (
            <li
              key={o.id}
              onPointerDown={() => handleSelect(o.id)}
              className={`px-3 py-3 text-sm cursor-pointer hover:bg-blue-50 active:bg-blue-100 ${o.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              {o.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function PriceLookup() {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [clientId, setClientId] = useState('')
  const [productId, setProductId] = useState('')
  const [priceRecord, setPriceRecord] = useState(null)
  const [clientPrices, setClientPrices] = useState([])
  const [editing, setEditing] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [productFilter, setProductFilter] = useState('')

  useEffect(() => {
    supabase.from('customers').select('id, name').order('name').then(({ data }) => setClients(data || []))
    supabase.from('products').select('id, name').order('name').then(({ data }) => setProducts(data || []))
  }, [])

  useEffect(() => {
    if (!clientId) { setClientPrices([]); return }
    supabase
      .from('client_prices')
      .select('id, price, product_id, products(name)')
      .eq('customer_id', clientId)
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => a.products.name.localeCompare(b.products.name))
        setClientPrices(sorted)
      })
  }, [clientId])

  useEffect(() => {
    if (!clientId || !productId) { setPriceRecord(null); return }
    supabase
      .from('client_prices')
      .select('id, price')
      .eq('customer_id', clientId)
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data }) => setPriceRecord(data || null))
  }, [clientId, productId])

  const clientName = clients.find(c => c.id === clientId)?.name
  const productName = products.find(p => p.id === productId)?.name

  const handleSave = async () => {
    const val = parseFloat(newPrice)
    if (isNaN(val) || val < 0) return
    setSaving(true)
    if (priceRecord) {
      await supabase.from('client_prices')
        .update({ price: val, updated_at: new Date().toISOString() })
        .eq('id', priceRecord.id)
    } else {
      await supabase.from('client_prices')
        .insert({ customer_id: clientId, product_id: productId, price: val })
    }
    setSaving(false)
    setEditing(false)
    setNewPrice('')
    const { data } = await supabase.from('client_prices').select('id, price').eq('customer_id', clientId).eq('product_id', productId).maybeSingle()
    setPriceRecord(data || null)
    refreshClientPrices()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this price entry?')) return
    await supabase.from('client_prices').delete().eq('id', id)
    if (priceRecord?.id === id) setPriceRecord(null)
    refreshClientPrices()
  }

  const refreshClientPrices = async () => {
    const { data } = await supabase.from('client_prices').select('id, price, product_id, products(name)').eq('customer_id', clientId)
    const sorted = (data || []).sort((a, b) => a.products.name.localeCompare(b.products.name))
    setClientPrices(sorted)
  }

  const filteredClientPrices = productFilter
    ? clientPrices.filter(r => r.products.name.toLowerCase().includes(productFilter.toLowerCase()))
    : clientPrices

  return (
    <div className="space-y-5">
      {/* Lookup card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4">
          <h2 className="text-white font-semibold text-lg">Price Lookup</h2>
          <p className="text-blue-200 text-sm">Select a client and product to find their agreed price</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchSelect
              label="Client"
              options={clients}
              value={clientId}
              onChange={setClientId}
              placeholder="Search client name..."
            />
            <SearchSelect
              label="Product"
              options={products}
              value={productId}
              onChange={setProductId}
              placeholder="Search product name..."
            />
          </div>

          {clientId && productId && (
            <div className="mt-5 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Client</p>
                  <p className="font-semibold text-gray-800 truncate">{clientName}</p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1">Product</p>
                  <p className="font-semibold text-gray-800 truncate">{productName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Price</p>
                  {editing ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-gray-600 font-medium">£</span>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        className="border rounded-lg px-3 py-1.5 text-sm w-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setNewPrice('') } }}
                      />
                      <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
                        {saving ? '...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditing(false); setNewPrice('') }} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 justify-end">
                      <span className={`text-3xl font-bold ${priceRecord ? 'text-blue-700' : 'text-gray-300'}`}>
                        {priceRecord ? `£${Number(priceRecord.price).toFixed(4)}` : '—'}
                      </span>
                      <button
                        onClick={() => { setEditing(true); setNewPrice(priceRecord ? priceRecord.price : '') }}
                        className={`px-4 py-2 text-sm rounded-lg font-medium ${priceRecord ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      >
                        {priceRecord ? 'Edit' : 'Set Price'}
                      </button>
                    </div>
                  )}
                  {!priceRecord && !editing && (
                    <p className="text-xs text-gray-400 mt-1">No price set for this combination</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!clientId && !productId && (
            <div className="mt-5 flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-600">Select a client and product above to look up their agreed price.</p>
            </div>
          )}
        </div>
      </div>

      {/* Client price list */}
      {clientId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-800">
                All prices for <span className="text-blue-700">{clientName}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{clientPrices.length} price{clientPrices.length !== 1 ? 's' : ''} on record</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter products..."
                value={productFilter}
                onChange={e => setProductFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-44 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          {clientPrices.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No prices set for this client yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientPrices.map(row => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-50 hover:bg-blue-50 transition-colors ${row.product_id === productId ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-3 font-medium text-gray-700">{row.products.name}</td>
                      <td className="px-6 py-3 text-right font-bold text-blue-700">£{Number(row.price).toFixed(4)}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setProductId(row.product_id)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium mr-3"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-red-400 hover:text-red-600 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
