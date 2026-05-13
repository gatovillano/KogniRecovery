import { useState, useCallback, useRef } from 'react';
import { api } from '@services/api';

export const useMotivationalGreeting = () => {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const hasFired = useRef(false);

  const fetchGreeting = useCallback(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    setText('');
    setIsStreaming(true);
    setDone(false);

    const baseUrl = api.getApiConfig().baseUrl;
    const tokens = api.getAuthTokens();

    const xhr = new XMLHttpRequest();
    let buffer = '';
    let lastLength = 0;
    let streamedText = '';

    const processLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') return;

      if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.replace('data: ', '');
        try {
          const event = JSON.parse(dataStr);
          if (event.type === 'token') {
            streamedText += event.content;
            setText(streamedText);
          }
        } catch {
          // partial chunk, ignore
        }
      }
    };

    xhr.open('GET', `${baseUrl}/dashboard/greeting`, true);
    xhr.setRequestHeader('Authorization', tokens ? `Bearer ${tokens.accessToken}` : '');

    xhr.onprogress = () => {
      const responseText = xhr.responseText;
      const newText = responseText.substring(lastLength);
      lastLength = responseText.length;

      buffer += newText;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        processLine(line);
      }
    };

    xhr.onload = () => {
      if (buffer.trim()) {
        processLine(buffer);
      }
      setIsStreaming(false);
      setDone(true);
    };

    xhr.onerror = () => {
      setText('Cada día es una nueva oportunidad. Sigue adelante.');
      setIsStreaming(false);
      setDone(true);
    };

    xhr.send();
  }, []);

  const reset = useCallback(() => {
    setText('');
    setDone(false);
    hasFired.current = false;
  }, []);

  return { text, isStreaming, done, fetchGreeting, reset };
};
