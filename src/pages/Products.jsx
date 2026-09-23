import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [formName, setFormName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('products').select('id, name').order('name')
    setProducts(data || [])
  }

  const openAdd = () => { setFormName(''); setError(''); setModal({ mode: 'add' }) }
  const openEdit = (p) => { setFormName(p.name); setError(''); setModal({ mode: 'edit', product: p }) }
  const closeModal = () => { setModal(null); setError('') }

  const getNextId = async () => {
    const { data } = await supabase.from('products').select('id').order('id', { ascending: false }).limit(1)
    const lastNum = data?.[0] ? parseInt(data[0].id.replace(/\D/g, '')) : 0
    return `P${String(lastNum + 1).padStart(3, '0')}`
  }

  const save = async () => {
    const name = formName.trim().toUpperCase()
    if (!name) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    let err
    if (modal.mode === 'add') {
      const id = await getNextId()
      ;({ error: err } = await supabase.from('products').insert({ id, name }))
    } else {
      ;({ error: err } = await supabase.from('products').update({ name }).eq('id', modal.product.id))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    closeModal()
    load()
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?\n\nThis will also remove all client prices for this product.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">Products</h2>
          <p className="text-xs text-gray-400">{filtered.length} of {products.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm w-52 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 font-medium"
          >
            <span className="text-lg leading-none">+</span> Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-gray-400">{p.id}</td>
                <td className="px-6 py-3 font-medium text-gray-700">{p.name}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium mr-3">Edit</button>
                  <button onClick={() => remove(p)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">
              {modal.mode === 'add' ? 'Add Product' : 'Edit Product'}
            </h3>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') closeModal() }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              placeholder="Product name"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
