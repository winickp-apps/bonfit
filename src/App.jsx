import { useState } from 'react'
import PriceLookup from './pages/PriceLookup'
import Clients from './pages/Clients'
import Products from './pages/Products'

const TABS = [
  { id: 'prices', label: 'Price Lookup' },
  { id: 'clients', label: 'Clients' },
  { id: 'products', label: 'Products' },
]

export default function App() {
  const [tab, setTab] = useState('prices')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-blue-900 font-black text-sm">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide leading-none">BONFIT</h1>
            <p className="text-blue-300 text-xs tracking-widest uppercase">Price Manager</p>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'prices' && <PriceLookup />}
        {tab === 'clients' && <Clients />}
        {tab === 'products' && <Products />}
      </main>
    </div>
  )
}
