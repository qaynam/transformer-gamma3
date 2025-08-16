import {
  pipeline,
  TextGenerationPipeline,
  TextStreamer,
  type Message,
} from '@huggingface/transformers';

export type Generator = Awaited<ReturnType<typeof pipeline>>;

// Hugging Face APIへのリクエストをプロキシ経由にリダイレクト
function setupProxyFetch() {
  const originalFetch = window.fetch;
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
      const proxyUrl = url.replace('https://huggingface.co/', `${window.location.origin}/hf-proxy/`);
      console.log('Proxying request:', url, '->', proxyUrl);
      return originalFetch(proxyUrl, init);
    }
    
    return originalFetch(input, init);
  };
}

let generator: TextGenerationPipeline | null = null;
export const initAI = async () => {
  if (!generator) {
    // プロキシを設定
    setupProxyFetch();
    
    // Create a text generation pipeline
    generator = await pipeline(
      'text-generation',
      'onnx-community/gemma-3-270m-it-ONNX',
      { dtype: 'fp32' }
    );
  }
  return generator;
};

export const generateText = async (
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
