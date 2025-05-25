import React from 'react';
import { Typography, Box, Paper, TextField } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const parseFrenchDate = (dateStr) => {
  if (!dateStr) return null;
  const months = {
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
  };
  
  const [day, month, year] = dateStr.split(' ');
  const monthNum = months[month.toLowerCase()];
  if (!monthNum) return null;
  
  return new Date(`${year}-${monthNum}-${day}`).getTime();
};

const PARAM_MAPPING = {
  application_date: 'application_date',
  company_name: 'company_name',
  email_date: 'email_date',
  email_hour: 'email_date',
  location: 'location'
};

const PARAM_LABELS = {
  application_date: 'Date de candidature',
  company_name: 'Entreprise',
  email_hour: 'Heure de réception',
  location: 'Lieu'
};

const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0097a7', '#ed6c02', '#9c27b0'];

const StatsSection = ({ jobs, barParam, setBarParam }) => {
  // Calculate statistics based on the selected parameter
  const getBarChartData = () => {
    const counts = jobs.reduce((acc, job) => {
      let key;
      if (barParam === 'email_date') {
        // Format email_date to show only the date part
        const [datePart] = job[PARAM_MAPPING[barParam]].split(' ');
        const [year, month, day] = datePart.split('-');
        key = `${day}/${month}/${year}`;
      } else if (barParam === 'email_hour') {
        // Extract hour from email_date for time analysis
        const [, timePart] = job[PARAM_MAPPING[barParam]].split(' ');
        const [hour] = timePart.split(':');
        key = `${hour}h`;
      } else if (barParam === 'application_date') {
        // application_date is already in French format
        key = job[PARAM_MAPPING[barParam]];
      } else {
        key = job[PARAM_MAPPING[barParam]] || 'Non spécifié';
      }
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    let entries = Object.entries(counts).map(([key, count]) => ({ name: key, count }));

    // Special sorting for different parameters
    if (barParam === 'email_hour') {
      // Sort by hour numerically
      entries.sort((a, b) => {
        const hourA = parseInt(a.name);
        const hourB = parseInt(b.name);
        return hourA - hourB;
      });
    } else if (barParam === 'email_date') {
      // Sort by date
      entries.sort((a, b) => {
        const [dayA, monthA, yearA] = a.name.split('/');
        const [dayB, monthB, yearB] = b.name.split('/');
        return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
      });
    } else if (barParam === 'application_date') {
      entries.sort((a, b) => parseFrenchDate(b.name) - parseFrenchDate(a.name));
    } else {
      // Default sorting by count
      entries.sort((a, b) => b.count - a.count);
    }

    return entries;
  };

  // Calculate application dates distribution
  const getTimelineData = () => {
    const counts = jobs.reduce((acc, job) => {
      const month = job.application_date.split('/').slice(1).join('/');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
      });
  };

  const barChartData = getBarChartData();
  const timelineData = getTimelineData();

  return (
    <>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Statistiques
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mb: 4 }}>
        {/* Parameter-based statistics */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Analyser par
            </Typography>
            <TextField
              select
              size="small"
              value={barParam}
              onChange={(e) => setBarParam(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 120 }}
            >
              {Object.entries(PARAM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </TextField>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                fontSize={12}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </>
  );
};

export default StatsSection; 