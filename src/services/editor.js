import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Quote from '@editorjs/quote'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import InlineCode from '@editorjs/inline-code'
import Table from '@editorjs/table'
import Strikethrough from '@sotaproject/strikethrough'
import ChangeCase from 'editorjs-change-case'
import DragDrop from 'editorjs-drag-drop'
import Undo from 'editorjs-undo'
import editorjsParser from 'editorjs-parser'

export function createEditor(holderId, data = null, readOnly = false) {
  const editor = new EditorJS({
    holder: holderId,
    data: data,
    readOnly: readOnly,
    placeholder: 'Comienza a escribir tu resumen aquí...',
    tools: {
      header: {
        class: Header,
        config: {
          levels: [1, 2, 3, 4, 5, 6],
          defaultLevel: 2
        }
      },
      list: {
        class: List,
        inlineToolbar: true
      },
      quote: {
        class: Quote,
        inlineToolbar: true
      },
      code: Code,
      delimiter: Delimiter,
      inlineCode: {
        class: InlineCode,
        shortcut: 'CMD+SHIFT+M'
      },
      table: {
        class: Table,
        inlineToolbar: true
      },
      strikethrough: Strikethrough,
      changeCase: {
        class: ChangeCase,
        config: {
          showLocaleOption: true,
          locale: 'es'
        }
      }
    },
    onReady: () => {
      try {
        new Undo({ editor })
        new DragDrop(editor)
      } catch (error) {
        console.warn('Error initializing editor plugins:', error)
      }
    }
  })

  return editor
}

export async function convertEditorDataToHTML(editorData) {
  const parser = new editorjsParser()
  return parser.parse(editorData)
}

export function parseMarkdownToEditorJS(markdown) {
  const blocks = []
  const lines = markdown.split('\n')
  
  let currentCodeBlock = null
  let currentListItems = []
  let currentListType = null
  
  // Helper function to convert markdown inline formatting to HTML
  const convertInlineFormatting = (text) => {
    if (!text) return ''
    
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    text = text.replace(/__(.+?)__/g, '<b>$1</b>')
    
    // Italic: *text* or _text_ (but not list markers)
    text = text.replace(/\*([^*]+)\*/g, '<i>$1</i>')
    text = text.replace(/_([^_]+)_/g, '<i>$1</i>')
    
    // Inline code: `code`
    text = text.replace(/`(.+?)`/g, '<code class="inline-code">$1</code>')
    
    // Strikethrough: ~~text~~
    text = text.replace(/~~(.+?)~~/g, '<s>$1</s>')
    
    return text
  }
  
  // Helper to flush list items
  const flushList = () => {
    if (currentListItems.length > 0) {
      blocks.push({
        type: 'list',
        data: {
          style: currentListType,
          items: currentListItems
        }
      })
      currentListItems = []
      currentListType = null
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    // Empty line - might end a list
    if (!trimmedLine) {
      if (currentCodeBlock === null) {
        flushList()
      }
      continue
    }
    
    // Code blocks
    if (trimmedLine.startsWith('```')) {
      if (currentCodeBlock === null) {
        // Start code block
        currentCodeBlock = {
          language: trimmedLine.replace(/```/g, '').trim() || 'plaintext',
          code: []
        }
      } else {
        // End code block
        blocks.push({
          type: 'code',
          data: {
            code: currentCodeBlock.code.join('\n'),
            language: currentCodeBlock.language
          }
        })
        currentCodeBlock = null
      }
      continue
    }
    
    // Inside code block
    if (currentCodeBlock !== null) {
      currentCodeBlock.code.push(line)
      continue
    }
    
    // Headers
    if (trimmedLine.match(/^#{1,6}\s/)) {
      flushList()
      
      const level = trimmedLine.match(/^#+/)[0].length
      const text = trimmedLine.replace(/^#+\s*/, '')
      blocks.push({
        type: 'header',
        data: {
          text: convertInlineFormatting(text),
          level: Math.min(level, 6)
        }
      })
      continue
    }
    
    // Unordered lists (be more permissive with spacing)
    const unorderedMatch = trimmedLine.match(/^[-*+]\s+(.*)$/)
    if (unorderedMatch) {
      const item = unorderedMatch[1].trim()
      if (item) {
        currentListItems.push(convertInlineFormatting(item))
        if (!currentListType) currentListType = 'unordered'
      }
      continue
    }
    
    // Ordered lists (be more permissive with spacing)
    const orderedMatch = trimmedLine.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      const item = orderedMatch[1].trim()
      if (item) {
        currentListItems.push(convertInlineFormatting(item))
        if (!currentListType) currentListType = 'ordered'
      }
      continue
    }
    
    // If we have list items and encounter non-list content, flush the list
    if (currentListItems.length > 0 && !trimmedLine.match(/^[-*+\d]/)) {
      flushList()
    }
    
    // Horizontal rule
    if (trimmedLine.match(/^(---|\*\*\*|___)$/)) {
      blocks.push({
        type: 'delimiter',
        data: {}
      })
      continue
    }
    
    // Blockquote
    if (trimmedLine.startsWith('>')) {
      blocks.push({
        type: 'quote',
        data: {
          text: convertInlineFormatting(trimmedLine.replace(/^>\s*/, '')),
          caption: ''
        }
      })
      continue
    }
    
    // Regular paragraph
    if (trimmedLine) {
      blocks.push({
        type: 'paragraph',
        data: {
          text: convertInlineFormatting(trimmedLine)
        }
      })
    }
  }
  
  // Flush any remaining list items
  flushList()
  
  // Debug: Log parsed blocks to help identify issues
  console.log('Parsed blocks:', blocks)
  
  return {
    time: Date.now(),
    blocks: blocks,
    version: '2.28.0'
  }
}
