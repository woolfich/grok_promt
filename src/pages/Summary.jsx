import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import db from '../db/database';

const SummaryContainer = styled.div`
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
  max-height: 80vh;
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

function Summary() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function fetchArticles() {
      const allArticles = await db.articles.toArray();
      const welders = await db.welders.toArray();
      const welderMap = welders.reduce((acc, welder) => {
        acc[welder.id] = welder.name;
        return acc;
      }, {});

      // Группировка и суммирование артикулов по месяцам и названию
      const groupedByMonthAndArticle = allArticles.reduce((acc, art) => {
        const key = `${art.month}_${art.article}`;
        if (!acc[key]) {
          acc[key] = {
            article: art.article,
            month: art.month,
            quantity: 0,
            firstDate: art.date,
            welders: [],
          };
        }
        acc[key].quantity += Number(art.quantity);
        acc[key].firstDate = acc[key].firstDate
          ? new Date(acc[key].firstDate) < new Date(art.date)
            ? acc[key].firstDate
            : art.date
          : art.date;
        acc[key].welders.push({
          welderId: art.welderId,
          welderName: welderMap[art.welderId] || 'Неизвестный',
          quantity: Number(art.quantity),
        });
        return acc;
      }, {});

      const summarizedArticles = Object.values(groupedByMonthAndArticle);
      setArticles(summarizedArticles);
    }
    fetchArticles();
  }, []);

  const handleArticleClick = async (art) => {
    setSelectedArticle(art);
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
    <SummaryContainer>
      <Header>
        <Title>Сводка</Title>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </Header>
      <ArticleList>
        {sortedMonths.map((month) => (
          <MonthBlock key={month}>
            <MonthTitle>{month}</MonthTitle>
            {groupedArticles[month]
              .sort((a, b) => new Date(a.firstDate) - new Date(b.firstDate))
              .map((art) => (
                <ArticleItem
                  key={`${art.article}_${art.month}`}
                  onClick={() => handleArticleClick(art)}
                >
                  {art.article} - {art.quantity} шт
                </ArticleItem>
              ))}
          </MonthBlock>
        ))}
      </ArticleList>
      {modal === 'history' && selectedArticle && (
        <>
          <Overlay onClick={() => setModal(null)} />
          <Modal>
            <h3>
              История {selectedArticle.article} ({selectedArticle.month})
            </h3>
            <HistoryList>
              {selectedArticle.welders.map((welder, index) => (
                <HistoryItem key={index}>
                  {welder.welderName} - {welder.quantity} шт
                </HistoryItem>
              ))}
            </HistoryList>
            <Button onClick={() => setModal(null)}>Закрыть</Button>
          </Modal>
        </>
      )}
    </SummaryContainer>
  );
}

export default Summary;