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
  import { generateText, initAI } from './ai';
  import type {
    Message,
    TextGenerationSingle,
  } from '@huggingface/transformers';
  import { tick, onMount } from 'svelte';
  import './MarkdownRenderer';

  let generatorStatus = $state<'idle' | 'loading'>('loading');
  let isStreaming = $state(false);
  let inputText = $state('');
  let chatHistory = $state<Message[][]>([]);
  let chatArea: HTMLDivElement | null = $state(null);
  let mainRef: HTMLElement | null = $state(null);
  let isInitialized = $state(false);

  const generate = async () => {
    if (!inputText) {
      alert('Please enter a question');
      return;
    }

    isStreaming = true;
    // chatHistoryの最後の3つの会話履歴を取得し、今回の入力を追加してgenerateTextに渡す
    const recentHistory = chatHistory.slice(-3).flat();
    const res = await generateText([
      ...recentHistory,
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
    await tick();
    chatArea?.scrollTo({
      top: chatArea.scrollHeight,
      behavior: 'smooth',
    });
  };

  function modifyChatAreaHeight() {
    if (!chatArea || !mainRef?.clientHeight) {
      return;
    }
    chatArea.style.maxHeight = `${mainRef.clientHeight * 0.8}px`;
  }

  onMount(() => {
    initAI().then((res) => {
      generatorStatus = 'idle';
    });
    modifyChatAreaHeight();
  });
</script>

<svelte:window on:resize={modifyChatAreaHeight} />

<main bind:this={mainRef} style:height="90%">
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
            <div bind:this={chatArea} class="chat-area">
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
                        {#if message.role === 'assistant'}
                          <div class="chat-assistant-message">
                            <markdown-renderer markdown={message.content}
                            ></markdown-renderer>
                          </div>
                        {:else}
                          <Typography as="span" font="small">
                            {message.content}
                          </Typography>
                        {/if}
                      </VStack>
                    </div>
                  {/each}
                {/each}
              </VStack>
            </div>
          {:else}
            <div style:margin-bottom="20px">
              <HStack items="center" justify="center" spacing="XSmall">
                <Typography font="title">何でも聞いてちょうだい😉</Typography>
              </HStack>
            </div>
          {/if}

          {#if isStreaming === true}
            <Skeleton show={true} width="fill" height="100px" />
          {/if}

          <div>
            <HStack>
              <Input
                disabled={isStreaming}
                type="text"
                width="fill"
                bind:value={inputText}
              />
              <Button onClick={generate} disabled={isStreaming}>Send</Button>
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
    background-color: whitesmoke;
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

  :global(html) > * {
    font-family: 'Hiragino Sans';
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

  .chat-assistant-message {
    width: 100%;
  }

  .chat-area {
    background-color: #fff;
    border-radius: 12px;
    padding: 16px;
    overflow-y: auto;
    flex-grow: 1;
    margin-top: auto;
  }
</style>
