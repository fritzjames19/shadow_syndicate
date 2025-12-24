
import React, { useState } from 'react';
import { api } from '../services/api';

interface SystemMenuProps {
  onClose: () => void;
  onLog: (msg: string, type: 'SUCCESS' | 'FAILURE' | 'INFO') => void;
}

export const SystemMenu: React.FC<SystemMenuProps> = ({ onClose, onLog }) => {
  const [exportString, setExportString] = useState('');
  const [importString, setImportString] = useState('');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'SAVE' | 'REDEEM'>('SAVE');

  const handleExport = async () => {
    const res = await api.system.exportSave();
    if (res.success && res.data) {
      setExportString(res.data);
      navigator.clipboard.writeText(res.data);
      onLog("Save string copied to clipboard.", 'SUCCESS');
    }
  };

  const handleImport = async () => {
    if (!importString) return;
    if (confirm("WARNING: importing a save will overwrite your current progress. Continue?")) {
        const res = await api.system.importSave(importString);
        if (res.success) {
            onLog("Save loaded. Rebooting...", 'SUCCESS');
        } else {
            onLog(res.message || "Import failed.", 'FAILURE');
        }
    }
  };

  const handleRedeem = async () => {
      if (!code) return;
      const res = await api.system.redeemCode(code.trim());
      if (res.success) {
          onLog(res.message || "Code accepted.", 'SUCCESS');
          setCode('');
      } else {
          onLog(res.message || "Invalid code.", 'FAILURE');
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 p-6 rounded-lg shadow-2xl relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
            ✖
        </button>

        <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">System Settings</h2>

        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setActiveTab('SAVE')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'SAVE' ? 'border-neon-blue text-white' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
            >
                Data Management
            </button>
            <button 
                onClick={() => setActiveTab('REDEEM')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'REDEEM' ? 'border-neon-green text-white' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
            >
                Redeem Code
            </button>
        </div>

        {activeTab === 'SAVE' && (
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs text-zinc-400 font-bold uppercase mb-2">Manual Backup (Export)</h3>
                    <p className="text-[10px] text-zinc-600 mb-2">Save this string safely. It is your only backup.</p>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="flex-1 bg-zinc-800 hover:bg-white hover:text-black py-2 text-xs font-bold uppercase">Generate Save</button>
                    </div>
                    {exportString && (
                        <textarea 
                            readOnly 
                            value={exportString} 
                            className="w-full mt-2 h-20 bg-black border border-zinc-800 p-2 text-[10px] text-neon-blue font-mono resize-none focus:outline-none"
                        />
                    )}
                </div>

                <div className="border-t border-zinc-800 pt-6">
                    <h3 className="text-xs text-zinc-400 font-bold uppercase mb-2">Restore Data (Import)</h3>
                    <textarea 
                        value={importString}
                        onChange={(e) => setImportString(e.target.value)}
                        placeholder="Paste save string here..."
                        className="w-full mb-2 h-20 bg-black border border-zinc-800 p-2 text-[10px] text-white font-mono resize-none focus:border-neon-blue outline-none"
                    />
                    <button onClick={handleImport} className="w-full bg-red-900/20 hover:bg-red-900 border border-red-900/50 text-red-500 hover:text-white py-2 text-xs font-bold uppercase">
                        Overwrite & Load
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'REDEEM' && (
            <div className="space-y-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded">
                    <h3 className="text-xs text-zinc-400 font-bold uppercase mb-2">Enter Access Code</h3>
                    <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="CODE-XXXX-XXXX"
                        className="w-full bg-black border border-zinc-700 p-3 text-sm text-center font-mono text-white tracking-widest uppercase focus:border-neon-green outline-none mb-4"
                    />
                    <button onClick={handleRedeem} className="w-full bg-neon-green text-black hover:bg-white py-3 text-xs font-bold uppercase tracking-widest">
                        Submit
                    </button>
                </div>
                <div className="text-[10px] text-zinc-600 text-center">
                    Codes are distributed via official Syndicate comms channels.
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
