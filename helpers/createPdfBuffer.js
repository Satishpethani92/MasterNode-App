'use strict'

function escapePdfText (value = '') {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\r/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/[^\x20-\x7E]/g, '?')
}

function wrapLine (line, maxWidth = 92) {
    const text = String(line || '')

    if (!text) {
        return ['']
    }

    const words = text.split(/\s+/)
    const wrapped = []
    let current = ''

    words.forEach(word => {
        if (!current) {
            current = word
            return
        }

        if ((current + ' ' + word).length <= maxWidth) {
            current += ' ' + word
            return
        }

        wrapped.push(current)
        current = word
    })

    if (current) {
        wrapped.push(current)
    }

    return wrapped
}

function formatLabelValue (label, value, labelWidth = 24, maxWidth = 92) {
    const safeLabel = String(label || '').trim()
    const safeValue = String(value || '-').trim()
    const prefix = `${safeLabel.padEnd(labelWidth, ' ')} : `
    const wrappedValueLines = wrapLine(safeValue, maxWidth - prefix.length)

    return wrappedValueLines.map((line, index) => {
        if (index === 0) {
            return prefix + line
        }

        return `${''.padEnd(prefix.length, ' ')}${line}`
    })
}

function buildPdf (pages) {
    const objects = []
    const addObject = content => {
        objects.push(content)
        return objects.length
    }

    const catalogId = addObject('')
    const pagesId = addObject('')
    const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

    const pageIds = []

    pages.forEach(lines => {
        const stream = [
            'BT',
            '/F1 10 Tf',
            '14 TL',
            '50 792 Td',
            ...lines.map(line => `(${escapePdfText(line)}) Tj\nT*`),
            'ET'
        ].join('\n')

        const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`)
        const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`)
        pageIds.push(pageId)
    })

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

    let pdf = '%PDF-1.4\n'
    const offsets = [0]

    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'utf8'))
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })

    const xrefOffset = Buffer.byteLength(pdf, 'utf8')
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += '0000000000 65535 f \n'

    offsets.slice(1).forEach(offset => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
    })

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    return Buffer.from(pdf, 'utf8')
}

function createPdfBuffer ({ title, metadata = {}, sections = [] }) {
    const lines = [
        title || 'KYC Document',
        '========================================',
        ''
    ]

    if (Object.keys(metadata).length) {
        lines.push('Document Information')
        lines.push('----------------------------------------')
        Object.keys(metadata).forEach(key => {
            lines.push(...formatLabelValue(key, metadata[key]))
        })
        lines.push('')
    }

    sections.forEach(section => {
        lines.push(section.title || 'Section')
        lines.push('----------------------------------------')

        if (Array.isArray(section.rows) && section.rows.length) {
            section.rows.forEach(row => {
                lines.push(...formatLabelValue(row.label, row.value))
            })
        } else {
            lines.push('No data available')
        }

        lines.push('')
    })

    const allLines = lines.flatMap(line => wrapLine(line))
    const pageSize = 52
    const pages = []

    for (let index = 0; index < allLines.length; index += pageSize) {
        pages.push(allLines.slice(index, index + pageSize))
    }

    return buildPdf(pages.length ? pages : ['KYC Document'])
}

module.exports = {
    createPdfBuffer
}
