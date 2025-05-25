import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Snackbar, Alert, CircularProgress, Box } from '@mui/material';
import { db } from './components/firebase';
import { ref, get } from 'firebase/database';
import JobTable from './components/JobTable';
import MapSection from './components/MapSection';
import StatsSection from './components/StatsSection';
import FileUpload from './components/FileUpload';

function App() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [barParam, setBarParam] = useState('company');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch last update timestamp
        const lastUpdateRef = ref(db, 'last_update');
        const lastUpdateSnapshot = await get(lastUpdateRef);
        if (lastUpdateSnapshot.exists()) {
          setLastUpdate(lastUpdateSnapshot.val());
        }

        // Fetch jobs
        const jobsRef = ref(db, 'applications');
        const snapshot = await get(jobsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Transform the nested structure into a flat array
          const transformedJobs = Object.entries(data).flatMap(([companyId, applications]) =>
            Object.entries(applications).map(([applicationId, job]) => ({
              id: `${companyId}_${applicationId}`,
              job_title: job.job_title,
              company_name: job.company_name,
              location: job.location,
              work_type: job.work_type,
              application_date: job.application_date,
              company_logo: job.company_logo,
              email_date: job.email_date,
              last_updated: job.last_updated,
              lat: job.lat,
              lng: job.lng
            }))
          );
          setJobs(transformedJobs);
        }
      } catch (error) {
        console.error('Error loading jobs:', error);
        setError('Erreur lors du chargement des données: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Container maxWidth={false} sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Visualiseur d'offres LinkedIn
        </Typography>
        {lastUpdate && (
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Dernière mise à jour : {lastUpdate}
          </Typography>
        )}
        <Typography variant="body1" gutterBottom>
          Importez votre fichier <b>applied_jobs.json</b> pour afficher vos
          candidatures LinkedIn de façon interactive.
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <FileUpload setJobs={setJobs} setError={setError} setSnackbarOpen={setSnackbarOpen} />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <JobTable jobs={jobs} search={search} setSearch={setSearch} />
            <MapSection jobs={jobs} />
            <StatsSection jobs={jobs} barParam={barParam} setBarParam={setBarParam} />
          </>
        )}
        
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
