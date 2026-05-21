// Type declarations for kuromoji.js
// kuromoji doesn't ship with TypeScript types

declare module 'kuromoji' {
  interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void
  }

  interface Builder {
    (options: { dicPath: string }): TokenizerBuilder
  }

  interface Token {
    surface_form: string
    surface: string
    pos: string
    pos_detail_1: string
    pos_detail_2: string
    pos_detail_3: string
    conjugated_type: string
    conjugated_form: string
    basic_form: string
    reading: string | undefined
    pronunciation: string | undefined
    word_type: string
    word_position: number
  }

  interface Tokenizer {
    tokenize(text: string): Token[]
  }

  const kuromoji: {
    builder: Builder
  }

  export default kuromoji
}
