import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import db from '../db/database';
import { nanoid } from 'nanoid';

const NormsContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.text};
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  position: relative;
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

const SuggestionList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.secondary};
  border-radius: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
`;

const SuggestionItem = styled.li`
  padding: 10px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const NormList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
`;

const NormItem = styled.li`
  padding: 10px;
  background-color: white;
  margin-bottom: 10px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

function Norms() {
  const navigate = useNavigate();
  const [article, setArticle] = useState('');
  const [time, setTime] = useState('');
  const [norms, setNorms] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [modal, setModal] = useState(null);
  const [editNorm, setEditNorm] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function fetchNorms() {
      const allNorms = await db.norms.toArray();
      setNorms(allNorms);
    }
    fetchNorms();
  }, []);

  const handleArticleInput = async (value) => {
    setArticle(value);
    if (value.length > 1) {
      const matches = await db.norms
        .where('article')
        .startsWithIgnoreCase(value)
        .toArray();
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const addNorm = async () => {
    if (article.trim() && time.trim()) {
      const existing = norms.find((n) => n.article === article.trim());
      if (!existing) {
        const newNorm = {
          id: nanoid(),
          article: article.trim(),
          time: time.trim(),
        };
        await db.norms.add(newNorm);
        setNorms([newNorm, ...norms]);
        setArticle('');
        setTime('');
        setSuggestions([]);
      } else {
        alert('Артикул уже существует!');
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setArticle(suggestion.article);
    setTime(suggestion.time);
    setSuggestions([]);
  };

  const handleLongPress = (norm) => {
    setEditNorm(norm);
    setModal('options');
  };

  const editNormData = async () => {
    if (editNorm) {
      const existing = norms.find(
        (n) => n.article === editNorm.article && n.id !== editNorm.id
      );
      if (!existing) {
        await db.norms.update(editNorm.id, {
          article: editNorm.article,
          time: editNorm.time,
        });
        setNorms(
          norms.map((n) =>
            n.id === editNorm.id
              ? { ...n, article: editNorm.article, time: editNorm.time }
              : n
          )
        );
        setModal(null);
        setEditNorm(null);
      } else {
        alert('Артикул уже существует!');
      }
    }
  };

  const deleteNorm = async () => {
    if (editNorm) {
      await db.norms.delete(editNorm.id);
      setNorms(norms.filter((n) => n.id !== editNorm.id));
      setModal(null);
      setEditNorm(null);
    }
  };

  return (
    <NormsContainer>
      <Header>
        <Title>Нормы</Title>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </Header>
      <InputContainer>
        <Input
          ref={inputRef}
          type="text"
          value={article}
          onChange={(e) => handleArticleInput(e.target.value)}
          placeholder="Артикул"
        />
        <Input
          type="text"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Время (например, 8ч)"
        />
        <Button onClick={addNorm}>Добавить</Button>
        {suggestions.length > 0 && (
          <SuggestionList>
            {suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.article} - {suggestion.time}
              </SuggestionItem>
            ))}
          </SuggestionList>
        )}
      </InputContainer>
      <NormList>
        {norms.map((norm) => (
          <NormItem
            key={norm.id}
            onContextMenu={(e) => {
              e.preventDefault();
              handleLongPress(norm);
            }}
          >
            {norm.article} - {norm.time}
          </NormItem>
        ))}
      </NormList>
      {modal === 'options' && editNorm && (
        <>
          <Overlay onClick={() => setModal(null)} />
          <Modal>
            <h3>Действия с нормой</h3>
            <Input
              type="text"
              value={editNorm.article}
              onChange={(e) => setEditNorm({ ...editNorm, article: e.target.value })}
              placeholder="Артикул"
            />
            <Input
              type="text"
              value={editNorm.time}
              onChange={(e) => setEditNorm({ ...editNorm, time: e.target.value })}
              placeholder="Время (например, 8ч)"
            />
            <Button onClick={editNormData}>Сохранить</Button>
            <Button onClick={deleteNorm}>Удалить</Button>
            <Button onClick={() => setModal(null)}>Закрыть</Button>
          </Modal>
        </>
      )}
    </NormsContainer>
  );
}

export default Norms;