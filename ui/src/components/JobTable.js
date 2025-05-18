import React from 'react';
import { Box, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';

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

const JobTable = ({ jobs, search, setSearch }) => {
  const filteredJobs = jobs.filter(job =>
    Object.values(job).some(val =>
      val && val.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <TextField
          label="Recherche"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={filteredJobs.map((job, idx) => ({ id: idx, ...job }))}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          localeText={frFR.localeText}
          disableSelectionOnClick
          sx={{ backgroundColor: "white", borderRadius: 2 }}
        />
      </Box>
    </>
  );
};

export default JobTable; 