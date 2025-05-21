import * as React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';



// Sample data for functionalities and benefits
// In a real application, this data might come from an API or a configuration file.
const systemFeatures = [
  {
    id: 'auth',
    title: 'Secure User Authentication',
    description: 'Robust authentication system to ensure only authorized users can access the system, featuring password encryption and session management.',
    benefits: ['Enhanced Security', 'Data Protection', 'User Privacy'],
    icon: '🛡️', // Example: using an emoji as a placeholder for an icon
  },
  {
    id: 'data-processing',
    title: 'Advanced Data Processing',
    description: 'Efficiently processes large volumes of data, transforming raw information into actionable insights with high accuracy and speed.',
    benefits: ['Scalability', 'Real-time Insights', 'Improved Decision Making'],
    icon: '⚙️',
  },
  {
    id: 'reporting',
    title: 'Comprehensive Reporting',
    description: 'Generate detailed and customizable reports on various aspects of the system, providing clear visibility into performance and trends.',
    benefits: ['Data-driven Strategy', 'Performance Tracking', 'Transparency'],
    icon: '📊',
  },
  {
    id: 'integration',
    title: 'Seamless Integrations',
    description: 'Easily connect with other essential tools and services through flexible APIs and pre-built connectors, streamlining your workflows.',
    benefits: ['Workflow Automation', 'Extensibility', 'Unified Ecosystem'],
    icon: '🔗',
  },
  {
    id: 'user-management',
    title: 'Intuitive User Management',
    description: 'Manage users, roles, and permissions with an easy-to-use interface, ensuring proper access control across the system.',
    benefits: ['Simplified Administration', 'Granular Control', 'Role-based Access'],
    icon: '👥',
  },
  {
    id: 'support',
    title: 'Dedicated Support',
    description: 'Access to comprehensive documentation and a responsive support team to help you get the most out of the system.',
    benefits: ['Quick Resolutions', 'Expert Assistance', 'Continuous Learning'],
    icon: '💬',
  },
];

function Functions() {
  return (
    <Container sx={{ py: { xs: 4, sm: 6, md: 8 } }} id="functions">
      <Typography
        variant="h3"
        component="h2"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'medium' }}
      >
        System Functionalities & Benefits
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: { xs: 4, sm: 6 } }}>
        Explore the core features and advantages our system offers to streamline your operations and boost productivity.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 3 },
        }}
      >
        {systemFeatures.map((feature) => (
          <Card
            key={feature.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%', // Ensures cards in the same row have similar height if content varies
              boxShadow: 3, // Subtle shadow
              '&:hover': {
                boxShadow: 6, // Enhanced shadow on hover
              },
            }}
          >
            
            <CardContent sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              pt: 3, // Add some padding top
              px: 2,
              pb: 1, 
            }}>
              {feature.icon && (
                <Typography component="div" sx={{ fontSize: '3.5rem', mb: 2, lineHeight: 1 }}>
                  {feature.icon}
                </Typography>
              )}
              <Typography variant="h5" component="h3" sx={{ fontWeight: 'medium', mb: 1 }}>
                {feature.title}
             
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {feature.description}
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                Key Benefits:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {feature.benefits.map((benefit) => (
                  <MuiChip key={benefit} label={benefit} size="small" variant="outlined" color="primary" />
                ))}
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    </Container>
  );
}

Functions.propTypes = {
  // If you were to pass props to this component, you would define their types here.
  // For example:
  // title: PropTypes.string,
};

export default Functions;
