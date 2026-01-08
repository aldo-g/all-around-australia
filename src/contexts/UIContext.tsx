import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
    hoveredPhotoUrl: string | null;
    setHoveredPhotoUrl: (url: string | null) => void;
    mapTarget: [number, number] | null;
    flyTo: (location: [number, number]) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    expandedActivityId: number | null;
    toggleActivityExpansion: (id: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hoveredPhotoUrl, setHoveredPhotoUrl] = useState<string | null>(null);
    const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedActivityId, setExpandedActivityId] = useState<number | null>(null);

    const flyTo = (location: [number, number]) => {
        // We use a small timestamp or random key to ensure even same-location clicks trigger an update if needed, 
        // but for now simple state is fine. Actually, Leaflet might need a way to trigger.
        setMapTarget(location);
    };

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const setSidebarOpen = (isOpen: boolean) => setIsSidebarOpen(isOpen);

    const toggleActivityExpansion = (id: number) => {
        setExpandedActivityId(prev => (prev === id ? null : id));
    };

    return (
        <UIContext.Provider value={{
            hoveredPhotoUrl,
            setHoveredPhotoUrl,
            mapTarget,
            flyTo,
            isSidebarOpen,
            toggleSidebar,
            setSidebarOpen,
            expandedActivityId,
            toggleActivityExpansion
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
