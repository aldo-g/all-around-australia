import React, { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents, Polyline, CircleMarker, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { useUI } from '../contexts/UIContext';

// @ts-ignore
import activitiesData from '../data/strava-activities.json' with { type: 'json' };

const activities = activitiesData as any[];

// Custom camera icon for photos
const cameraIcon = L.divIcon({
    html: renderToString(<div style={{
        background: 'var(--primary)',
        color: '#fff',
        padding: '6px',
        borderRadius: '50%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}><Camera size={14} strokeWidth={3} /></div>),
    className: 'camera-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
});

const PhotoCarousel: React.FC<{ photos: any[], location: [number, number] }> = ({ photos, location }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { flyTo } = useUI();

    if (!photos || photos.length === 0) return null;

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <div style={{
            padding: '4px',
            background: '#1a1d23',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            width: '240px'
        }}>
            <img
                src={photos[currentIndex].url}
                alt="On the road"
                style={{
                    width: '240px',
                    borderRadius: '6px',
                    display: 'block',
                    cursor: 'pointer'
                }}
                onClick={() => flyTo(location)}
            />

            {photos.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            color: '#fff',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={next}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            color: '#fff',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                    <div style={{
                        position: 'absolute',
                        bottom: photos[currentIndex].caption ? '32px' : '12px',
                        left: '0',
                        right: '0',
                        textAlign: 'center',
                        fontSize: '0.65rem',
                        color: '#fff',
                        textShadow: '0 1px 4px rgba(0,0,0,1)',
                        fontWeight: '600'
                    }}>
                        {currentIndex + 1} / {photos.length}
                    </div>
                </>
            )}

            {photos[currentIndex].caption && (
                <div style={{
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    color: '#fff',
                    lineHeight: '1.4',
                    background: 'rgba(0,0,0,0.3)',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {photos[currentIndex].caption}
                </div>
            )}
        </div>
    );
};

// Initial map view constants
const INITIAL_CENTER: [number, number] = [-27.0, 133.0];
const MIN_ZOOM = 5;
const MAX_ZOOM = 12;

// Australia bounds for locking the view
const australiaBounds = L.latLngBounds(
    L.latLng(-44.0, 112.0), // Southwest
    L.latLng(-10.0, 154.0)  // Northeast
);

const MapController: React.FC<{ onZoom: (zoom: number) => void }> = ({ onZoom }) => {
    const { mapTarget } = useUI();
    const map = useMapEvents({
        zoomend: () => {
            const currentZoom = map.getZoom();
            onZoom(currentZoom);
            if (currentZoom <= MIN_ZOOM) {
                map.dragging.disable();
                map.setMaxBounds(australiaBounds);
                map.setView(INITIAL_CENTER, MIN_ZOOM, { animate: true });
            } else {
                map.dragging.enable();
                map.setMaxBounds(undefined);
            }
        }
    });

    React.useEffect(() => {
        if (mapTarget) {
            map.flyTo(mapTarget, 11, {
                duration: 2,
                easeLinearity: 0.25
            });
        }
    }, [mapTarget, map]);

    React.useEffect(() => {
        if (map.getZoom() <= MIN_ZOOM) {
            map.dragging.disable();
            map.setMaxBounds(australiaBounds);
        }
    }, [map]);

    return null;
};

const MapDisplay: React.FC = () => {
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const { hoveredPhotoUrl, flyTo, toggleActivityExpansion, setSidebarOpen } = useUI();
    const [hoveredActivityId, setHoveredActivityId] = useState<number | null>(null);

    // Group activities by date for segmentation
    const groupedActivities = (activities || []).reduce((groups: { [key: string]: any[] }, activity: any) => {
        const date = activity.start_date_local?.split('T')[0];
        if (date) {
            if (!groups[date]) groups[date] = [];
            groups[date].push(activity);
        }
        return groups;
    }, {});

    const sortedDates = Object.keys(groupedActivities).sort((a, b) => a.localeCompare(b));

    // Group all photos by location to handle overlaps
    const photosByLocation = activities.reduce((acc: { [key: string]: any[] }, activity: any) => {
        (activity.photos || []).forEach((photo: any) => {
            if (photo.location) {
                // Group by coarser coordinates (4 decimal places ~11m) 
                const key = `${photo.location[0].toFixed(4)},${photo.location[1].toFixed(4)}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push({ ...photo, activityId: activity.id });
            }
        });
        return acc;
    }, {});

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <MapContainer
                center={INITIAL_CENTER}
                zoom={MIN_ZOOM}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                zoomSnap={1}
                zoomDelta={1}
                maxBounds={australiaBounds}
                maxBoundsViscosity={1.0}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: '100%', width: '100%', background: '#0c0f14' }}
            >
                <MapController onZoom={setZoom} />

                <TileLayer
                    attribution='Tiles &copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
                    detectRetina={true}
                    maxNativeZoom={10}
                />

                {/* Map Segmentation: Consistent gold with daily markers */}
                {sortedDates.map((date) => {
                    const dayActivities = groupedActivities[date];
                    const activeColor = '#FFC72C'; // Australian Gold

                    return (
                        <React.Fragment key={date}>
                            {dayActivities.map((activity, actIndex) => {
                                const isHovered = hoveredActivityId === activity.id;

                                return activity.coordinates && (
                                    <Polyline
                                        key={`${activity.id}-${actIndex}`}
                                        positions={activity.coordinates}
                                        eventHandlers={{
                                            click: (e) => {
                                                L.DomEvent.stopPropagation(e);
                                                toggleActivityExpansion(activity.id);
                                                setSidebarOpen(true);
                                            },
                                            mouseover: (e) => {
                                                setHoveredActivityId(activity.id);
                                                // @ts-ignore
                                                e.target.bringToFront();
                                            },
                                            mouseout: () => {
                                                setHoveredActivityId(null);
                                            }
                                        }}
                                        pathOptions={{
                                            color: isHovered ? '#FFE082' : activeColor, // Lighter gold on hover
                                            weight: isHovered ? 6 : 4,
                                            opacity: isHovered ? 1.0 : 0.9,
                                            lineJoin: 'round',
                                            lineCap: 'round',
                                            dashArray: isHovered ? undefined : undefined // Could add dash animation if desired
                                        }}
                                    />
                                );
                            })}

                            {/* Daily Milestones: Start and End markers for the day */}
                            {dayActivities.length > 0 && (
                                <>
                                    {dayActivities[0].coordinates?.length > 0 && (
                                        <CircleMarker
                                            center={dayActivities[0].coordinates[0]}
                                            radius={5}
                                            pathOptions={{
                                                fillColor: activeColor,
                                                fillOpacity: 1,
                                                color: '#fff',
                                                weight: 2
                                            }}
                                        />
                                    )}
                                    {dayActivities[dayActivities.length - 1].coordinates?.length > 0 && (
                                        <CircleMarker
                                            center={dayActivities[dayActivities.length - 1].coordinates[dayActivities[dayActivities.length - 1].coordinates.length - 1]}
                                            radius={5}
                                            pathOptions={{
                                                fillColor: activeColor,
                                                fillOpacity: 1,
                                                color: '#fff',
                                                weight: 2
                                            }}
                                        />
                                    )}
                                </>
                            )}

                            {/* Photo Markers: Handled below the date loop to manage overlaps */}
                        </React.Fragment>
                    );
                })}

                {/* Photo Markers with Carousel for overlaps */}
                {Object.values(photosByLocation).map((locationGroup: any[], groupIdx) => {
                    const firstPhoto = locationGroup[0];
                    const isGroupHovered = locationGroup.some(p => p.url === hoveredPhotoUrl);

                    // Show if any photo in group is visible based on zoom OR if any is hovered
                    const isVisible = zoom > 9 || isGroupHovered;

                    if (!isVisible) return null;

                    return (
                        <Marker
                            key={`group-${groupIdx}`}
                            position={firstPhoto.location}
                            eventHandlers={{
                                click: () => {
                                    flyTo(firstPhoto.location);
                                },
                            }}
                            icon={isGroupHovered ? L.divIcon({
                                html: renderToString(<div style={{
                                    background: '#fff',
                                    color: 'var(--primary)',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 15px var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--primary)',
                                    transition: 'all 0.2s ease'
                                }}><Camera size={18} strokeWidth={3} /></div>),
                                className: 'camera-marker-hovered',
                                iconSize: [34, 34],
                                iconAnchor: [17, 17]
                            }) : cameraIcon}
                            zIndexOffset={isGroupHovered ? 1000 : 0}
                        >
                            <Popup className="photo-popup" closeButton={false}>
                                <PhotoCarousel photos={locationGroup} location={firstPhoto.location} />
                            </Popup>
                        </Marker>
                    );
                })}

                <ZoomControl position="bottomright" />
            </MapContainer>
        </div>
    );
};

export default MapDisplay;
