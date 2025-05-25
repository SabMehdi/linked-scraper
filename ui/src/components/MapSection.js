import React, { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
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
  const [geolocatedJobs, setGeolocatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, preGeocoded: 0, newlyGeocoded: 0, failed: 0 });

  useEffect(() => {
    const geocodeLocation = async (location) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
        );
        const data = await response.json();
        if (data && data[0]) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
        }
        return null;
      } catch (error) {
        console.error('Error geocoding location:', error);
        return null;
      }
    };

    const processJobs = async () => {

      const jobsToGeocode = [];
      const preGeocodedJobs = [];
      const stats = { total: jobs.length, preGeocoded: 0, newlyGeocoded: 0, failed: 0 };

      // First, separate jobs that already have coordinates
      jobs.forEach((job, index) => {

        // Check if coordinates exist and are valid
        const hasValidLat = job.lat !== undefined && job.lat !== null && !isNaN(Number(job.lat));
        const hasValidLng = job.lng !== undefined && job.lng !== null && !isNaN(Number(job.lng));
        
    
        if (hasValidLat && hasValidLng) {
          const lat = Number(job.lat);
          const lng = Number(job.lng);
          
          // Additional validation for coordinate ranges
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            preGeocodedJobs.push({
              ...job,
              coordinates: { lat, lng }
            });
            stats.preGeocoded++;
          } else {
            jobsToGeocode.push(job);
          }
        } else {
          jobsToGeocode.push(job);
        }
      });
      // Then geocode the remaining unique locations
      const uniqueLocations = [...new Set(jobsToGeocode.map(job => job.location))];
      
      const locationCache = {};

      for (const location of uniqueLocations) {
        if (location) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          locationCache[location] = await geocodeLocation(location);
        }
      }

      // Map the geocoded locations back to jobs
      const newlyGeocodedJobs = jobsToGeocode.map(job => {
        const coordinates = job.location ? locationCache[job.location] : null;
        if (coordinates) {
          stats.newlyGeocoded++;
        } else {
          stats.failed++;
        }
        return {
          ...job,
          coordinates
        };
      }).filter(job => job.coordinates !== null);

      // Combine pre-geocoded and newly geocoded jobs
      const allGeocodedJobs = [...preGeocodedJobs, ...newlyGeocodedJobs];
      
      setStats(stats);
      setGeolocatedJobs(allGeocodedJobs);
      setLoading(false);
    };

    if (jobs.length > 0) {
      processJobs();
    }
  }, [jobs]);

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          Géolocalisation des offres en cours...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Carte des localisations
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Total des offres: {stats.total} | 
        Pré-géocodées: {stats.preGeocoded} | 
        Nouvellement géocodées: {stats.newlyGeocoded} | 
        Non localisées: {stats.failed}
      </Typography>
      <Box sx={{ height: 800, width: "100%", mb: 2 }}>
        <MapContainer
          center={[46.603354, 1.888334]} // Center of France
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geolocatedJobs.map((job, idx) => (
            <Marker 
              key={`${job.company_name}-${job.email_date}`}
              position={[job.coordinates.lat, job.coordinates.lng]}
            >
              <Popup>
                <b>{job.job_title}</b>
                <br />
                {job.company_name}
                <br />
                {job.location}
                <br />
                <small>{job.application_date}</small>
                {job.work_type && (
                  <>
                    <br />
                    <small>Type: {job.work_type}</small>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </>
  );
};

export default MapSection; 