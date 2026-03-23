import { useState } from 'react';
import Login from './pages/Login';

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <div className="light">
      <Login onLogin={() => {}} />
    </div>
  );
}

export default App;
