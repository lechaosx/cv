import MarkdownIt, { type Token } from 'markdown-it';
import type { Language } from './cv.ts';
import { renderedText } from './i18n.ts';

const markdown = new MarkdownIt({ html: false }).disable('image');

export function proseHTML(source: string, language: Language) {
  const tokens = markdown.parse(source, {});
  const translate = (token: Token) => {
    if (token.type === 'text') token.content = renderedText(token.content, language);
    token.children?.forEach(translate);
  };
  tokens.forEach(translate);
  return markdown.renderer.render(tokens, markdown.options, {});
}

export function proseSummary(source: string) {
  const tokens = markdown.parse(source, {});
  const paragraph = tokens.findIndex(token => token.type === 'paragraph_open');
  const content = tokens[paragraph + 1];
  const plain = (token: Token): string => token.children ? token.children.map(plain).join('')
    : token.type === 'text' || token.type === 'code_inline' ? token.content
      : token.type === 'softbreak' || token.type === 'hardbreak' ? ' ' : '';
  return content ? plain(content).replace(/\s+/g, ' ').trim() : '';
}
