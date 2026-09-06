import React, { useState } from 'react';
import { ApiEndpoint, DatabaseSchema } from '../types/system-design';
import { Code, Database, Copy, Check, Key, Hash } from 'lucide-react';

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
        return 'bg-[#EBF3FA] text-[#1D3557] border-[#1D3557]/30';
      case 'POST':
        return 'bg-[#F4F9F4] text-[#166534] border-[#166534]/30';
      case 'PUT':
      case 'PATCH':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#92400E]/30';
      case 'DELETE':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#991B1B]/30';
      case 'WS':
      case 'gRPC':
        return 'bg-[#FAF5FF] text-[#581C87] border-[#581C87]/30';
      default:
        return 'bg-[#F9F7F2] text-[#1A1A1A] border-[#1A1A1A]/20';
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {endpoints.map((api, idx) => (
        <div
          key={idx}
          className="bg-[#FFFFFF] border border-[#1A1A1A]/10 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-[#F9F7F2] border-b border-[#1A1A1A]/10 gap-2">
            <div className="flex items-center gap-2.5 font-mono">
              <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getMethodBadge(api.method)}`}>
                {api.method}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#1A1A1A] break-all">
                {api.path}
              </span>
            </div>
            <span className="text-xs text-[#1A1A1A]/60 font-serif italic">
              {api.description}
            </span>
          </div>

          {/* Details & Code Bodies */}
          <div className="p-5 space-y-4">
            {api.headers && api.headers.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/50">Headers:</span>
                <div className="flex flex-wrap gap-2">
                  {api.headers.map((h, i) => (
                    <span key={i} className="text-xs font-mono bg-[#F9F7F2] px-2 py-0.5 text-[#1A1A1A] border border-[#1A1A1A]/15">
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
                    <span className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-wider">Request Payload</span>
                    <button
                      onClick={() => handleCopy(api.requestBody || '', idx * 2)}
                      className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors p-1"
                      title="Copy JSON"
                    >
                      {copiedIndex === idx * 2 ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="p-3.5 bg-[#F9F7F2] text-[#1A1A1A] font-mono text-xs overflow-x-auto border border-[#1A1A1A]/10 leading-relaxed">
                    {api.requestBody}
                  </pre>
                </div>
              )}

              {api.responseBody && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-wider">Response Payload</span>
                    <button
                      onClick={() => handleCopy(api.responseBody || '', idx * 2 + 1)}
                      className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors p-1"
                      title="Copy JSON"
                    >
                      {copiedIndex === idx * 2 + 1 ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="p-3.5 bg-[#F9F7F2] text-[#1A1A1A] font-mono text-xs overflow-x-auto border border-[#1A1A1A]/10 leading-relaxed">
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
    <div className="space-y-4 font-sans">
      {schemas.map((schema, idx) => (
        <div
          key={idx}
          className="bg-[#FFFFFF] border border-[#1A1A1A]/10 shadow-sm overflow-hidden"
        >
          {/* Table Header */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-[#F9F7F2] border-b border-[#1A1A1A]/10 gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#991B1B]" />
              <h4 className="text-sm font-bold font-mono text-[#1A1A1A]">
                {schema.tableName}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FFFFFF] text-[#1A1A1A] border border-[#1A1A1A]/15 uppercase">
                {schema.type}
              </span>
            </div>

            {schema.shardingKey && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#92400E] bg-[#FFFBEB] px-2.5 py-1 border border-[#92400E]/20">
                <Hash className="w-3.5 h-3.5" />
                <span>Partition Key: {schema.shardingKey}</span>
              </div>
            )}
          </div>

          {/* Fields Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FDFCFB] border-b border-[#1A1A1A]/10 text-[#1A1A1A]/50 font-mono uppercase text-[10px] tracking-wider">
                  <th className="p-3 pl-4">Field Name</th>
                  <th className="p-3">Data Type</th>
                  <th className="p-3">Key / Index</th>
                  <th className="p-3 pr-4">Description & Constraints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/10 font-mono text-[#1A1A1A]/90">
                {schema.fields.map((field, fIdx) => (
                  <tr key={fIdx} className="hover:bg-[#F9F7F2]/60 transition-colors">
                    <td className="p-3 pl-4 font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      {field.isPrimary && <Key className="w-3.5 h-3.5 text-[#92400E]" />}
                      {field.name}
                    </td>
                    <td className="p-3 text-[#1D3557] font-semibold">
                      {field.type}
                    </td>
                    <td className="p-3">
                      {field.isPrimary && (
                        <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#92400E] border border-[#92400E]/20 text-[9px] font-bold">
                          PRIMARY KEY
                        </span>
                      )}
                      {field.isIndex && (
                        <span className="px-2 py-0.5 bg-[#EBF3FA] text-[#1D3557] border border-[#1D3557]/20 text-[9px] font-bold">
                          INDEX
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-4 font-sans text-[#1A1A1A]/70 text-xs">
                      {field.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schema.notes && (
            <div className="p-3.5 bg-[#F9F7F2] border-t border-[#1A1A1A]/10 text-xs text-[#1A1A1A]/80 leading-relaxed font-sans">
              <span className="text-[#1A1A1A] font-bold font-serif">Schema Architecture Note: </span>
              {schema.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
