import jsPDF from 'jspdf'

export async function exportToPDF(editorData, filename = 'pr-summary.pdf') {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 8.5 x 11 inches (APA standard)
  })

  // APA Format Configuration
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 72 // 1 inch margins (APA standard)
  const contentWidth = pageWidth - (margin * 2)
  let currentY = margin

  // Font configuration (APA recommends Times New Roman or similar)
  pdf.setFont('times', 'normal')

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace) => {
    if (currentY + requiredSpace > pageHeight - margin) {
      pdf.addPage()
      currentY = margin
      return true
    }
    return false
  }

  // Helper function to wrap text
  const wrapText = (text, maxWidth, fontSize) => {
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text, maxWidth)
    return lines
  }

  // Helper function to strip HTML tags and get clean text
  const stripHtml = (html) => {
    if (!html) return ''
    if (typeof html !== 'string') return String(html)
    
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '')
    
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    
    return text.trim()
  }

  // Process each block
  for (const block of editorData.blocks) {
    switch (block.type) {
      case 'header':
        checkPageBreak(60)
        const level = block.data.level
        let headerSize = 24 // H1 (APA Title)
        let headerStyle = 'bold'
        
        // APA heading sizes
        switch (level) {
          case 1:
            headerSize = 24
            headerStyle = 'bold'
            break
          case 2:
            headerSize = 18
            headerStyle = 'bold'
            break
          case 3:
            headerSize = 14
            headerStyle = 'bold'
            break
          case 4:
            headerSize = 12
            headerStyle = 'bolditalic'
            break
          default:
            headerSize = 12
            headerStyle = 'italic'
        }
        
        pdf.setFont('times', headerStyle)
        pdf.setFontSize(headerSize)
        
        const headerText = stripHtml(block.data.text)
        const headerLines = wrapText(headerText, contentWidth, headerSize)
        
        headerLines.forEach((line, index) => {
          pdf.text(line, margin, currentY + (index * headerSize * 1.2))
        })
        
        currentY += headerLines.length * headerSize * 1.2 + 12 // Space after header
        pdf.setFont('times', 'normal') // Reset font
        break

      case 'paragraph':
        checkPageBreak(30)
        pdf.setFontSize(12) // APA body text
        
        const paragraphText = stripHtml(block.data.text)
        const paragraphLines = wrapText(paragraphText, contentWidth, 12)
        
        paragraphLines.forEach((line, index) => {
          checkPageBreak(18)
          pdf.text(line, margin, currentY + (index * 18)) // 1.5 line spacing (12 * 1.5 = 18)
        })
        
        currentY += paragraphLines.length * 18 + 12 // Space between paragraphs
        break

      case 'list':
        checkPageBreak(30)
        pdf.setFontSize(12)
        pdf.setFont('times', 'normal')
        
        if (block.data.items && Array.isArray(block.data.items)) {
          block.data.items.forEach((item, index) => {
            checkPageBreak(20)
            
            const bullet = block.data.style === 'ordered' 
              ? `${index + 1}. ` 
              : '• '
            
            // Handle item - could be string or object with text property
            let itemText = ''
            if (typeof item === 'string') {
              itemText = stripHtml(item)
            } else if (item && typeof item === 'object') {
              itemText = stripHtml(item.content || item.text || '')
            }
            
            if (!itemText) return // Skip empty items
            
            const bulletWidth = pdf.getTextWidth(bullet)
            
            // Draw bullet/number
            pdf.text(bullet, margin + 20, currentY)
            
            // Wrap text for list item
            const itemLines = wrapText(itemText, contentWidth - 60, 12)
            
            itemLines.forEach((line, lineIndex) => {
              checkPageBreak(18)
              if (lineIndex === 0) {
                pdf.text(line, margin + 20 + bulletWidth, currentY)
              } else {
                pdf.text(line, margin + 20 + bulletWidth, currentY + (lineIndex * 18))
              }
            })
            
            currentY += itemLines.length * 18 + 6 // Space between list items
          })
        }
        
        currentY += 12 // Space after list
        break

      case 'quote':
        checkPageBreak(40)
        pdf.setFont('times', 'italic')
        pdf.setFontSize(12)
        
        // Indent quote (APA style)
        const quoteMargin = margin + 40
        const quoteWidth = contentWidth - 80
        
        const quoteText = stripHtml(block.data.text)
        const quoteLines = wrapText(quoteText, quoteWidth, 12)
        
        // Draw left border for quote
        pdf.setDrawColor(100, 100, 100)
        pdf.setLineWidth(2)
        pdf.line(quoteMargin - 10, currentY - 8, quoteMargin - 10, currentY + (quoteLines.length * 18))
        
        quoteLines.forEach((line, index) => {
          checkPageBreak(18)
          pdf.text(line, quoteMargin, currentY + (index * 18))
        })
        
        currentY += quoteLines.length * 18 + 16
        pdf.setFont('times', 'normal')
        break

      case 'code':
        checkPageBreak(50)
        pdf.setFont('courier', 'normal')
        pdf.setFontSize(10)
        
        // Background for code block
        const codeLines = block.data.code.split('\n')
        const codeHeight = codeLines.length * 14 + 20
        
        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin, currentY - 10, contentWidth, codeHeight, 'F')
        
        codeLines.forEach((line, index) => {
          checkPageBreak(14)
          pdf.text(line || ' ', margin + 10, currentY + (index * 14))
        })
        
        currentY += codeHeight + 10
        pdf.setFont('times', 'normal')
        break

      case 'delimiter':
        checkPageBreak(20)
        pdf.setDrawColor(150, 150, 150)
        pdf.setLineWidth(1)
        pdf.line(margin + contentWidth / 4, currentY, margin + (contentWidth * 3/4), currentY)
        currentY += 20
        break

      case 'table':
        // Basic table support
        if (block.data.content && block.data.content.length > 0) {
          checkPageBreak(50)
          pdf.setFontSize(10)
          
          const cellPadding = 5
          const cellHeight = 20
          const colWidth = contentWidth / block.data.content[0].length
          
          block.data.content.forEach((row, rowIndex) => {
            checkPageBreak(cellHeight)
            
            row.forEach((cell, colIndex) => {
              const x = margin + (colIndex * colWidth)
              const y = currentY
              
              // Draw cell border
              pdf.rect(x, y, colWidth, cellHeight)
              
              // Draw cell text
              const cellText = stripHtml(cell)
              pdf.text(cellText, x + cellPadding, y + 14)
            })
            
            currentY += cellHeight
          })
          
          currentY += 12
        }
        break
    }
  }

  // Add page numbers (APA style - top right)
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(10)
    pdf.setFont('times', 'normal')
    pdf.text(`${i}`, pageWidth - margin, margin / 2, { align: 'right' })
  }

  // Save PDF
  pdf.save(filename)
  return true
}

export function generateFilename(repo, startDate, endDate) {
  const repoName = repo.split('/')[1] || repo
  const date = new Date().toISOString().split('T')[0]
  return `pr-summary-${repoName}-${startDate}-${endDate}-${date}.pdf`
}
