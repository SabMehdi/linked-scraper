import React from 'react';
import { Box, Button, TextField } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

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
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseJobsFromFile(file, setJobs, setError, setSnackbarOpen);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
    </Box>
  );
};

export default FileUpload; 