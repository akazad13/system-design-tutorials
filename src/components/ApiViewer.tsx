import React, { useState } from 'react';
import { ApiEndpoint, DatabaseSchema } from '../types/system-design';
import { Database, Copy, Check, Key, Hash, Code, Sparkles } from 'lucide-react';

interface ApiViewerProps {
  endpoints: ApiEndpoint[];
}

export const ApiViewer: React.FC<ApiViewerProps> = ({ endpoints }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'POST':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'DELETE':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      case 'WS':
      case 'gRPC':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {endpoints.map((api, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-neutral-50/80 dark:bg-[#131722]/80 border-b border-neutral-200/80 dark:border-neutral-800 gap-2">
            <div className="flex items-center gap-2.5 font-mono">
              <span className={`px-2.5 py-0.5 text-xs font-bold border rounded-md uppercase tracking-wider ${getMethodBadge(api.method)}`}>
                {api.method}
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white break-all">
                {api.path}
              </span>
            </div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-serif italic">
              {api.description}
            </span>
          </div>

          {/* Details & Code Bodies */}
          <div className="p-4 sm:p-5 space-y-4">
            {api.headers && api.headers.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Headers:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {api.headers.map((h, i) => (
                    <span key={i} className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 text-neutral-800 dark:text-neutral-200 rounded border border-neutral-200 dark:border-neutral-700">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {api.requestBody && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-500" /> Request Payload (JSON)
                    </span>
                    <button
                      onClick={() => handleCopy(api.requestBody || '', idx * 2)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800"
                      title="Copy JSON"
                    >
                      {copiedIndex === idx * 2 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="font-mono text-[10px]">{copiedIndex === idx * 2 ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-neutral-950 text-neutral-100 dark:bg-[#0A0C12] font-mono text-xs overflow-x-auto border border-neutral-800 leading-relaxed">
                    {api.requestBody}
                  </pre>
                </div>
              )}

              {api.responseBody && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Response Payload (JSON)
                    </span>
                    <button
                      onClick={() => handleCopy(api.responseBody || '', idx * 2 + 1)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800"
                      title="Copy JSON"
                    >
                      {copiedIndex === idx * 2 + 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="font-mono text-[10px]">{copiedIndex === idx * 2 + 1 ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-neutral-950 text-neutral-100 dark:bg-[#0A0C12] font-mono text-xs overflow-x-auto border border-neutral-800 leading-relaxed">
                    {api.responseBody}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface DatabaseViewerProps {
  schemas: DatabaseSchema[];
}

export const DatabaseViewer: React.FC<DatabaseViewerProps> = ({ schemas }) => {
  return (
    <div className="space-y-5 font-sans">
      {schemas.map((schema, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200"
        >
          {/* Table Header */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-neutral-50/80 dark:bg-[#131722]/80 border-b border-neutral-200/80 dark:border-neutral-800 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm sm:text-base font-bold font-mono text-neutral-900 dark:text-white">
                {schema.tableName}
              </h4>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded uppercase">
                {schema.type}
              </span>
            </div>

            {schema.shardingKey && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>Partition Key: {schema.shardingKey}</span>
              </div>
            )}
          </div>

          {/* Fields Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-[#0F121C]/60 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="p-3 pl-4">Field Name</th>
                  <th className="p-3">Data Type</th>
                  <th className="p-3">Key / Index</th>
                  <th className="p-3 pr-4">Description & Constraints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800 font-mono text-neutral-800 dark:text-neutral-200">
                {schema.fields.map((field, fIdx) => (
                  <tr key={fIdx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="p-3 pl-4 font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      {field.isPrimary && <Key className="w-3.5 h-3.5 text-amber-500" />}
                      {field.name}
                    </td>
                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {field.type}
                    </td>
                    <td className="p-3">
                      {field.isPrimary && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold">
                          PRIMARY KEY
                        </span>
                      )}
                      {field.isIndex && (
                        <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-[10px] font-bold ml-1">
                          INDEX
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-4 font-sans text-neutral-600 dark:text-neutral-300 text-xs">
                      {field.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schema.notes && (
            <div className="p-3.5 bg-neutral-50/80 dark:bg-[#131722]/80 border-t border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
              <span className="text-neutral-900 dark:text-white font-bold font-serif">Schema Architecture Note: </span>
              {schema.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
