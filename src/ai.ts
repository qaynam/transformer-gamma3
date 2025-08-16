import type { Message, TextGenerationOutput } from '@huggingface/transformers';
import {
  DataType,
  type MessageEventData,
  type ResponseDataFromWorker,
} from './web-worker';

console.log('[main] Creating new Worker instance');
const aiWorker = new window.Worker('/web-worker.js', {
  type: 'module',
});
console.log('[main] Worker created:', aiWorker);

const waitResponse = async <R>(): Promise<R> => {
  return new Promise((resolve, reject) => {
    const listener = (ev: MessageEvent) => {
      console.log('[main] onmessage', ev.data);
      const { type, data } = ev.data as ResponseDataFromWorker;

      // リスナーをすぐに削除
      aiWorker.removeEventListener('message', listener);

      if (type === 'success') {
        resolve(data.details);
      } else if (type === 'error') {
        reject(data.details);
      }
    };

    aiWorker.addEventListener('message', listener);
  });
};

export const initAI = async () => {
  const params: MessageEventData = {
    type: DataType.Init,
    messages: [],
  };
  console.log('[main] initAI', params);
  aiWorker.postMessage(params);
  return await waitResponse();
};

export const generateText = async (messages: Message[]) => {
  // メッセージをプレーンオブジェクトに変換してクローン化の問題を回避
  const cleanMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const params: MessageEventData = {
    type: DataType.Generate,
    messages: cleanMessages,
  };

  console.debug('[main] 🤔 generateText', params);

  aiWorker.postMessage(params);

  return await waitResponse<
    [
      {
        generated_text: [
          {
            role: 'user';
            content: string;
          },
          {
            role: 'assistant';
            content: string;
          },
        ];
      },
    ]
  >();
};
