import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Tabs, 
  Tab, 
  Box, 
  IconButton,
  Chip
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import CloseIcon from '@mui/icons-material/Close';

// Correct relative imports
import DeploymentForm from './components/DeploymentForm';
import DeploymentsList from './components/DeploymentsList';
import './DeploymentApp.css'; 

// API Base URL
const API_BASE = import.meta?.env?.VITE_API_URL || '';

export default function DeploymentApp() {
  const [activeTab, setActiveTab] = useState(0); // 0 for 'new', 1 for 'list'
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Auth State
  const [githubLoggedIn, setGithubLoggedIn] = useState(false);
  const [githubUser, setGithubUser] = useState('');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // Login Form State
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/check-github-session`, { withCredentials: true });
        if (res.data.authenticated && res.data.username) {
          setGithubLoggedIn(true);
          setGithubUser(res.data.username);
        }
      } catch (err) {
        console.log('No active GitHub session');
      }
    };
    checkSession();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDeploymentSuccess = (result) => {
    console.log('Deployment successful:', result);
    setActiveTab(1); // Switch to list view
    setRefreshKey(prev => prev + 1);
  };

  // --- Auth Handlers ---

  const handleLoginSubmit = async () => {
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/api/login/github`, { token: tokenInput }, { withCredentials: true });
      setGithubLoggedIn(true);
      setGithubUser(res.data.username);
      setTokenInput('');
      setAuthDialogOpen(false); // Close dialog on success
    } catch (err) {
      setAuthError('Invalid token or connection failed');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/logout/github`, {}, { withCredentials: true });
      setGithubLoggedIn(false);
      setGithubUser('');
      setAuthDialogOpen(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="deployment-app-container">
      {/* --- NEW NAVIGATION BAR --- */}
      <AppBar position="static" color="default" sx={{ mb: 3, borderRadius: 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4, fontWeight: 'bold' }}>
             Deployments
          </Typography>

          {/* Navigation Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            textColor="primary"
            indicatorColor="primary"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="➕ New Deployment" />
            <Tab label="📦 My Deployments" />
          </Tabs>

          {/* GitHub Login Option */}
          <Button 
            variant={githubLoggedIn ? "outlined" : "contained"} 
            color={githubLoggedIn ? "success" : "primary"}
            startIcon={<GitHubIcon />}
            onClick={() => setAuthDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            {githubLoggedIn ? githubUser : 'Connect GitHub'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* --- MAIN CONTENT --- */}
      <main className="app-main">
        {activeTab === 0 ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {!githubLoggedIn && (
               <div style={{ 
                 padding: '16px', 
                 backgroundColor: '#fff4e5', 
                 border: '1px solid #ffe0b2', 
                 borderRadius: '8px',
                 marginBottom: '20px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '10px'
               }}>
                 <GitHubIcon color="warning" />
                 <Typography variant="body2" color="text.secondary">
                   You must <b>Connect GitHub</b> (top right) to deploy from your repository.
                 </Typography>
               </div>
            )}
            
            <DeploymentForm 
              onDeploy={handleDeploymentSuccess} 
              githubLoggedIn={githubLoggedIn} 
              githubUser={githubUser} 
            />
          </div>
        ) : (
          <DeploymentsList refreshKey={refreshKey} />
        )}
      </main>

      {/* --- GITHUB AUTH DIALOG (The "Click to Show" part) --- */}
      <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {githubLoggedIn ? 'GitHub Account' : 'Connect GitHub'}
          <IconButton onClick={() => setAuthDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {githubLoggedIn ? (
            // State: Logged In
            <Box textAlign="center" py={2}>
              <GitHubIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Logged in as <b>{githubUser}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You are ready to deploy applications.
              </Typography>
            </Box>
          ) : (
            // State: Logged Out (Login Form)
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your GitHub Personal Access Token (Classic) to enable deployment features.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="GitHub Personal Access Token"
                type="password"
                fullWidth
                variant="outlined"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                error={!!authError}
                helperText={authError}
              />
              <Box mt={1}>
                <small>
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#1976d2' }}>
                    Generate a new token (Repo scope required)
                  </a>
                </small>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          {githubLoggedIn ? (
            <Button onClick={handleLogout} color="error" variant="outlined">
              Logout
            </Button>
          ) : (
            <Button onClick={handleLoginSubmit} variant="contained" color="primary">
              Login
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}