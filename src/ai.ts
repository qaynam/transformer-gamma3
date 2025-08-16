import {
  pipeline,
  TextGenerationPipeline,
  TextStreamer,
  type Message,
} from '@huggingface/transformers';

export type Generator = Awaited<ReturnType<typeof pipeline>>;

let generator: TextGenerationPipeline | null = null;
export const initAI = async () => {
  if (!generator) {
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
