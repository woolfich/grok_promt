import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import db from '../db/database';
import { nanoid } from 'nanoid';

const ImportExportContainer = styled.div`
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

const Input = styled.input`
  display: none;
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

function ImportExport() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);

  const exportData = async () => {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const welders = await db.welders.toArray();
    const articles = await db.articles.where({ month: currentMonth }).toArray();
    const articleHistory = await db.articleHistory.toArray();

    const welderMap = welders.reduce((acc, welder) => {
      acc[welder.id] = welder.name;
      return acc;
    }, {});

    const exportData = articles.map((article) => ({
      welderId: article.welderId,
      welderName: welderMap[article.welderId] || 'Неизвестный',
      article: article.article,
      quantity: article.quantity,
      month: article.month,
      date: article.date,
      history: articleHistory
        .filter((h) => h.articleId === article.id && h.welderId === article.welderId)
        .map((h) => ({
          quantity: h.quantity,
          action: h.action,
          date: h.date,
        })),
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `welder-data-${currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          for (const item of importedData) {
            const { welderId, article, quantity, month, date, history } = item;

            // Проверяем, существует ли сварщик
            let welder = await db.welders.get(welderId);
            if (!welder) {
              welder = { id: welderId, name: item.welderName || 'Неизвестный' };
              await db.welders.add(welder);
            }

            // Проверяем, существует ли артикул в текущем месяце
            const existingArticle = await db.articles
              .where({ welderId, article, month })
              .first();

            if (existingArticle) {
              await db.articles.update(existingArticle.id, { quantity, date });
            } else {
              await db.articles.add({
                id: nanoid(),
                welderId,
                article,
                quantity,
                month,
                date,
              });
            }

            // Импорт истории
            for (const hist of history) {
              await db.articleHistory.add({
                id: nanoid(),
                welderId,
                articleId: existingArticle ? existingArticle.id : nanoid(),
                article,
                quantity: hist.quantity,
                action: hist.action,
                date: hist.date,
              });
            }
          }
          alert('Данные успешно импортированы!');
          setModal(null);
        } catch (error) {
          alert('Ошибка при импорте данных: неверный формат файла');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <ImportExportContainer>
      <Header>
        <Title>Импорт-Экспорт</Title>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </Header>
      <Button onClick={exportData}>Экспорт данных</Button>
      <Button onClick={() => setModal('import')}>Импорт данных</Button>
      {modal === 'import' && (
        <>
          <Overlay onClick={() => setModal(null)} />
          <Modal>
            <h3>Импорт данных</h3>
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              id="import-file"
            />
            <label htmlFor="import-file">
              <Button as="span">Выбрать файл</Button>
            </label>
            <Button onClick={() => setModal(null)}>Закрыть</Button>
          </Modal>
        </>
      )}
    </ImportExportContainer>
  );
}

export default ImportExport;