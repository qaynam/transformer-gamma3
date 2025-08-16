<script lang="ts">
  import {
    Button,
    HStack,
    Icon,
    Input,
    Skeleton,
    Spinner,
    Typography,
    VStack,
  } from 'koy-ui';
  import { generateText, initAI, type Generator } from './ai';
  import type {
    Message,
    TextGenerationPipeline,
    TextGenerationSingle,
  } from '@huggingface/transformers';
  import { marked } from 'marked';

  let generator: TextGenerationPipeline | null = $state(null);
  let generatorStatus = $state<'idle' | 'loading'>('loading');
  let isStreaming = $state(false);
  let inputText = $state('');
  let chatHistory = $state<Message[][]>([]);

  const generate = async () => {
    if (!generator) return;
    if (!inputText) {
      alert('Please enter a question');
      return;
    }

    isStreaming = true;
    const res = await generateText(generator, [
      { role: 'user', content: inputText },
    ]);

    const last = res.at(-1);
    if (!last || typeof last !== 'object') {
      return;
    }
    const _last = last as TextGenerationSingle;

    if (Array.isArray(_last.generated_text)) {
      chatHistory.push([
        { role: 'user', content: inputText },
        _last.generated_text.at(-1) as unknown as Message,
      ]);
      isStreaming = false;
    }
    inputText = '';
  };

  const handleKeyDown = (e: CustomEvent<any>) => {
    if (e.detail.key === 'Enter') {
      generate();
    }
  };

  $effect(() => {
    initAI().then((res) => {
      generator = res;
      generatorStatus = 'idle';
    });
  });
</script>

<main style:height="90%">
  <div class="container">
    <div style:width="100%" style:margin-top="auto" style:padding-bottom="16px">
      {#if generatorStatus === 'loading'}
        <HStack items="center" justify="center" spacing="XSmall">
          <Spinner />
          <Typography as="span" font="small">初期化中</Typography>
        </HStack>
      {/if}
      {#if generatorStatus === 'idle'}
        <VStack spacing="XLarge">
          {#if chatHistory.length !== 0}
            <div class="chat-area">
              <VStack>
                {#each chatHistory as messages}
                  {#each messages as message}
                    <div class="chat-item">
                      <VStack spacing="XLarge" justify="start">
                        <Typography as="span" font="small">
                          {#if message.role === 'user'}
                            <Icon.User size={16} />
                          {:else if message.role === 'assistant'}
                            {@render BotIcon()}
                          {/if}
                          {message.role}:
                        </Typography>
                        <Typography as="span" font="small">
                          <span class="chat-assistant-message">
                            {@html marked(message.content)}
                          </span>
                        </Typography>
                      </VStack>
                    </div>
                  {/each}
                {/each}
              </VStack>
            </div>
            {#if isStreaming}
              <Skeleton show={true} width="fill" height="100px" />
            {/if}
          {:else}
            <div style:margin-bottom="20px">
              <HStack items="center" justify="center" spacing="XSmall">
                <Typography font="title">何でも聞いてちょうだい😉</Typography>
              </HStack>
            </div>
          {/if}
          <div>
            <HStack>
              <Input
                disabled={isStreaming}
                type="text"
                width="fill"
                bind:value={inputText}
              />
              <Button onClick={generate} disabled={isStreaming}>Ask</Button>
            </HStack>
          </div>
        </VStack>
      {/if}
    </div>
  </div>
</main>
{#snippet BotIcon()}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-bot-icon lucide-bot"
    ><path d="M12 8V4H8" /><rect
      width="16"
      height="12"
      x="4"
      y="8"
      rx="2"
    /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path
      d="M9 13v2"
    /></svg
  >
{/snippet}

<style>
  :global(body, html, #root) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: #f0f0f0;
    font-family: 'Inter', sans-serif;
    color: #333;
    font-size: 16px;
    line-height: 1.5;
    font-weight: 400;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
    height: 100vh;
    width: 100vw;
  }
  .container {
    display: flex;
    height: 100%;
    max-width: 600px;
    margin: auto;
    padding: 16px;
  }

  .chat-item {
    background-color: #fff;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    width: 100%;
  }

  .chat-item .chat-assistant-message {
    white-space: pre-line;
  }

  .chat-area {
    background-color: #fff;
    border-radius: 12px;
    padding: 16px;
    height: 80%;
    overflow-y: auto;
    flex-grow: 1;
    margin-top: auto;
  }
</style>
