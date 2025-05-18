import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { db } from './firebase';
import { ref, get } from 'firebase/database';

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

const FileUpload = ({ setJobs, setError, setSnackbarOpen }) => {
  const [loading, setLoading] = useState(true);

  // Fetch jobs from Firebase on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const snapshot = await get(ref(db, 'applied_jobs'));
        if (snapshot.exists()) {
          const jobs = snapshot.val();
          if (Array.isArray(jobs)) {
            setJobs(jobs);
          } else {
            setError('Les données de Firebase ne sont pas au format attendu.');
          }
        }
      } catch (err) {
        setError('Erreur lors de la récupération depuis Firebase : ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
    // eslint-disable-next-line
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseJobsFromFile(file, setJobs, setError, setSnackbarOpen);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      {loading ? (
        <>
          <CircularProgress size={32} />
          <span style={{ marginLeft: 8 }}>Données en cours de chargement depuis Firebase...</span>
        </>
      ) : (
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
        >
          Importer JSON
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={handleFileChange}
          />
        </Button>
      )}
    </Box>
  );
};

export default FileUpload; 