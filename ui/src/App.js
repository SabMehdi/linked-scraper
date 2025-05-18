import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Paper, Snackbar, Alert, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue for leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Geocode a location string to lat/lng using Nominatim
async function geocodeLocation(location) {
  if (!location) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {}
  return null;
}

function parseJobsFromFile(file, setJobs, setError, setSnackbarOpen) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jobs = JSON.parse(e.target.result);
      if (!Array.isArray(jobs)) throw new Error('Format JSON invalide');
      setJobs(jobs);
      setSnackbarOpen(true);
    } catch (err) {
      setError('Erreur lors de l\'importation du fichier : ' + err.message);
    }
  };
  reader.readAsText(file);
}

const columns = [
  { field: 'logo', headerName: 'Logo', flex: 0.5, renderCell: (params) => (
    params.value ? (
      <img src={params.value} alt="logo" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, background: '#f5f5f5' }} />
    ) : (
      <span style={{ color: '#aaa' }}>Aucun</span>
    )
  ) },
  { field: 'title', headerName: 'Titre du poste', flex: 1 },
  { field: 'company', headerName: 'Entreprise', flex: 1 },
  { field: 'location', headerName: 'Lieu', flex: 1 },
  { field: 'work_style', headerName: 'Mode de travail', flex: 1 },
  { field: 'status', headerName: 'Statut', flex: 1 },
  { field: 'status_time', headerName: 'Date de candidature', flex: 1 },
  { field: 'link', headerName: 'Lien', flex: 1, renderCell: (params) => (
    <a href={params.value} target="_blank" rel="noopener noreferrer">Voir</a>
  ) },
];

function App() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseJobsFromFile(file, setJobs, setError, setSnackbarOpen);
    }
  };

  const filteredJobs = jobs.filter(job =>
    Object.values(job).some(val =>
      val && val.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  // Geocode all job locations when jobs change
  const locations = jobs.filter(job => job.lat && job.lng);

  return (
    <Container maxWidth={false} sx={{ mt: 4,width:'100vw' }}>
      <Paper elevation={3} sx={{ p: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom>Visualiseur d'offres LinkedIn</Typography>
        <Typography variant="body1" gutterBottom>
          Importez votre fichier <b>applied_jobs.json</b> pour afficher vos candidatures LinkedIn de façon interactive.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
          >
            Importer JSON
            <input type="file" accept="application/json" hidden onChange={handleFileChange} />
          </Button>
          <TextField
            label="Recherche"
            variant="outlined"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 200 }}
          />
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredJobs.map((job, idx) => ({ id: idx, ...job }))}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            localeText={frFR.localeText}
            disableSelectionOnClick
            sx={{ backgroundColor: 'white', borderRadius: 2 }}
          />
        </Box>
        {/* Map Section */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Carte des localisations</Typography>
        <Box sx={{ height: 800, width: '100%', mb: 2 }}>
          <MapContainer center={[48.8566, 2.3522]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((job, idx) => (
              <Marker key={idx} position={[job.lat, job.lng]}>
                <Popup>
                <b>{job.title}</b><br />
                {job.company}<br />
                {job.location}
              </Popup>
            </Marker>
          ))}
          </MapContainer>
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            Fichier importé avec succès !
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default App;
