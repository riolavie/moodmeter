import React from 'react';
import { soundFx } from '../utils/audio';

export type TabId = 'capture' | 'analyze' | 'grid' | 'activities';

interface BottomNavBarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'capture' as TabId, label: 'Capture', icon: 'photo_camera', sub: '찰칵' },
    { id: 'analyze' as TabId, label: 'Analyze', icon: 'psychology', sub: '분석' },
    { id: 'grid' as TabId, label: 'Grid', icon: 'grid_view', sub: '4분면' },
    { id: 'activities' as TabId, label: 'Actions', icon: 'self_care', sub: '케어' }
  ];

  return (
    <nav
      id="bottomNavigation"
      className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-40 flex justify-between items-center px-3 py-2 bg-white/95 backdrop-blur-md shadow-sm border-t border-slate-200"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => {
              soundFx.playTap();
              onSelectTab(tab.id);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-semibold tracking-tight mt-0.5 leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
