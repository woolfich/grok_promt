import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { ThemeProvider } from 'styled-components';
import Home from './pages/Home';
import WelderCard from './pages/WelderCard';
import Summary from './pages/Summary';
import Norms from './pages/Norms';
import ImportExport from './pages/ImportExport';
import { theme } from './styles/GlobalStyles';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/welder/:id" element={<WelderCard />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/norms" element={<Norms />} />
          <Route path="/import-export" element={<ImportExport />} />
        </Routes>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;