// Initialize map centered on Kyrgyzstan
const map = L.map('map').setView([42.0, 76.5], 7);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);

// Optional: Add OpenTopoMap for terrain view
const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    maxZoom: 17
});

// Layer control
const baseMaps = {
    "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map),
    "Terrain": topoLayer
};

L.control.layers(baseMaps).addTo(map);

// Category colors for markers
const categoryColors = {
    urbex: '#e74c3c',
    monument: '#9b59b6',
    hike: '#27ae60',
    food: '#f39c12',
    worth_a_stop: '#3498db',
    future: '#95a5a6'
};

// Create custom marker icons
function createMarkerIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8]
    });
}

// Store GPX layers for elevation profile interaction
const gpxLayers = {};
let currentElevationControl = null;

// Load GPX tracks
function loadGPXTracks(tracks) {
    tracks.forEach(track => {
        const isCarRoute = track.routeType === 'car';

        // Different styles for car vs hike routes
        const polylineOptions = isCarRoute ? {
            color: track.color,
            weight: 4,
            opacity: 0.9,
            dashArray: '10, 10',
            lineCap: 'butt'
        } : {
            color: track.color,
            weight: 4,
            opacity: 0.8,
            lineCap: 'round'
        };

        const gpxLayer = new L.GPX(track.file, {
            async: true,
            marker_options: {
                startIconUrl: null,
                endIconUrl: null,
                shadowUrl: null
            },
            polyline_options: polylineOptions
        });

        gpxLayer.on('loaded', function(e) {
            const gpx = e.target;
            gpxLayers[track.id] = gpx;

            const routeTypeLabel = isCarRoute ? 'Car' : 'Hike';
            const routeTypeClass = isCarRoute ? 'car' : 'hike';

            // Bind popup with track info
            gpx.bindPopup(`
                <div class="gpx-popup">
                    <div class="popup-title">${track.name}</div>
                    <span class="popup-route-type ${routeTypeClass}">${routeTypeLabel}</span>
                    <div class="popup-stats">
                        <span>${track.distance}</span>
                        <span>${track.time}</span>
                        <span>${track.type}</span>
                    </div>
                    <p style="margin-top: 8px; font-size: 12px; color: #666;">
                        Click the track to see elevation profile
                    </p>
                </div>
            `);

            // Add click handler for elevation profile
            gpx.on('click', function() {
                showElevationProfile(track, gpx);
            });
        });

        gpxLayer.on('error', function(e) {
            console.error('Error loading GPX:', track.file, e);
        });

        gpxLayer.addTo(map);
    });
}

// Show elevation profile for a GPX track
function showElevationProfile(track, gpxLayer) {
    const container = document.getElementById('elevation-container');
    const elevationDiv = document.getElementById('elevation');

    // Clear previous elevation
    elevationDiv.innerHTML = '';

    // Remove close button if exists
    const existingClose = container.querySelector('.elevation-close');
    if (existingClose) existingClose.remove();

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'elevation-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        container.classList.remove('visible');
        if (currentElevationControl) {
            map.removeControl(currentElevationControl);
            currentElevationControl = null;
        }
    };
    container.appendChild(closeBtn);

    // Create elevation control
    if (currentElevationControl) {
        map.removeControl(currentElevationControl);
    }

    currentElevationControl = L.control.elevation({
        position: "bottomleft",
        theme: "lightblue-theme",
        width: window.innerWidth - 40,
        height: 160,
        margins: { top: 10, right: 20, bottom: 30, left: 50 },
        detached: true,
        elevationDiv: "#elevation",
        followMarker: true,
        imperial: false,
        reverseCoords: false,
        summary: "inline",
        downloadLink: false
    });

    currentElevationControl.addTo(map);

    // Load the GPX file into elevation control
    currentElevationControl.load(track.file);

    // Show container
    container.classList.add('visible');
}

// Load location markers
function loadLocations(locations) {
    locations.forEach(loc => {
        const color = categoryColors[loc.category] || '#3498db';
        const marker = L.marker(loc.coordinates, {
            icon: createMarkerIcon(color)
        });

        const categoryLabel = loc.category.replace('_', ' ');

        marker.bindPopup(`
            <div class="popup-title">${loc.name}</div>
            <span class="popup-category ${loc.category}">${categoryLabel}</span>
            <p class="popup-description">${loc.description}</p>
            <a href="${loc.link}" target="_blank" class="popup-link">Open in Google Maps</a>
        `);

        marker.addTo(map);
    });
}

// Fetch and load data
fetch('data/locations.json')
    .then(response => response.json())
    .then(data => {
        // Load GPX tracks
        loadGPXTracks(data.gpxTracks);

        // Load location markers
        loadLocations(data.locations);
    })
    .catch(error => {
        console.error('Error loading locations:', error);
    });

// Handle window resize for elevation chart
window.addEventListener('resize', () => {
    if (currentElevationControl) {
        // Re-create on resize
        const container = document.getElementById('elevation-container');
        if (container.classList.contains('visible')) {
            currentElevationControl.options.width = window.innerWidth - 40;
        }
    }
});
