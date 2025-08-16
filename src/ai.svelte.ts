import { pipeline, TextStreamer } from '@huggingface/transformers';

type Message = { role: string; content: string };
type GenerateOptions = {
  max_new_tokens?: number;
  do_sample?: boolean;
  onToken?: (text: string) => void;
};

type Status = 'idle' | 'loading' | 'ready' | 'error';

// Svelte rune構文を利用して状態を管理する
class TextGeneratorModule {
  private static instance: TextGeneratorModule | null = null;
  private generator: any = null;
  // $stateを使ってリアクティブな状態を作成
  status = $state<Status>('idle');
  error = $state<string | null>(null);

  private constructor(
    private model: string = 'onnx-community/gemma-3-270m-it-ONNX',
    private dtype:
      | 'fp32'
      | 'auto'
      | 'fp16'
      | 'q8'
      | 'int8'
      | 'uint8'
      | 'q4'
      | 'bnb4'
      | 'q4f16' = 'fp32'
  ) {}

  static getInstance() {
    if (!TextGeneratorModule.instance) {
      TextGeneratorModule.instance = new TextGeneratorModule();
    }
    return TextGeneratorModule.instance;
  }

  // getterは不要。直接status, errorを参照できる

  async init(onStatusChange?: (status: Status) => void) {
    if (this.generator) return;
    this.status = 'loading';
    onStatusChange?.(this.status);
    try {
      // Create a text generation pipeline
      this.generator = await pipeline('text-generation', this.model, {
        dtype: this.dtype,
      });
      this.status = 'ready';
      this.error = null;
      onStatusChange?.(this.status);
    } catch (e: any) {
      this.status = 'error';
      this.error = e?.message ?? 'モデルの初期化に失敗しました';
      onStatusChange?.(this.status);
      throw e;
    }
  }

  async generate(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<string> {
    if (!this.generator) {
      throw new Error('初期化されていません。init()を先に呼んでください。');
    }

    const { max_new_tokens = 512, do_sample = false, onToken } = options;

    const streamer = new TextStreamer(this.generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: onToken,
    });

    const output = await this.generator(messages, {
      max_new_tokens,
      do_sample,
      streamer,
    });

    if (Array.isArray(output) && output[0]?.generated_text) {
      return output[0].generated_text;
    } else if (Array.isArray(output) && output[0]?.generated_texts) {
      return output[0].generated_texts.at(-1)?.content ?? '';
    } else if (output?.generated_text) {
      return output.generated_text;
    }
    return '';
  }
}

export type ITextGenerator = TextGeneratorModule;
export const TextGenerator = TextGeneratorModule.getInstance();
