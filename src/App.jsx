import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import CardManagementScreen from './components/CardManagementScreen';

export default function App() {
  // currentView now stores an object: { name: 'viewName', props: { ... } }
  const [currentView, setCurrentView] = useState({ name: 'login', props: {} });
  const [currentUser, setCurrentUser] = useState(null);

  // This function will now accept an object { name: 'viewName', props: { ... } }
  // or a simple string 'viewName' if no props are needed (e.g., from LoginScreen)
  const handleSetCurrentView = (viewInfo) => {
    if (typeof viewInfo === 'string') {
      // If it's a string, assume no props are being passed
      setCurrentView({ name: viewInfo, props: {} });
    } else {
      // If it's an object, destructure name and props
      setCurrentView(viewInfo);
    }
  };

  const renderView = () => {
    // Access the 'name' property of the currentView object for the switch
    switch (currentView.name) {
      case 'dashboard':
        // Pass the props from currentView.props to DashboardScreen
        return <DashboardScreen {...currentView.props} setCurrentView={handleSetCurrentView} />;
      case 'card_management':
        // CardManagementScreen also needs setCurrentView for navigation
        return  <CardManagementScreen
    {...currentView.props} // This includes selectedCards
    setCurrentView={handleSetCurrentView}
  />;
      case 'login':
      default: // Default to login if currentView.name is not recognized or is 'login'
        return (
          <LoginScreen
            setCurrentUser={setCurrentUser}
            setCurrentView={handleSetCurrentView} // Pass the new handler
          />
        );
    }
  };

  return <div>{renderView()}</div>;
}