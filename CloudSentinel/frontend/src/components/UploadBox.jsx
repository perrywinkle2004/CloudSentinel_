import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'

export default function UploadBox({ file, onFileSelect, onClear }) {
    const onDrop = useCallback((accepted) => {
        if (accepted[0]) onFileSelect(accepted[0])
    }, [onFileSelect])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json'],
            'text/yaml': ['.yaml', '.yml'],
            'text/plain': ['.txt'],
        },
        multiple: false,
    })

    return (
        <div>
            <div {...getRootProps()}
                className="cursor-pointer rounded-xl p-12 text-center transition-all"
                style={{
                    border: `2px dashed ${isDragActive ? '#0ea5e9' : '#1a2d4a'}`,
                    background: isDragActive ? 'rgba(14,165,233,0.05)' : 'transparent',
                }}>
                <input {...getInputProps()} />
                <Upload size={48} className="mx-auto mb-4"
                    style={{ color: isDragActive ? '#0ea5e9' : '#475569' }} />
                <p className="text-lg text-slate-300 font-medium">
                    {isDragActive ? 'Drop your configuration file here…' : 'Drag & drop your config file'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    or click to browse — supports JSON, YAML, TXT
                </p>
            </div>

            {file && (
                <div className="mt-4 flex items-center gap-3 p-4 rounded-lg"
                    style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)' }}>
                    <FileText size={18} style={{ color: '#0ea5e9' }} />
                    <span className="text-sm text-slate-200 flex-1 truncate font-medium">{file.name}</span>
                    <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                    <button onClick={onClear}
                        className="p-1 rounded hover:bg-white/10 transition-colors">
                        <X size={14} className="text-slate-400" />
                    </button>
                </div>
            )}
        </div>
    )
}
