import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFile } from '../api'

export default function UploadZone({ onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0]
    if (!file) return
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const result = await uploadFile(file, setProgress)
      onUpload(result)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="w-full max-w-xl">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {uploading ? (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">Processing…</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progress}%</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your Excel file'}
                </p>
                <p className="text-sm text-gray-400 mt-1">or click to browse · .xlsx / .xls</p>
              </div>
              <p className="text-xs text-gray-400">
                Expected columns: Ticket Number, Assigned To, State, Created Date, Sub Category, Area…
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
