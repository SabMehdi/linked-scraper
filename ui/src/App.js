import React, { useState } from 'react';
import { Container, Typography, Paper, Snackbar, Alert } from '@mui/material';
import JobTable from './components/JobTable';
import MapSection from './components/MapSection';
import StatsSection from './components/StatsSection';
import FileUpload from './components/FileUpload';

function App() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [barParam, setBarParam] = useState('company');

  return (
    <Container maxWidth={false} sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Visualiseur d'offres LinkedIn
        </Typography>
        <Typography variant="body1" gutterBottom>
          Importez votre fichier <b>applied_jobs.json</b> pour afficher vos
          candidatures LinkedIn de façon interactive.
        </Typography>
        <FileUpload setJobs={setJobs} setError={setError} setSnackbarOpen={setSnackbarOpen} />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <JobTable jobs={jobs} search={search} setSearch={setSearch} />
        <MapSection jobs={jobs} />
        <StatsSection jobs={jobs} barParam={barParam} setBarParam={setBarParam} />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Fichier importé avec succès !
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default App;
