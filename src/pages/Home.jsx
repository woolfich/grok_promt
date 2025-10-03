import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import db from '../db/database';
import { nanoid } from 'nanoid';

const HomeContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid ${({ theme }) => theme.colors.secondary};
  border-radius: 4px;
  flex: 1;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.accent};
  }
`;

const WelderList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
`;

const WelderItem = styled.li`
  padding: 10px;
  background-color: white;
  margin-bottom: 10px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const Footer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid ${({ theme }) => theme.colors.secondary};
`;

function Home() {
  const [welderName, setWelderName] = useState('');
  const [welders, setWelders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchWelders() {
      const allWelders = await db.welders.toArray();
      setWelders(allWelders);
    }
    fetchWelders();
  }, []);

  const addWelder = async () => {
    if (welderName.trim()) {
      const id = nanoid();
      await db.welders.add({ id, name: welderName.trim() });
      setWelders([...welders, { id, name: welderName.trim() }]);
      setWelderName('');
    }
  };

  return (
    <HomeContainer>
      <Header>
        <Input
          type="text"
          value={welderName}
          onChange={(e) => setWelderName(e.target.value)}
          placeholder="Введите фамилию сварщика"
        />
        <Button onClick={addWelder}>Добавить сварщика</Button>
        <Button onClick={() => navigate('/import-export')}>Импорт-Экспорт</Button>
      </Header>
      <WelderList>
        {welders.map((welder) => (
          <WelderItem
            key={welder.id}
            onClick={() => navigate(`/welder/${welder.id}`)}
          >
            {welder.name}
          </WelderItem>
        ))}
      </WelderList>
      <Footer>
        <Button onClick={() => navigate('/summary')}>Сводка</Button>
        <Button onClick={() => navigate('/norms')}>Нормы</Button>
      </Footer>
    </HomeContainer>
  );
}

export default Home;