
import React, { useState, useEffect } from 'react';
import { Player, MarketState, Item, ItemType, MarketItem } from '../types';
import { api } from '../services/api';

interface InventoryMarketUIProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onLog: (msg: string, type: 'SUCCESS' | 'FAILURE' | 'INFO') => void;
  initialTab?: 'INVENTORY' | 'MARKET';
}

export const InventoryMarketUI: React.FC<InventoryMarketUIProps> = ({ player, onUpdate, onLog, initialTab = 'INVENTORY' }) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'MARKET'>(initialTab);
  const [market, setMarket] = useState<MarketState | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [marketCategory, setMarketCategory] = useState<ItemType | 'ALL'>('ALL');

  useEffect(() => {
    const loadMarket = async () => {
      const data = await api.market.get();
      setMarket(data);
    };
    loadMarket();
  }, [player]);

  const handleRefreshMarket = async () => {
      setProcessing('MARKET_REFRESH');
      const newMarket = await api.market.refresh();
      setMarket(newMarket);
      setProcessing(null);
      onLog("Secure comms link established. Market data updated.", 'INFO');
  };

  const handleEquip = async (itemId: string) => {
      setProcessing(itemId);
      const res = await api.items.equip(itemId);
      if (res.success && res.data) {
          onUpdate(res.data);
          onLog("Gear equipped.", 'SUCCESS');
      } else {
          onLog(res.message || "Failed.", 'FAILURE');
      }
      setProcessing(null);
  }

  const handleUnequip = async (slot: 'weapon' | 'armor' | 'gadget') => {
      setProcessing(`unequip_${slot}`);
      const res = await api.items.unequip(slot);
      if (res.success && res.data) {
          onUpdate(res.data);
          onLog(`${slot} stashed.`, 'INFO');
      }
      setProcessing(null);
  }

  const handleUse = async (itemId: string) => {
      setProcessing(itemId);
      const res = await api.items.use(itemId);
      if (res.success && res.data) {
          onUpdate(res.data);
          onLog("Item consumed.", 'SUCCESS');
      }
      setProcessing(null);
  }

  const handleSell = async (itemId: string) => {
      setProcessing(itemId);
      const res = await api.market.sell(itemId);
      if (res.success && res.data) {
          onUpdate(res.data);
          onLog(res.message || "Sold.", 'SUCCESS');
      }
      setProcessing(null);
  }

  const handleBuy = async (itemId: string) => {
      setProcessing(itemId);
      const res = await api.market.buy(itemId);
      if (res.success && res.data) {
          onUpdate(res.data);
          onLog(res.message || "Purchased.", 'SUCCESS');
      } else {
          onLog(res.message || "Transaction failed.", 'FAILURE');
      }
      setProcessing(null);
  }

  const renderInventory = () => (
      <div className="space-y-6">
          {/* EQUIPPED SECTION */}
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded">
              <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Active Loadout</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['weapon', 'armor', 'gadget'].map((slot) => {
                      // @ts-ignore
                      const item = player.equipment[slot] as Item | null;
                      return (
                          <div key={slot} className="bg-black border border-zinc-800 p-3 rounded relative group">
                              <div className="text-[10px] text-zinc-600 uppercase mb-1">{slot}</div>
                              {item ? (
                                  <div>
                                      <div className={`font-bold ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : item.rarity === 'EPIC' ? 'text-neon-purple' : 'text-white'}`}>{item.name}</div>
                                      <div className="text-xs text-zinc-400">+{item.bonus} {item.type === 'WEAPON' ? 'ATK' : item.type === 'ARMOR' ? 'DEF' : 'INT'}</div>
                                      <button 
                                        onClick={() => handleUnequip(slot as any)}
                                        disabled={!!processing}
                                        className="mt-2 text-[10px] text-red-500 hover:text-white border border-zinc-800 hover:border-red-500 px-2 py-1 uppercase"
                                      >
                                          Unequip
                                      </button>
                                  </div>
                              ) : (
                                  <div className="text-zinc-700 italic text-sm py-2">Empty Slot</div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* BACKPACK SECTION */}
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded">
              <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Stash ({player.inventory.length} Items)</h3>
              
              {player.inventory.length === 0 ? (
                  <div className="text-zinc-600 italic text-center py-8">Your pockets are empty. Visit the Shadow Market.</div>
              ) : (
                  <div className="space-y-2">
                      {player.inventory.map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-black border border-zinc-800 p-3 hover:border-zinc-600 transition-colors">
                              <div>
                                  <div className={`font-bold text-sm ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : item.rarity === 'EPIC' ? 'text-neon-purple' : 'text-white'}`}>
                                      {item.name}
                                  </div>
                                  <div className="text-xs text-zinc-500">{item.description}</div>
                              </div>
                              <div className="flex gap-2">
                                  {item.type === 'CONSUMABLE' ? (
                                      <button 
                                        onClick={() => handleUse(item.id)}
                                        disabled={!!processing}
                                        className="bg-zinc-800 text-green-500 hover:bg-green-900 px-3 py-1 text-xs font-bold uppercase"
                                      >
                                          USE
                                      </button>
                                  ) : (
                                      <button 
                                        onClick={() => handleEquip(item.id)}
                                        disabled={!!processing}
                                        className="bg-zinc-800 text-neon-blue hover:bg-blue-900 px-3 py-1 text-xs font-bold uppercase"
                                      >
                                          EQUIP
                                      </button>
                                  )}
                                  <button 
                                    onClick={() => handleSell(item.id)}
                                    disabled={!!processing}
                                    className="border border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 px-3 py-1 text-xs font-bold uppercase"
                                  >
                                      SELL
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );

  const renderMarket = () => {
    const filteredItems = market?.items.filter(i => marketCategory === 'ALL' || i.type === marketCategory) || [];
    
    return (
      <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
              <div>
                  <h2 className="text-xl text-white font-bold uppercase tracking-widest">Shadow Market</h2>
                  <div className="text-xs text-zinc-400 mt-1 max-w-md">
                      {market?.news || "Establishing connection..."}
                  </div>
              </div>
              <button 
                onClick={handleRefreshMarket}
                disabled={!!processing}
                className="text-xs text-neon-blue hover:text-white border border-neon-blue hover:bg-neon-blue hover:text-black px-3 py-1 uppercase font-bold transition-all"
              >
                  {processing === 'MARKET_REFRESH' ? 'Syncing...' : 'Refresh Feed'}
              </button>
          </div>

          {/* MARKET TICKER */}
          <div className="bg-black border-y border-zinc-800 overflow-hidden relative h-8 flex items-center mb-4">
             {market?.items && (
                 <div className="whitespace-nowrap animate-marquee flex gap-10">
                    {/* Duplicate array for seamless scrolling illusion if short, or just map once */}
                    {[...market.items, ...market.items].map((item, idx) => {
                        const isUp = item.trend === 'UP';
                        const color = isUp ? 'text-green-500' : item.trend === 'DOWN' ? 'text-red-500' : 'text-zinc-500';
                        const sign = isUp ? '▲' : item.trend === 'DOWN' ? '▼' : '−';
                        const pct = Math.abs(Math.round((1 - item.trendValue) * 100));
                        return (
                            <span key={`${item.id}-${idx}`} className="font-mono text-xs font-bold flex items-center gap-1">
                                <span className="text-zinc-500">[{item.name}]</span>
                                <span className={color}>${item.currentPrice} {sign}{pct}%</span>
                            </span>
                        );
                    })}
                 </div>
             )}
          </div>

          {/* CATEGORY FILTER */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
             <button 
                onClick={() => setMarketCategory('ALL')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase border rounded-full transition-all ${marketCategory === 'ALL' ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
             >
                All Items
             </button>
             <button 
                onClick={() => setMarketCategory(ItemType.WEAPON)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase border rounded-full transition-all ${marketCategory === ItemType.WEAPON ? 'bg-red-900/20 text-red-500 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-black text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
             >
                Weapons
             </button>
             <button 
                onClick={() => setMarketCategory(ItemType.ARMOR)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase border rounded-full transition-all ${marketCategory === ItemType.ARMOR ? 'bg-blue-900/20 text-blue-500 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-black text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
             >
                Armor
             </button>
             <button 
                onClick={() => setMarketCategory(ItemType.GADGET)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase border rounded-full transition-all ${marketCategory === ItemType.GADGET ? 'bg-purple-900/20 text-purple-500 border-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-black text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
             >
                Gadgets
             </button>
             <button 
                onClick={() => setMarketCategory(ItemType.CONSUMABLE)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase border rounded-full transition-all ${marketCategory === ItemType.CONSUMABLE ? 'bg-green-900/20 text-green-500 border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.3)]' : 'bg-black text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
             >
                Consumables
             </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded p-1">
              <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase font-bold px-4 py-2 border-b border-zinc-800">
                  <div className="col-span-6 md:col-span-5">Item</div>
                  <div className="col-span-3 md:col-span-2 text-center">Trend</div>
                  <div className="col-span-3 text-right hidden md:block">Price</div>
                  <div className="col-span-3 md:col-span-2 text-right">Action</div>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto">
                  {filteredItems.map(item => {
                      const isUp = item.trend === 'UP';
                      const isDown = item.trend === 'DOWN';
                      
                      const changePct = Math.abs(1 - item.trendValue);
                      const isSpiking = isUp && changePct > 0.2;
                      const isCrashing = isDown && changePct > 0.2;

                      return (
                          <div key={item.id} className="grid grid-cols-12 items-center p-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                              <div className="col-span-6 md:col-span-5">
                                  <div className="flex items-center gap-2">
                                      <div className={`font-bold text-sm ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : item.rarity === 'EPIC' ? 'text-neon-purple' : 'text-zinc-200'}`}>{item.name}</div>
                                      {isSpiking && <span className="hidden md:inline-block text-[9px] font-bold bg-green-500 text-black px-1 rounded animate-pulse">SPIKING</span>}
                                      {isCrashing && <span className="hidden md:inline-block text-[9px] font-bold bg-red-500 text-white px-1 rounded animate-pulse">CRASHING</span>}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">{item.type} • +{item.bonus} Effect</div>
                              </div>
                              <div className="col-span-3 md:col-span-2 text-center flex flex-col items-center justify-center">
                                  {isUp && <span className={`font-bold ${isSpiking ? 'text-green-400' : 'text-green-600'}`}>↑ +{Math.round((item.trendValue - 1) * 100)}%</span>}
                                  {isDown && <span className={`font-bold ${isCrashing ? 'text-red-400' : 'text-red-600'}`}>↓ {Math.round((1 - item.trendValue) * 100)}%</span>}
                                  {!isUp && !isDown && <span className="text-zinc-600">-</span>}
                                  
                                  {/* Mobile Only Tags */}
                                  <div className="md:hidden mt-1">
                                    {isSpiking && <span className="text-[8px] font-bold text-green-500">SPIKE</span>}
                                    {isCrashing && <span className="text-[8px] font-bold text-red-500">CRASH</span>}
                                  </div>
                              </div>
                              <div className="col-span-3 text-right font-mono text-neon-green hidden md:block">
                                  ${item.currentPrice.toLocaleString()}
                              </div>
                              <div className="col-span-3 md:col-span-2 text-right">
                                  <div className="md:hidden text-xs font-mono text-neon-green mb-1">${item.currentPrice.toLocaleString()}</div>
                                  <button 
                                    onClick={() => handleBuy(item.id)}
                                    disabled={player.wallet < item.currentPrice || !!processing}
                                    className={`px-3 py-1 text-xs font-bold uppercase border ${
                                        player.wallet >= item.currentPrice 
                                        ? 'border-neon-green text-neon-green hover:bg-neon-green hover:text-black' 
                                        : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }`}
                                  >
                                      BUY
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <style>{`
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .animate-marquee {
                animation: marquee 30s linear infinite;
            }
        `}</style>
        
        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setActiveTab('INVENTORY')}
                className={`flex-1 py-3 border-b-2 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'INVENTORY' ? 'border-neon-blue text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
            >
                My Gear
            </button>
            <button 
                onClick={() => setActiveTab('MARKET')}
                className={`flex-1 py-3 border-b-2 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'MARKET' ? 'border-neon-blue text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
            >
                Black Market
            </button>
        </div>

        {activeTab === 'INVENTORY' ? renderInventory() : renderMarket()}
    </div>
  );
};
