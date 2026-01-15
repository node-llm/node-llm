import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import './index.css'
import { SearchForm } from './components/SearchForm'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { Dashboard } from './components/Dashboard'

function App() {
  const [brandName, setBrandName] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!brandName) return
    setLoading(true)
    setError(null)
    setReport(null)
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze brand');
      }
      
      setReport(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <SearchForm 
        brandName={brandName} 
        setBrandName={setBrandName} 
        loading={loading} 
        onAnalyze={handleAnalyze} 
      />

      {error && (
        <div className="error-panel">
          <AlertTriangle size={20} />
          <span>Analysis failed: {error}</span>
        </div>
      )}

      <AnimatePresence>
        {loading && <LoadingSkeleton />}
        {report && !loading && <Dashboard report={report} />}
      </AnimatePresence>

      <footer className="footer">
        Built with NodeLLM • Snapshot-based diagnostic • Not for financial evaluation
      </footer>
    </div>
  )
}

export default App
