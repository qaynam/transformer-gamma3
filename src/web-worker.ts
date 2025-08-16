import {
  pipeline,
  TextGenerationPipeline,
  TextStreamer,
  type Message,
} from '@huggingface/transformers';

export enum DataType {
  Init = 'init',
  Generate = 'generateText',
}

export interface MessageEventData {
  type: DataType;
  messages: Message[];
}

export interface ResponseDataFromWorker {
  type: 'success' | 'error';
  data: {
    details: any;
  };
}

// Hugging Face APIへのリクエストをプロキシ経由にリダイレクト
function setupProxyFetch() {
  const originalFetch = window.fetch;
  // @ts-expect-error 止む得ぬので上書きする
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }

    // Hugging FaceのURLをプロキシ経由に変換
    if (url.includes('huggingface.co/')) {
      const proxyUrl = url.replace(
        'https://huggingface.co/',
        `${window.location.origin}/hf-proxy/`
      );
      console.log('Proxying request:', url, '->', proxyUrl);
      return originalFetch(proxyUrl, init);
    }

    return originalFetch(input, init);
  };
}

let generator: TextGenerationPipeline | null = null;

const initAI = async () => {
  if (!generator) {
    if (process.env.NODE_ENV === 'production') {
      // プロキシを設定
      setupProxyFetch();
    }

    // テキスト生成パイプラインを作成
    const _generator: TextGenerationPipeline = (await pipeline(
      'text-generation',
      'onnx-community/gemma-3-270m-it-ONNX',
      { dtype: 'fp32' }
    )) as any;

    generator = _generator;
  }
  return generator;
};

const generateText = async (
  generator: TextGenerationPipeline,
  messages: Message[]
) => {
  // Generate a response
  return await generator(messages, {
    max_new_tokens: 512,
    do_sample: false,
    streamer: new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      // callback_function: (text) => { /* Optional callback function */ },
    }),
  });
};

const postMessage = (data: ResponseDataFromWorker) => {
  self.postMessage(data);
};

self.onmessage = async (ev) => {
  const { type, messages } = ev.data as MessageEventData;
  console.debug('[web-worker] onmessage', type, messages);
  try {
    if (type === DataType.Init) {
      await initAI();
      postMessage({
        type: 'success',
        data: {
          details: 'AI initialized successfully',
        },
      });
      console.debug('[web-worker] postMessage', 'success');
    }

    if (type === DataType.Generate) {
      const generator = await initAI();
      const res = await generateText(generator, messages);
      postMessage({
        type: 'success',
        data: {
          details: res,
        },
      });
      console.debug('[web-worker] postMessage', res);
    }
  } catch (err) {
    postMessage({ type: 'error', data: { details: err } });
    console.error('[web-worker] error', err);
  }
};
