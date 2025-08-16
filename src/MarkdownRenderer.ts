import { marked } from 'marked';

class MarkdownRenderer extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.setupStyles();
  }

  static get observedAttributes() {
    return ['markdown'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'markdown' && oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        color: #333;
      }

      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.25;
      }

      h1 { font-size: 1.8em; border-bottom: 2px solid #eaecef; padding-bottom: 0.3em; }
      h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1.1em; }

      p {
        margin-bottom: 1em;
      }

      ul, ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }

      li {
        margin-bottom: 0.25em;
      }

      code {
        background-color: #f6f8fa;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.9em;
        padding: 0.2em 0.4em;
      }

      pre {
        background-color: #f6f8fa;
        border-radius: 6px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.9em;
        line-height: 1.45;
        overflow: auto;
        padding: 1em;
        margin-bottom: 1em;
      }

      pre code {
        background-color: transparent;
        border-radius: 0;
        font-size: inherit;
        padding: 0;
      }

      blockquote {
        border-left: 4px solid #dfe2e5;
        color: #6a737d;
        margin-bottom: 1em;
        padding-left: 1em;
        margin-left: 0;
      }

      table {
        border-collapse: collapse;
        margin-bottom: 1em;
        width: 100%;
      }

      th, td {
        border: 1px solid #dfe2e5;
        padding: 0.5em 1em;
        text-align: left;
      }

      th {
        background-color: #f6f8fa;
        font-weight: 600;
      }

      a {
        color: #0366d6;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      strong {
        font-weight: 600;
      }

      em {
        font-style: italic;
      }

      hr {
        border: none;
        border-top: 1px solid #eaecef;
        margin: 2em 0;
      }
    `;
    this.shadow.appendChild(style);
  }

  private async render() {
    const markdownContent = this.getAttribute('markdown') || '';
    const container =
      this.shadow.querySelector('.markdown-content') ||
      document.createElement('div');

    if (!container.parentNode) {
      container.className = 'markdown-content';
      this.shadow.appendChild(container);
    }

    if (markdownContent.trim()) {
      container.innerHTML = await marked(markdownContent);
    } else {
      container.innerHTML = '';
    }
  }
}

// カスタム要素として登録
customElements.define('markdown-renderer', MarkdownRenderer);

export default MarkdownRenderer;
