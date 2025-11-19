import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DeviceMap = ({ devices }) => {
  // Filter devices that have location data
  const devicesWithLocation = devices.filter(
    (device) => device.latitude && device.longitude
  );

  // Default center to India (approximate center)
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  // If we have devices, calculate the center
  let center = defaultCenter;
  let zoom = defaultZoom;

  if (devicesWithLocation.length > 0) {
    // Calculate average lat/lng for center
    const avgLat = devicesWithLocation.reduce((sum, d) => sum + parseFloat(d.latitude), 0) / devicesWithLocation.length;
    const avgLng = devicesWithLocation.reduce((sum, d) => sum + parseFloat(d.longitude), 0) / devicesWithLocation.length;
    center = [avgLat, avgLng];
    
    // Adjust zoom based on number of devices
    if (devicesWithLocation.length === 1) {
      zoom = 12;
    } else if (devicesWithLocation.length <= 3) {
      zoom = 8;
    } else {
      zoom = 6;
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'offline':
        return '#ef4444';
      case 'error':
        return '#f59e0b';
      case 'maintenance':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const createCustomIcon = (status) => {
    const color = getStatusColor(status);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          border: 2px solid white;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        borderRadius: '8px', 
        overflow: 'hidden', 
        border: '1px solid #e5e7eb',
        height: '600px'
      }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {devicesWithLocation.map((device) => (
            <Marker
              key={device.id}
              position={[parseFloat(device.latitude), parseFloat(device.longitude)]}
              icon={createCustomIcon(device.status)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                    {device.name || `Device ${device.id}`}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Status:</strong>{' '}
                      <span style={{ color: getStatusColor(device.status) }}>
                        {device.status}
                      </span>
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Serial:</strong> {device.serialNumber}
                    </p>
                    {device.location && (
                      <p style={{ margin: '4px 0' }}>
                        <strong>Location:</strong> {device.location}
                      </p>
                    )}
                    <p style={{ margin: '4px 0' }}>
                      <strong>Coordinates:</strong><br />
                      {parseFloat(device.latitude).toFixed(6)}, {parseFloat(device.longitude).toFixed(6)}
                    </p>
                    {device.lastSeenAt && (
                      <p style={{ margin: '4px 0' }}>
                        <strong>Last Seen:</strong><br />
                        {new Date(device.lastSeenAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        padding: '12px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '6px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong>Devices on Map:</strong> {devicesWithLocation.length} of {devices.length} devices
        {devicesWithLocation.length === 0 && (
          <span style={{ marginLeft: '8px', color: '#f59e0b' }}>
            (No devices with location data)
          </span>
        )}
      </div>
    </div>
  );
};

DeviceMap.propTypes = {
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string,
      serialNumber: PropTypes.string,
      status: PropTypes.string,
      location: PropTypes.string,
      latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      lastSeenAt: PropTypes.string,
    })
  ).isRequired,
};

export default DeviceMap;
