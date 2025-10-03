import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f0f2f5;
    color: #333;
  }

  * {
    box-sizing: border-box;
  }
`;

export const theme = {
  colors: {
    primary: '#4caf50', // Светло-зеленый
    secondary: '#e0e0e0', // Серый
    background: '#f0f2f5', // Светлый фон
    text: '#333',
    accent: '#388e3c', // Темно-зеленый для акцентов
  },
};