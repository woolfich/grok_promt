import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import db from '../db/database';
import { nanoid } from 'nanoid';

const WelderCardContainer = styled.div`
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

const ArticleList = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`;

const MonthBlock = styled.div`
  margin-bottom: 20px;
`;

const MonthTitle = styled.h2`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 10px;
`;

const ArticleItem = styled.div`
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

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const HistoryItem = styled.li`
  padding: 5px 0;
`;

function WelderCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [welder, setWelder] = useState(null);
  const [article, setArticle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [articles, setArticles] = useState([]);
  const [modal, setModal] = useState(null);
  const [editArticle, setEditArticle] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const welderData = await db.welders.get(id);
      setWelder(welderData);
      const articleData = await db.articles.where({ welderId: id }).toArray();
      setArticles(articleData);
    }
    fetchData();
  }, [id]);

  const addArticle = async () => {
    if (article.trim() && quantity.trim()) {
      const now = new Date();
      const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      const existing = articles.find(
        (a) => a.article === article.trim() && a.month === month
      );

      if (existing) {
        const newQuantity = Number(existing.quantity) + Number(quantity);
        await db.articles.update(existing.id, {
          quantity: newQuantity,
          date: now.toISOString(),
        });
        await db.articleHistory.add({
          id: nanoid(),
          welderId: id,
          articleId: existing.id,
          article: article.trim(),
          quantity: Number(quantity),
          action: 'added',
          date: now.toISOString(),
        });
        setArticles(
          articles.map((a) =>
            a.id === existing.id
              ? { ...a, quantity: newQuantity, date: now }
              : a
          )
        );
      } else {
        const newArticle = {
          id: nanoid(),
          welderId: id,
          article: article.trim(),
          quantity: Number(quantity),
          month,
          date: now.toISOString(),
        };
        await db.articles.add(newArticle);
        await db.articleHistory.add({
          id: nanoid(),
          welderId: id,
          articleId: newArticle.id,
          article: article.trim(),
          quantity: Number(quantity),
          action: 'added',
          date: now.toISOString(),
        });
        setArticles([newArticle, ...articles]);
      }
      setArticle('');
      setQuantity('');
    }
  };

  const handleArticleClick = (art) => {
    setArticle(art.article);
    setQuantity('');
  };

  const handleLongPress = async (art) => {
    setEditArticle(art);
    const historyData = await db.articleHistory
      .where({ welderId: id, articleId: art.id })
      .toArray();
    setHistory(historyData);
    setModal('options');
  };

  const editArticleData = async () => {
    if (editArticle) {
      await db.articles.update(editArticle.id, {
        article: editArticle.article,
        quantity: Number(editArticle.quantity),
        date: new Date().toISOString(),
      });
      await db.articleHistory.add({
        id: nanoid(),
        welderId: id,
        articleId: editArticle.id,
        article: editArticle.article,
        quantity: Number(editArticle.quantity),
        action: 'edited',
        date: new Date().toISOString(),
      });
      setArticles(
        articles.map((a) =>
          a.id === editArticle.id
            ? { ...a, article: editArticle.article, quantity: Number(editArticle.quantity), date: new Date() }
            : a
        )
      );
      setModal(null);
      setEditArticle(null);
      setHistory([]);
    }
  };

  const showHistory = async () => {
    setModal('history');
  };

  const groupedArticles = articles.reduce((acc, art) => {
    acc[art.month] = acc[art.month] || [];
    acc[art.month].push(art);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedArticles).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <WelderCardContainer>
      <Header>
        <Title>{welder ? welder.name : 'Загрузка...'}</Title>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </Header>
      <InputContainer>
        <Input
          type="text"
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          placeholder="Артикул"
        />
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Количество"
        />
        <Button onClick={addArticle}>Добавить запись</Button>
      </InputContainer>
      <ArticleList>
        {sortedMonths.map((month) => (
          <MonthBlock key={month}>
            <MonthTitle>{month}</MonthTitle>
            {groupedArticles[month]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((art) => (
                <ArticleItem
                  key={art.id}
                  onClick={() => handleArticleClick(art)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(art);
                  }}
                >
                  {art.article} - {art.quantity} шт
                </ArticleItem>
              ))}
          </MonthBlock>
        ))}
      </ArticleList>
      {modal === 'options' && editArticle && (
        <>
          <Overlay onClick={() => setModal(null)} />
          <Modal>
            <h3>Действия с артикулом</h3>
            <Input
              type="text"
              value={editArticle.article}
              onChange={(e) => setEditArticle({ ...editArticle, article: e.target.value })}
            />
            <Input
              type="number"
              value={editArticle.quantity}
              onChange={(e) => setEditArticle({ ...editArticle, quantity: e.target.value })}
            />
            <Button onClick={editArticleData}>Сохранить</Button>
            <Button onClick={showHistory}>История</Button>
            <Button onClick={() => setModal(null)}>Закрыть</Button>
          </Modal>
        </>
      )}
      {modal === 'history' && editArticle && (
        <>
          <Overlay onClick={() => setModal(null)} />
          <Modal>
            <h3>История {editArticle.article} ({editArticle.month})</h3>
            <HistoryList>
              {history.length > 0 ? (
                history
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entry) => (
                    <HistoryItem key={entry.id}>
                      {new Date(entry.date).toLocaleDateString()} -{' '}
                      {entry.action === 'added' ? 'Добавлено' : 'Изменено'} {entry.quantity} шт
                    </HistoryItem>
                  ))
              ) : (
                <p>Нет записей</p>
              )}
            </HistoryList>
            <Button onClick={() => setModal(null)}>Закрыть</Button>
          </Modal>
        </>
      )}
    </WelderCardContainer>
  );
}

export default WelderCard;