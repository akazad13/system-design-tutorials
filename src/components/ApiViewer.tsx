import React, { useState, useMemo } from 'react';
import { ApiEndpoint, DatabaseSchema } from '../types/system-design';
import { 
  Database, 
  Copy, 
  Check, 
  Key, 
  Hash, 
  Code, 
  Sparkles, 
  Terminal, 
  Search, 
  Filter, 
  Table, 
  FileCode2 
} from 'lucide-react';

interface ApiViewerProps {
  endpoints: ApiEndpoint[];
}

export const ApiViewer: React.FC<ApiViewerProps> = ({ endpoints }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedCurlIndex, setCopiedCurlIndex] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyCurl = (api: ApiEndpoint, index: number) => {
    const headersStr = (api.headers || ['Content-Type: application/json'])
      .map(h => `-H "${h}"`)
      .join(' ');
    const dataStr = api.requestBody ? `-d '${api.requestBody.replace(/\n/g, ' ')}'` : '';
    const curl = `curl -X ${api.method} "https://api.system.local${api.path}" ${headersStr} ${dataStr}`.trim();

    navigator.clipboard.writeText(curl);
    setCopiedCurlIndex(index);
    setTimeout(() => setCopiedCurlIndex(null), 2000);
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

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((api) => {
      const matchesMethod = selectedMethod === 'ALL' || api.method === selectedMethod;
      const matchesSearch = searchQuery === '' || 
        api.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
        api.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMethod && matchesSearch;
    });
  }, [endpoints, selectedMethod, searchQuery]);

  return (
    <div className="space-y-4 font-sans">
      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50/80 dark:bg-[#121622]/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'WS'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMethod(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedMethod === m
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by endpoint path..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>
      </div>

      {filteredEndpoints.length === 0 ? (
        <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400 font-mono bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl">
          No endpoints match the selected filter criteria.
        </div>
      ) : (
        filteredEndpoints.map((api, idx) => (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCurl(api, idx)}
                  className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy cURL Command"
                >
                  <Terminal className="w-3 h-3 text-indigo-500" />
                  <span>{copiedCurlIndex === idx ? 'Copied cURL' : 'cURL'}</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="px-4 pt-3 text-xs text-neutral-600 dark:text-neutral-300 font-sans">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Operation: </span>
              {api.description}
            </div>

            {/* Details & Code Bodies */}
            <div className="p-4 space-y-4">
              {api.headers && api.headers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    HTTP Headers:
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
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
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
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
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
        ))
      )}
    </div>
  );
};

interface DatabaseViewerProps {
  schemas: DatabaseSchema[];
}

export const DatabaseViewer: React.FC<DatabaseViewerProps> = ({ schemas }) => {
  const [viewMode, setViewMode] = useState<'table' | 'ddl'>('table');
  const [copiedDdlIdx, setCopiedDdlIdx] = useState<number | null>(null);

  const generateDdl = (schema: DatabaseSchema): string => {
    const fieldsSql = schema.fields.map(f => {
      let line = `  ${f.name.padEnd(20)} ${f.type}`;
      if (f.isPrimary) line += ' PRIMARY KEY';
      if (f.notes) line += ` -- ${f.notes}`;
      return line;
    }).join(',\n');

    let ddl = `CREATE TABLE ${schema.tableName} (\n${fieldsSql}\n);`;
    if (schema.shardingKey) {
      ddl += `\n-- Partitioning / Shard Key: ${schema.shardingKey}`;
    }
    const indexFields = schema.fields.filter(f => f.isIndex && !f.isPrimary);
    if (indexFields.length > 0) {
      indexFields.forEach(f => {
        ddl += `\nCREATE INDEX idx_${schema.tableName}_${f.name} ON ${schema.tableName} (${f.name});`;
      });
    }
    return ddl;
  };

  const handleCopyDdl = (ddl: string, idx: number) => {
    navigator.clipboard.writeText(ddl);
    setCopiedDdlIdx(idx);
    setTimeout(() => setCopiedDdlIdx(null), 2000);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Mode toggle */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
          {schemas.length} Data Entities & Physical Partitioning Schemas
        </span>

        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Schema Table</span>
          </button>
          <button
            onClick={() => setViewMode('ddl')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'ddl'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>SQL DDL</span>
          </button>
        </div>
      </div>

      {schemas.map((schema, idx) => {
        const ddlCode = generateDdl(schema);

        return (
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

              <div className="flex items-center gap-2">
                {schema.shardingKey && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                    <Hash className="w-3.5 h-3.5 text-amber-500" />
                    <span>Partition Key: {schema.shardingKey}</span>
                  </div>
                )}
                <button
                  onClick={() => handleCopyDdl(ddlCode, idx)}
                  className="p-1.5 text-xs font-mono rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy DDL"
                >
                  {copiedDdlIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* View Mode Content */}
            {viewMode === 'table' ? (
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
            ) : (
              <div className="p-4 bg-neutral-950 dark:bg-[#0A0C12]">
                <pre className="font-mono text-xs text-neutral-100 overflow-x-auto leading-relaxed">
                  {ddlCode}
                </pre>
              </div>
            )}

            {schema.notes && (
              <div className="p-3.5 bg-neutral-50/80 dark:bg-[#131722]/80 border-t border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                <span className="text-neutral-900 dark:text-white font-bold font-serif">Schema Architecture Note: </span>
                {schema.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
