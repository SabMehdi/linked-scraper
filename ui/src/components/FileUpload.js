import React, { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ setJobs, setError, setSnackbarOpen }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onabort = () => setError("La lecture du fichier a été annulée");
    reader.onerror = () => setError("Erreur lors de la lecture du fichier");
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.applications) {
          throw new Error("Format de fichier invalide");
        }

        // Transform the nested structure into a flat array
        const transformedJobs = Object.entries(data.applications).flatMap(([companyId, applications]) =>
          Object.entries(applications).map(([applicationId, job]) => ({
            id: `${companyId}_${applicationId}`,
            title: job.job_title,
            company: job.company_name,
            location: job.location,
            work_style: job.work_type,
            status_time: job.application_date,
            logo: job.company_logo,
            status: "Postulé", // Default status since it's not in the new structure
            application_date: new Date(job.email_date).toLocaleDateString('fr-FR'),
            last_updated: new Date(job.last_updated).toLocaleDateString('fr-FR')
          }))
        );

        setJobs(transformedJobs);
        setSnackbarOpen(true);
        setError('');
      } catch (error) {
        setError("Erreur lors du traitement du fichier : " + error.message);
      }
    };

    reader.readAsText(file);
  }, [setJobs, setError, setSnackbarOpen]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed #ccc',
        borderRadius: 2,
        p: 3,
        mb: 3,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': {
          borderColor: '#1976d2',
          backgroundColor: '#f5f5f5'
        }
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <Typography>Déposez le fichier ici...</Typography>
      ) : (
        <Typography>
          Glissez et déposez votre fichier ici, ou cliquez pour sélectionner
        </Typography>
      )}
      <Button variant="contained" sx={{ mt: 2 }}>
        Sélectionner un fichier
      </Button>
    </Box>
  );
};

export default FileUpload; 