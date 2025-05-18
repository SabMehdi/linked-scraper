import React from 'react';
import { Typography, Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix default icon issue for leaflet in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapSection = ({ jobs }) => {
  const locations = jobs.filter(job => job.lat && job.lng);

  return (
    <>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Carte des localisations
      </Typography>
      <Box sx={{ height: 800, width: "100%", mb: 2 }}>
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((job, idx) => (
            <Marker key={idx} position={[job.lat, job.lng]}>
              <Popup>
                <b>{job.title}</b>
                <br />
                {job.company}
                <br />
                {job.location}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </>
  );
};

export default MapSection; 