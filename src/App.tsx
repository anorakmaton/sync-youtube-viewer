import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InputPage } from './pages/InputPage';
import { WatchPage } from './pages/WatchPage';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/watch" element={<WatchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
