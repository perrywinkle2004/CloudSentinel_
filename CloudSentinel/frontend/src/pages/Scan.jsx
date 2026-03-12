import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, Play, ChevronRight, FileText, X, Loader2, AlertCircle } from 'lucide-react'
import { scanUpload, scanSimulate, getScanOptions, scanConfiguration } from '../api'

const TABS = ['upload', 'paste', 'simulate']

export default function Scan() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('simulate')
  const [file, setFile] = useState(null)
  const [uploadedConfig, setUploadedConfig] = useState(null)
  const [text, setText] = useState('')
  const [options, setOptions] = useState(null)
  const [provider, setProvider] = useState('')
  const [service, setService] = useState('')
  const [scenario, setScenario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getScanOptions().then(r => {
      setOptions(r.data.providers)
      const firstProv = Object.keys(r.data.providers)[0]
      setProvider(firstProv)
      const firstSvc = Object.keys(r.data.providers[firstProv].services)[0]
      setService(firstSvc)
      setScenario(r.data.providers[firstProv].services[firstSvc].scenarios[0].value)
    }).catch(() => setError('Could not load scan options from API. Is the backend running?'))
  }, [])

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      const selectedFile = accepted[0];
      setFile(selectedFile);
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          setUploadedConfig(parsed);
        } catch {
          alert("Invalid JSON configuration file.");
          setUploadedConfig(null);
        }
      };
      reader.readAsText(selectedFile);
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/json': ['.json'], 'text/yaml': ['.yaml', '.yml'], 'text/plain': ['.txt'] },
    multiple: false,
  })

  const handleProviderChange = (p) => {
    setProvider(p)
    const firstSvc = Object.keys(options[p].services)[0]
    setService(firstSvc)
    setScenario(options[p].services[firstSvc].scenarios[0].value)
  }

  const handleServiceChange = (s) => {
    setService(s)
    setScenario(options[provider].services[s].scenarios[0].value)
  }

  const handleRunScan = async () => {
    setError('');
    setLoading(true);
    try {
      let config = null;

      if (tab === 'upload') {
        config = uploadedConfig;
      }

      if (tab === 'paste') {
        try {
          config = JSON.parse(text);
        } catch (e) {
          setError('Invalid JSON configuration');
          return;
        }
      }

      if (tab === 'simulate') {
        config = { provider, service, scenario };
      }

      if (!config) {
        setError("Please provide a configuration to scan.");
        return;
      }

      const result = await scanConfiguration(config);

      navigate('/results', { state: { result: result.data } });

    } catch (error) {
      console.error("Scan failed:", error);
      setError(error?.response?.data?.detail || "Scanning failed. Please check configuration format.");
    } finally {
      setLoading(false);
    }
  };

  const services = options && provider ? options[provider]?.services : {}
  const scenarios = options && provider && service ? options[provider]?.services[service]?.scenarios || [] : []

  return (
    <div className="min-h-screen pt-8 px-6 pb-12">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-white tracking-wide">
            Scan Configuration
          </h1>
          <p className="text-gray-400 mt-2">
            Upload a cloud config file or simulate a scenario to detect misconfigurations.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize ${tab === t
                ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              style={tab === t ? { background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' } : {}}>
              {t === 'paste' ? 'Paste Text' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="rounded-xl p-6 animate-fade-in" style={{ background: '#0a1628', border: '1px solid #1a2d4a' }}>
          {tab === 'upload' && (
            <div>
              <div {...getRootProps()} className="cursor-pointer rounded-xl p-10 text-center transition-all"
                style={{
                  border: `2px dashed ${isDragActive ? '#0ea5e9' : '#1a2d4a'}`,
                  background: isDragActive ? 'rgba(14,165,233,0.05)' : 'transparent'
                }}>
                <input {...getInputProps()} />
                <Upload size={36} className="mx-auto mb-3" style={{ color: isDragActive ? '#0ea5e9' : '#475569' }} />
                <p className="text-slate-300 font-medium">
                  {isDragActive ? 'Drop it here…' : 'Drag & drop your config file'}
                </p>
                <p className="text-sm text-slate-500 mt-1">or click to browse — JSON, YAML, TXT</p>
              </div>
              {file && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)' }}>
                  <FileText size={16} style={{ color: '#0ea5e9' }} />
                  <span className="text-sm text-slate-200 flex-1 truncate">{file.name}</span>
                  <button onClick={() => setFile(null)}><X size={14} className="text-slate-400" /></button>
                </div>
              )}
            </div>
          )}

          {tab === 'paste' && (
            <div>
              <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">
                Paste JSON or YAML Configuration
              </label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={14}
                className="w-full font-mono text-xs text-green-400 rounded-lg p-4 outline-none resize-none"
                style={{ background: '#020a14', border: '1px solid #1a2d4a' }}
                placeholder={'{\n  "provider": "aws",\n  "service": "s3",\n  "acl": "public-read-write",\n  "encryption": { "enabled": false }\n}'} />
            </div>
          )}

          {tab === 'simulate' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 mb-4">
                Select a cloud provider, service, and scenario. A sample configuration will be generated and scanned automatically.
              </p>
              {/* Provider */}
              <div>
                <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">Cloud Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {options && Object.keys(options).map(p => (
                    <button key={p} onClick={() => handleProviderChange(p)}
                      className={`py-2 rounded-lg text-sm font-medium uppercase tracking-wider transition-all ${provider === p ? 'text-sky-400' : 'text-slate-400 hover:text-white'}`}
                      style={{ background: provider === p ? 'rgba(14,165,233,0.15)' : '#0d1f35', border: `1px solid ${provider === p ? 'rgba(14,165,233,0.4)' : '#1a2d4a'}` }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {/* Service */}
              <div>
                <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">Service</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(services).map(([svc, info]) => (
                    <button key={svc} onClick={() => handleServiceChange(svc)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${service === svc ? 'text-sky-400' : 'text-slate-400 hover:text-white'}`}
                      style={{ background: service === svc ? 'rgba(14,165,233,0.15)' : '#0d1f35', border: `1px solid ${service === svc ? 'rgba(14,165,233,0.4)' : '#1a2d4a'}` }}>
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Scenario */}
              <div>
                <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">Scenario</label>
                <div className="space-y-2">
                  {scenarios.map(s => (
                    <button key={s.value} onClick={() => setScenario(s.value)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all ${scenario === s.value ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                      style={{ background: scenario === s.value ? 'rgba(14,165,233,0.15)' : '#0d1f35', border: `1px solid ${scenario === s.value ? 'rgba(14,165,233,0.4)' : '#1a2d4a'}` }}>
                      {s.label}
                      {scenario === s.value && <ChevronRight size={14} style={{ color: '#0ea5e9' }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Run Button */}
        <button onClick={handleRunScan} disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-60 hover:scale-[1.02] hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 0 30px rgba(14,165,233,0.2)' }}>
          {loading ? <><Loader2 size={20} className="animate-spin" /> Scanning…</> : <><Play size={20} /> Run Scan</>}
        </button>
      </div>
    </div>
  )
}
