import React from 'react';
import { Typography, Box, Paper, TextField } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const StatsSection = ({ jobs, barParam, setBarParam }) => {
  return (
    <>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Statistiques
      </Typography>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          mb: 4,
        }}
      >
        {/* Applications per company */}
        <Paper sx={{ flex: 1, minWidth: 300, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Analyser par&nbsp;
            </Typography>
            <TextField
              select
              size="small"
              value={barParam}
              onChange={(e) => setBarParam(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 120 }}
            >
              <option value="company">Entreprise</option>
              <option value="work_style">Mode de travail</option>
              <option value="location">Lieu</option>
            </TextField>
          </Box>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(
                jobs.reduce((acc, job) => {
                  const key = job[barParam] || "Inconnu";
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {})
              ).map(([key, count]) => ({ key, count }))}
            >
              <XAxis dataKey="key" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
        {/* Applications by status */}
        <Paper sx={{ flex: 1, minWidth: 300, p: 2 }}>
          <Typography variant="subtitle1">Candidatures par statut</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={Object.entries(
                  jobs.reduce((acc, job) => {
                    acc[job.status] = (acc[job.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, value]) => ({ name: status, value }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#1976d2"
                label
              >
                {["#1976d2", "#388e3c", "#fbc02d", "#d32f2f", "#7b1fa2"].map(
                  (color, idx) => (
                    <Cell key={idx} fill={color} />
                  )
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </>
  );
};

export default StatsSection; 