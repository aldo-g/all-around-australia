import React, { useMemo } from 'react';
import { Navigation, Bike, Footprints, Waves, Compass, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import activitiesData from '../data/strava-activities.json';
import mapIcon from '../assets/map.png';

interface Activity {
    id: number;
    name: string;
    distance: number;
    start_date_local: string;
    photos?: {
        url: string;
        location?: [number, number];
        timestamp?: string;
    }[];
    description?: string;
    [key: string]: any;
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'Ride': return <Bike size={14} />;
        case 'Run':
        case 'Walk':
        case 'Hike': return <Footprints size={14} />;
        case 'Swim': return <Waves size={14} />;
        default: return <Compass size={14} />;
    }
};

const Sidebar: React.FC = () => {
    const activities = (activitiesData || []) as Activity[];
    const { setHoveredPhotoUrl, flyTo, isSidebarOpen, toggleSidebar, expandedActivityId, toggleActivityExpansion } = useUI();

    // Auto-scroll to expanded activity
    React.useEffect(() => {
        if (expandedActivityId) {
            // Small delay to ensure the DOM has updated and animation started
            setTimeout(() => {
                const element = document.getElementById(`activity-${expandedActivityId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [expandedActivityId]);

    // Total distance calculation for the blog summary
    const totalKm = useMemo(() => activities.reduce((acc, a) => acc + (a.distance || 0), 0) / 1000, [activities]);
    const activityCount = useMemo(() => activities.length, [activities]);

    // Group activities by date
    const groupedActivities = useMemo(() => activities.reduce((groups: { [key: string]: Activity[] }, activity) => {
        const date = activity.start_date_local.split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(activity);
        return groups;
    }, {}), [activities]);

    // Sort dates newest first
    const sortedDates = useMemo(() => Object.keys(groupedActivities).sort((a, b) => b.localeCompare(a)), [groupedActivities]);

    return (
        <div style={{
            position: 'absolute',
            zIndex: 1000,
            left: 0,
            display: 'flex',
            alignItems: 'flex-start',
            pointerEvents: 'none', // Allow clicks to pass through empty space
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-360px)'
        }}>
            <aside className="glass" style={{
                width: '340px',
                height: 'calc(100vh - 40px)',
                margin: '20px',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                pointerEvents: 'auto'
            }}>
                <div style={{ marginBottom: '32px', padding: '8px' }}>
                    <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--primary)' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: 'var(--primary)',
                            WebkitMaskImage: `url(${mapIcon})`,
                            maskImage: `url(${mapIcon})`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                            filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))'
                        }} />
                        All Around Australia
                    </h1>
                </div>

                <div style={{ flexShrink: 0 }}>
                    <div style={{
                        padding: '20px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                        textAlign: 'center',
                        marginBottom: '32px'
                    }}>
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>
                                {totalKm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '4px' }}>km</span>
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Total Distance Traveled
                            </p>
                        </div>

                        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{activityCount}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Activities</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '4px',
                    maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)'
                }} className="custom-scrollbar">
                    <h3 style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '20px',
                        paddingLeft: '12px'
                    }}>
                        Journey Timeline
                    </h3>

                    <div style={{ position: 'relative', paddingLeft: '24px', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        {sortedDates.map((date) => {
                            const dayActivities = groupedActivities[date];
                            const dayDistance = dayActivities.reduce((acc, a) => acc + a.distance, 0) / 1000;
                            const formattedDate = new Date(date).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });

                            return (
                                <div key={date} style={{ marginBottom: '32px', position: 'relative' }}>
                                    {/* Timeline Dot */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-31px',
                                        top: '4px',
                                        width: '13px',
                                        height: '13px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        border: '3px solid #0a0a0a',
                                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>{formattedDate}</span>
                                            <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                                {getActivityIcon(dayActivities[0].type)}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>
                                            {dayDistance.toFixed(1)} km
                                        </span>
                                    </div>

                                    {dayActivities.map(activity => {
                                        const isExpanded = expandedActivityId === activity.id;

                                        return (
                                            <div
                                                key={activity.id}
                                                id={`activity-${activity.id}`}
                                                style={{
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: '16px',
                                                    marginBottom: '10px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}>
                                                {/* Header / Trigger */}
                                                <div
                                                    onClick={() => toggleActivityExpansion(activity.id)}
                                                    style={{
                                                        padding: '12px 14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s ease',
                                                        userSelect: 'none'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Navigation size={14} className="text-primary" style={{ opacity: isExpanded ? 1 : 0.6 }} />
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: isExpanded ? '600' : '400',
                                                        color: isExpanded ? 'var(--text-main)' : 'var(--text-muted)',
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {activity.name}
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={14} opacity={0.5} /> : <ChevronDown size={14} opacity={0.5} />}
                                                </div>

                                                {/* Collapsible Content */}
                                                {isExpanded && (
                                                    <div style={{
                                                        padding: '0 14px 14px 14px',
                                                    }}>
                                                        {activity.description && (
                                                            <div style={{
                                                                fontSize: '0.8rem',
                                                                color: 'var(--text-muted)',
                                                                lineHeight: '1.5',
                                                                marginBottom: activity.photos?.length ? '16px' : '0',
                                                                whiteSpace: 'pre-wrap',
                                                                paddingLeft: '14px',
                                                                borderLeft: '1px solid var(--primary)',
                                                                opacity: 0.9
                                                            }}>
                                                                {activity.description}
                                                            </div>
                                                        )}

                                                        {/* Photo Gallery Strip */}
                                                        {Array.isArray(activity.photos) && activity.photos.length > 0 && (
                                                            <div className="custom-scrollbar" style={{
                                                                display: 'flex',
                                                                gap: '10px',
                                                                overflowX: 'auto',
                                                                paddingBottom: '8px',
                                                                maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                                                                WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                                                            }}>
                                                                {activity.photos.map((photo: any, pIdx: number) => (
                                                                    <div key={pIdx} style={{
                                                                        flexShrink: 0,
                                                                        width: '140px',
                                                                        height: '90px',
                                                                        borderRadius: '10px',
                                                                        overflow: 'hidden',
                                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                                        cursor: 'pointer'
                                                                    }}>
                                                                        <img
                                                                            src={photo.url}
                                                                            alt={`${activity.name} - ${pIdx}`}
                                                                            loading="lazy"
                                                                            decoding="async"
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                transition: 'transform 0.3s ease'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                setHoveredPhotoUrl(photo.url);
                                                                                // @ts-ignore
                                                                                e.target.style.transform = 'scale(1.1)';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                setHoveredPhotoUrl(null);
                                                                                // @ts-ignore
                                                                                e.target.style.transform = 'scale(1.0)';
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (photo.location) flyTo(photo.location);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', textAlign: 'center' }}>
                    <a
                        href="https://www.strava.com/athletes/49069428"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                            textDecoration: 'none',
                            transition: 'opacity 0.2s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                    >
                        View my Strava Profile
                    </a>
                </div>
            </aside>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="glass"
                style={{
                    marginTop: '40px',
                    marginLeft: '-21px', // 1px overlap with sidebar content (20px margin + 1px)
                    width: '32px',
                    height: '48px',
                    border: '1px solid var(--border)',
                    borderLeft: 'none', // Remove left border to merge
                    borderRadius: '0 12px 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--primary)',
                    pointerEvents: 'auto',
                    // Remove left shadow to blend
                    boxShadow: '4px 0 12px rgba(0,0,0,0.2)',
                    zIndex: 1001,
                    // Small left padding to center icon visually after overlap
                    paddingLeft: '2px'
                }}
            >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
        </div>
    );
};

export default Sidebar;
