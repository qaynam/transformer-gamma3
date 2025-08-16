import type { Message, TextGenerationOutput } from '@huggingface/transformers';
import {
  DataType,
  type MessageEventData,
  type ResponseDataFromWorker,
} from './web-worker';

const aiWorker = new window.Worker('/web-worker.js', {
  type: 'module',
});

const waitResponse = async <R>(): Promise<R> => {
  let listener: any = null;
  let response: R | null = null;
  await new Promise((resolve, reject) => {
    listener = (ev: MessageEvent) => {
      console.log('[main] onmessage', ev.data);
      const { type, data } = ev.data as ResponseDataFromWorker;
      if (type === 'success') {
        response = data.details;
        resolve(response);
      } else if (type === 'error') {
        reject(data.details);
        response = data.details;
      }
    };

    aiWorker.addEventListener('message', listener);
  });

  if (listener) {
    aiWorker.removeEventListener('message', listener);
  }

  return response as R;
};

export const initAI = async () => {
  const params: MessageEventData = {
    type: DataType.Init,
    messages: [],
  };
  aiWorker.postMessage(params);
  return await waitResponse();
};

export const generateText = async (messages: Message[]) => {
  const params: MessageEventData = {
    type: DataType.Generate,
    messages,
  };

  let res = waitResponse<
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
  aiWorker.postMessage(params);

  return await res;
};
