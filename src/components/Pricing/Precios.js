import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import StarIcon from '@mui/icons-material/StarBorder';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const tiers = [
  {
    title: 'Package Deal',
    price: 'Consult',
    description: [
      'Ideal for specific projects',
      'Defined scope of work',
      'One-time payment',
      'Dedicated support for project duration',
    ],
    buttonText: 'Get a Quote',
    buttonVariant: 'outlined',
  },
  {
    title: 'Monthly Plans',
    subheader: 'Most Popular',
    price: 'Custom',
    description: [
      'Perfect for ongoing needs',
      'Flexible feature sets',
      'Priority support',
      'Regular updates & new features',
      'Scalable as you grow',
    ],
    buttonText: 'Explore Plans',
    buttonVariant: 'contained',
  },
  {
    title: 'On Demand',
    price: 'Pay/Use',
    description: [
      'Pay only for what you use',
      'No long-term commitment',
      'Access to core features',
      'Standard support',
    ],
    buttonText: 'Learn More',
    buttonVariant: 'outlined',
  },
];

export default function Precios() {
  return (
    <Container
      id="pricing"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Box
        sx={{
          width: { sm: '100%', md: '60%' },
          textAlign: { sm: 'left', md: 'center' },
        }}
      >
        <Typography component="h2" variant="h4" color="text.primary" gutterBottom>
          Pricing Plans
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose the plan that best fits your business needs. We offer flexible options to get you started and scale with your growth.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 3, md: 4 },
          width: '100%',
        }}
      >
        {tiers.map((tier) => (
          <Card
            key={tier.title}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 1, // Add some padding inside the card before CardHeader/Content
              border: tier.subheader ? '2px solid' : '1px solid',
              borderColor: tier.subheader ? 'primary.main' : 'grey.300',
              boxShadow: tier.subheader ? 6 : 2,
              height: '100%', // Ensure cards in the same row have similar height
            }}
          >
            <CardHeader
              title={tier.title}
              subheader={tier.subheader}
              titleTypographyProps={{ align: 'center', variant: 'h5', component: 'h3' }}
              subheaderTypographyProps={{
                align: 'center',
                color: 'primary.main',
                fontWeight: 'bold',
              }}
              action={tier.subheader ? <StarIcon.default /> : null}
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[700],
              }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'baseline',
                  mb: 2,
                }}
              >
                <Typography component="h2" variant="h4" color="text.primary">
                  {tier.price}
                </Typography>
                {/* <Typography variant="h6" color="text.secondary"> /mo </Typography> */}
              </Box>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {tier.description.map((line) => (
                  <Typography
                    component="li"
                    variant="subtitle1"
                    align="left" // Align text to the left for better readability
                    key={line}
                    sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                  >
                    <CheckCircleOutlineIcon.default sx={{ color: 'success.main', mr: 1 }} />
                    {line}
                  </Typography>
                ))}
              </ul>
            </CardContent>
            <CardActions>
              <Button fullWidth variant={tier.buttonVariant} color="primary">
                {tier.buttonText}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Container>
  );
}