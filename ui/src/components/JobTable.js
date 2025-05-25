import React from 'react';
import { Box, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';

const parseFrenchDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  try {
    const months = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    
    const parts = dateStr.split(' ');
    if (parts.length !== 3) return null;
    
    const [day, month, year] = parts;
    const monthNum = months[month.toLowerCase()];
    if (!monthNum) return null;
    
    return new Date(`${year}-${monthNum}-${day}`).getTime();
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

const columns = [
  { 
    field: 'company_logo', 
    headerName: 'Logo', 
    flex: 0.5, 
    renderCell: (params) => (
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center'
      }}>
        {params.value ? (
          <img 
            src={params.value} 
            alt="logo" 
            style={{ 
              width: 40, 
              height: 40, 
              objectFit: 'contain', 
              borderRadius: 4, 
              background: '#f5f5f5',
              display: 'block',
              margin: 'auto'
            }} 
          />
        ) : (
          <span style={{ color: '#aaa' }}>Aucun</span>
        )}
      </Box>
    )
  },
  { field: 'job_title', headerName: 'Titre du poste', flex: 1 },
  { field: 'company_name', headerName: 'Entreprise', flex: 1 },
  { field: 'location', headerName: 'Lieu', flex: 1 },
  { field: 'work_type', headerName: 'Mode de travail', flex: 1 },
  { 
    field: 'application_date',
    headerName: 'Date de candidature',
    flex: 0.8,
    sortComparator: (v1, v2) => {
      const date1 = parseFrenchDate(v1);
      const date2 = parseFrenchDate(v2);
      return date1 && date2 ? date1 - date2 : 0;
    }
  },
  { 
    field: 'email_date',
    headerName: 'Date de réception',
    flex: 0.8,
    renderCell: (params) => {
      if (!params.value) return '';
      const [datePart, timePart] = params.value.split(' ');
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':').slice(0, 2);
      return `${day}/${month}/${year} ${hour}:${minute}`;
    },
    sortComparator: (v1, v2) => {
      if (!v1 || !v2) return 0;
      const date1 = new Date(v1);
      const date2 = new Date(v2);
      return date1.getTime() - date2.getTime();
    }
  }
];

const JobTable = ({ jobs, search, setSearch }) => {
  const rows = jobs.map(job => ({
    ...job,
  }));

  const filterFn = (row) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return Object.values(row).some(val =>
      val && val.toString().toLowerCase().includes(searchLower)
    );
  };

  const filteredRows = rows.filter(filterFn);

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
          rows={filteredRows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          localeText={frFR.localeText}
          disableSelectionOnClick
          initialState={{
            sorting: {
              sortModel: [{ field: 'application_date', sort: 'desc' }],
            },
          }}
          sx={{ backgroundColor: "white", borderRadius: 2 }}
        />
      </Box>
    </>
  );
};

export default JobTable; 