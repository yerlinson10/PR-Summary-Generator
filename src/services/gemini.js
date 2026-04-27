import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null
let model = null
let currentApiKey = null
let activeModelIndex = 0
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro'
]
const MAX_RETRIES_PER_MODEL = 3
const RETRY_DELAYS_MS = [800, 1800, 3200]

function buildModel(modelName) {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192
    }
  })
}

function setActiveModel(index) {
  activeModelIndex = index
  model = buildModel(MODEL_CANDIDATES[index])
}

function normalizeErrorMessage(error) {
  return (error?.message || '').toLowerCase()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isModelAvailabilityError(error) {
  const message = normalizeErrorMessage(error)
  const status = error?.status || error?.code

  return (
    status === 404 ||
    message.includes('not found') ||
    message.includes('model') && message.includes('supported') ||
    message.includes('is not supported') ||
    message.includes('unknown model') ||
    message.includes('deprecated')
  )
}

function isTemporaryOverloadError(error) {
  const message = normalizeErrorMessage(error)
  const status = error?.status || error?.code

  return (
    status === 503 ||
    String(status).toUpperCase() === 'UNAVAILABLE' ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('try again later') ||
    message.includes('temporarily')
  )
}

function shouldTryNextModel(error) {
  return isModelAvailabilityError(error) || isTemporaryOverloadError(error)
}

function toUserFriendlyError(error) {
  const message = normalizeErrorMessage(error)
  const status = error?.status || error?.code

  if (isTemporaryOverloadError(error)) {
    return new Error('Gemini está con alta demanda en este momento. Intenta nuevamente en 1-2 minutos.')
  }

  if (message.includes('api key') || message.includes('api_key') || status === 401 || status === 403) {
    return new Error('API Key inválida o sin permisos. Verifica tu token de Gemini en Configuración.')
  }

  if (
    message.includes('quota') ||
    message.includes('rate limit') ||
    status === 429
  ) {
    return new Error('Has excedido el límite de solicitudes de Gemini. Intenta nuevamente en unos minutos.')
  }

  if (isModelAvailabilityError(error)) {
    return new Error('No hay modelos de IA disponibles para tu cuenta en este momento. Intenta de nuevo más tarde.')
  }

  return new Error(`Error al generar resumen: ${error.message || 'Error desconocido'}`)
}

export function initializeGemini(apiKey) {
  if (!apiKey) {
    throw new Error('API Key de Gemini requerida')
  }
  
  try {
    const cleanApiKey = apiKey.trim()
    genAI = new GoogleGenerativeAI(cleanApiKey)
    currentApiKey = cleanApiKey
    setActiveModel(0)
    return true
  } catch (error) {
    console.error('Error initializing Gemini:', error)
    throw error
  }
}

export async function generatePRSummary(prData, language = 'es', reportType = 'executive') {
  if (!model) {
    throw new Error('Gemini no está inicializado. Por favor configura tu API Key en Configuración.')
  }

  const prompt = createSummaryPrompt(prData, language, reportType)
  
  try {
    const modelOrder = [
      activeModelIndex,
      ...MODEL_CANDIDATES.map((_, index) => index).filter(index => index !== activeModelIndex)
    ]

    let lastError = null

    for (const modelIndex of modelOrder) {
      try {
        setActiveModel(modelIndex)
        for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
          try {
            const result = await model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            if (!text) {
              throw new Error('La respuesta de Gemini está vacía')
            }

            return text
          } catch (attemptError) {
            // Si falla en el primer intento, cambiar de modelo inmediatamente.
            if (attempt === 0 && shouldTryNextModel(attemptError)) {
              throw attemptError
            }

            // Si hay sobrecarga temporal, esperar y reintentar en el mismo modelo.
            if (isTemporaryOverloadError(attemptError) && attempt < MAX_RETRIES_PER_MODEL - 1) {
              await sleep(RETRY_DELAYS_MS[attempt] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1])
              continue
            }

            throw attemptError
          }
        }
      } catch (attemptError) {
        lastError = attemptError

        if (!shouldTryNextModel(attemptError)) {
          throw attemptError
        }

        console.warn(`Modelo ${MODEL_CANDIDATES[modelIndex]} falló, probando siguiente...`, attemptError)
      }
    }

    throw lastError || new Error('No se pudo obtener respuesta de ningún modelo de Gemini')
  } catch (error) {
    console.error('Error generating summary:', error)
    throw toUserFriendlyError(error)
  }
}

// Exportar tipos de reportes disponibles
export const REPORT_TYPES = {
  executive: {
    id: 'executive',
    name: {
      es: 'Ejecutivo',
      en: 'Executive',
      pt: 'Executivo',
      fr: 'Exécutif'
    },
    description: {
      es: 'Resumen general para stakeholders y gerencia',
      en: 'General summary for stakeholders and management',
      pt: 'Resumo geral para stakeholders e gerência',
      fr: 'Résumé général pour les parties prenantes et la direction'
    }
  },
  metrics: {
    id: 'metrics',
    name: {
      es: 'Métricas',
      en: 'Metrics',
      pt: 'Métricas',
      fr: 'Métriques'
    },
    description: {
      es: 'Análisis estadístico con KPIs y números clave',
      en: 'Statistical analysis with KPIs and key numbers',
      pt: 'Análise estatística com KPIs e números-chave',
      fr: 'Analyse statistique avec KPI et chiffres clés'
    }
  },
  efficiency: {
    id: 'efficiency',
    name: {
      es: 'Eficiencia',
      en: 'Efficiency',
      pt: 'Eficiência',
      fr: 'Efficacité'
    },
    description: {
      es: 'Evaluación de productividad y velocidad del equipo',
      en: 'Team productivity and velocity evaluation',
      pt: 'Avaliação de produtividade e velocidade da equipe',
      fr: 'Évaluation de la productivité et vélocité de l\'équipe'
    }
  },
  worklog: {
    id: 'worklog',
    name: {
      es: 'Registro de Trabajo',
      en: 'Work Log',
      pt: 'Registro de Trabalho',
      fr: 'Journal de Travail'
    },
    description: {
      es: 'Detalle cronológico de todo el trabajo realizado',
      en: 'Chronological detail of all work performed',
      pt: 'Detalhe cronológico de todo o trabalho realizado',
      fr: 'Détail chronologique de tout le travail effectué'
    }
  },
  technical: {
    id: 'technical',
    name: {
      es: 'Técnico',
      en: 'Technical',
      pt: 'Técnico',
      fr: 'Technique'
    },
    description: {
      es: 'Análisis profundo para desarrolladores y arquitectos',
      en: 'Deep analysis for developers and architects',
      pt: 'Análise profunda para desenvolvedores e arquitetos',
      fr: 'Analyse approfondie pour développeurs et architectes'
    }
  }
}

function createSummaryPrompt(prData, language, reportType = 'executive') {
  const languageInstructions = {
    es: {
      lang: 'español',
      periodLabel: 'Período Analizado',
      sections: {
        executive: 'Resumen Ejecutivo',
        features: 'Nuevas Funcionalidades',
        bugfixes: 'Correcciones de Errores',
        improvements: 'Mejoras Técnicas',
        infrastructure: 'Cambios de Infraestructura',
        impact: 'Análisis de Impacto',
        stats: 'Métricas y Estadísticas',
        recommendations: 'Recomendaciones'
      }
    },
    en: {
      lang: 'English',
      periodLabel: 'Analysis Period',
      sections: {
        executive: 'Executive Summary',
        features: 'New Features',
        bugfixes: 'Bug Fixes',
        improvements: 'Technical Improvements',
        infrastructure: 'Infrastructure Changes',
        impact: 'Impact Analysis',
        stats: 'Metrics and Statistics',
        recommendations: 'Recommendations'
      }
    },
    pt: {
      lang: 'português',
      periodLabel: 'Período Analisado',
      sections: {
        executive: 'Resumo Executivo',
        features: 'Novas Funcionalidades',
        bugfixes: 'Correções de Erros',
        improvements: 'Melhorias Técnicas',
        infrastructure: 'Mudanças de Infraestrutura',
        impact: 'Análise de Impacto',
        stats: 'Métricas e Estatísticas',
        recommendations: 'Recomendações'
      }
    },
    fr: {
      lang: 'français',
      periodLabel: 'Période Analysée',
      sections: {
        executive: 'Résumé Exécutif',
        features: 'Nouvelles Fonctionnalités',
        bugfixes: 'Corrections de Bugs',
        improvements: 'Améliorations Techniques',
        infrastructure: 'Changements d\'Infrastructure',
        impact: 'Analyse d\'Impact',
        stats: 'Métriques et Statistiques',
        recommendations: 'Recommandations'
      }
    }
  }

  const langConfig = languageInstructions[language] || languageInstructions['es']

  // Determinar si es la estructura nueva o antigua
  const isNewStructure = !Array.isArray(prData) && prData.pullRequests
  
  // Calcular estadísticas generales
  let totalCommits, totalFiles, authors, dateRange, prCount
  
  if (isNewStructure) {
    // Nueva estructura con commits del usuario
    const { pullRequests, userCommits, totalUserCommits, dateRange: dr } = prData
    prCount = pullRequests.length
    totalCommits = totalUserCommits
    totalFiles = pullRequests.reduce((sum, pr) => sum + (pr.files?.length || 0), 0)
    authors = [...new Set(pullRequests.map(pr => pr.user?.login || pr.author))].filter(Boolean)
    dateRange = `${dr.start} a ${dr.end}`
  } else {
    // Estructura antigua (array de PRs)
    prCount = prData.length
    totalCommits = prData.reduce((sum, pr) => sum + (pr.commits?.length || 0), 0)
    totalFiles = prData.reduce((sum, pr) => sum + (pr.files?.length || 0), 0)
    authors = [...new Set(prData.map(pr => pr.user?.login || pr.author))].filter(Boolean)
    
    // Extraer fechas
    const dates = prData.map(pr => pr.created_at).filter(Boolean).sort()
    dateRange = dates.length > 0 
      ? `${dates[0].split('T')[0]} a ${dates[dates.length - 1].split('T')[0]}`
      : 'No especificado'
  }

  // Función para generar prompt según el tipo de reporte
  const promptGenerators = {
    executive: generateExecutivePrompt,
    metrics: generateMetricsPrompt,
    efficiency: generateEfficiencyPrompt,
    worklog: generateWorklogPrompt,
    technical: generateTechnicalPrompt
  }

  const generator = promptGenerators[reportType] || promptGenerators.executive
  return generator(prData, langConfig, { prCount, totalCommits, totalFiles, authors, dateRange })
}

// Prompt para Informe Ejecutivo
function generateExecutivePrompt(prData, langConfig, stats) {
  const prDetails = buildPRDetails(prData)
  
  return `Eres un analista senior de desarrollo de software. Genera un informe EJECUTIVO PROFESIONAL en ${langConfig.lang}.

CONTEXTO: ${stats.prCount} PRs | ${stats.totalCommits} Commits del usuario | Período: ${stats.dateRange} | Equipo: ${stats.authors.join(', ')}

${prDetails}

ESTRUCTURA OBLIGATORIA:

# ${langConfig.sections.executive}
Máximo 3-4 oraciones sobre el trabajo realizado

## ${langConfig.sections.features}
Máximo 5 nuevas funcionalidades (usar -)

## ${langConfig.sections.bugfixes}
Máximo 5 bugs corregidos (usar -)

## ${langConfig.sections.improvements}
Máximo 5 mejoras técnicas (usar -)

## ${langConfig.sections.infrastructure}
Cambios en infraestructura o "Sin cambios"

## ${langConfig.sections.impact}
3-5 áreas más afectadas

## ${langConfig.sections.stats}
PRs cerrados/abiertos, commits por autor, archivos modificados (listar los más importantes)

## ${langConfig.sections.recommendations}
2-3 recomendaciones

${getFormatRules()}`
}

// Prompt para Informe de Métricas
function generateMetricsPrompt(prData, langConfig, stats) {
  const prDetails = buildPRDetails(prData)
  
  return `Eres un analista de métricas. Genera un informe de MÉTRICAS Y KPIs en ${langConfig.lang}.

CONTEXTO: ${stats.prCount} PRs | ${stats.totalCommits} commits del usuario | ${stats.totalFiles} archivos

${prDetails}

ESTRUCTURA:

# Métricas Clave
Top 5 KPIs del período

## Productividad
PRs por autor, commits por autor, promedio

## Velocidad
Throughput, frecuencia, tiempo de ciclo

## Análisis de Cambios  
Líneas añadidas/eliminadas, archivos más modificados (listar nombres)

## Distribución
Por tipo (features/bugs/refactor), por área

## Calidad
Densidad de cambios, riesgo de conflictos

## Tendencias
3-4 patrones observados

${getFormatRules()}`
}

// Prompt para Informe de Eficiencia
function generateEfficiencyPrompt(prData, langConfig, stats) {
  const prDetails = buildPRDetails(prData)
  
  return `Eres un experto en eficiencia de equipos. Genera análisis de EFICIENCIA en ${langConfig.lang}.

CONTEXTO: ${stats.authors.length} devs | ${stats.prCount} PRs | ${stats.totalCommits} commits | ${stats.dateRange}

${prDetails}

ESTRUCTURA:

# Evaluación General
Calificación: Alta/Media/Baja

## Velocidad
Throughput, tamaño PRs, frecuencia

## Eficiencia del Equipo
Balance de carga, colaboración, especialización

## Calidad vs Velocidad
Ratio bugs/features, refactoring, consistencia

## Patrones
Mejores prácticas y anti-patrones

## Cuellos de Botella
Archivos con contención, áreas lentas

## Mejoras
5 recomendaciones priorizadas

## Proyección
Capacidad y expectativas

${getFormatRules()}`
}

// Prompt para Registro de Trabajo
function generateWorklogPrompt(prData, langConfig, stats) {
  // Manejar estructura nueva o antigua
  const pullRequests = Array.isArray(prData) ? prData : prData.pullRequests
  
  const prDetailedList = pullRequests.map((pr, idx) => {
    return `${idx + 1}. [${pr.state === 'closed' ? '✅' : '🔄'}] PR #${pr.number}: ${pr.title}\n   Autor: @${pr.user?.login || 'Unknown'} | Fecha: ${pr.created_at?.split('T')[0] || 'N/A'}`
  }).join('\n')
  
  return `Eres un documentador técnico. Genera REGISTRO COMPLETO DE TRABAJO en ${langConfig.lang}.

CONTEXTO: ${stats.dateRange} | ${stats.prCount} PRs | ${stats.totalCommits} commits del usuario

PULL REQUESTS:
${prDetailedList}

ESTRUCTURA:

# Resumen del Período
Fechas, entregas totales, equipo

## Línea de Tiempo
PRs ordenados cronológicamente con fecha, autor, tipo, estado

## Por Categoría
- Features implementadas
- Bugs corregidos  
- Refactorizaciones
- Documentación

## Por Desarrollador
Para cada dev: lista de PRs y áreas de trabajo

## Archivos Principales
Top 15 archivos más trabajados con conteo de cambios

## Notas Importantes
Dependencias, breaking changes, decisiones técnicas

${getFormatRules()}`
}

// Prompt para Informe Técnico
function generateTechnicalPrompt(prData, langConfig, stats) {
  const prDetails = buildPRDetails(prData)
  
  return `Eres un arquitecto de software senior. Genera ANÁLISIS TÉCNICO PROFUNDO en ${langConfig.lang}.

CONTEXTO: ${stats.prCount} PRs | ${stats.totalCommits} commits del usuario | ${stats.totalFiles} archivos

${prDetails}

ESTRUCTURA:

# Vista General Técnica
Cambios más relevantes e impacto arquitectónico

## Arquitectura
Cambios estructurales, patrones, deuda técnica, acoplamiento

## Por Capa/Módulo
Frontend, Backend, Base de datos, Infraestructura, Testing

## Análisis de Código
Calidad, complejidad, reutilización, performance

## Dependencias
Nuevas librerías, actualizaciones, deprecaciones, riesgos

## Seguridad y Rendimiento
Vulnerabilidades, optimizaciones, best practices

## Impacto Técnico
Por área: magnitud, riesgo (bajo/medio/alto) y archivos clave afectados

## Testing y QA
Cobertura, tipos de tests, aspectos mejorados

## Recomendaciones
Por prioridad: Alta/Media/Baja, incluir deuda técnica

## Siguiente Período
Áreas que necesitan atención, refactorings sugeridos

${getFormatRules()}`
}

// Helper para construir detalles de PRs
function buildPRDetails(analysisData) {
  // Si es la estructura antigua (array simple), usarla directamente
  if (Array.isArray(analysisData)) {
    return analysisData.map((pr, index) => {
      let details = `PR #${pr.number || (index + 1)}: ${pr.title || 'Sin título'}\n`
      details += `Estado: ${pr.state} | Autor: @${pr.user?.login || 'Unknown'} | Fecha: ${pr.created_at?.split('T')[0] || 'N/A'}\n`
      
      if (pr.labels && pr.labels.length > 0) {
        details += `Etiquetas: ${pr.labels.map(l => l.name || l).join(', ')}\n`
      }
      
      if (pr.commits && pr.commits.length > 0) {
        const commitInfo = pr.totalCommits && pr.totalCommits > pr.commits.length
          ? `Commits: ${pr.commits.length} de ${pr.totalCommits} (muestra limitada)`
          : `Commits: ${pr.commits.length}`
        details += `${commitInfo}\n`
      }
      
      if (pr.files && pr.files.length > 0) {
        const adds = pr.files.reduce((s, f) => s + (f.additions || 0), 0)
        const dels = pr.files.reduce((s, f) => s + (f.deletions || 0), 0)
        details += `Archivos modificados: ${pr.files.length} (+${adds}, -${dels})\n`
        
        // Listar los archivos modificados (máximo 10 por PR)
        const fileList = pr.files.slice(0, 10).map(f => `  - ${f.filename} (+${f.additions || 0}, -${f.deletions || 0})`).join('\n')
        details += `${fileList}\n`
        if (pr.files.length > 10) {
          details += `  ... y ${pr.files.length - 10} archivos más\n`
        }
      }
      
      return details
    }).join('\n')
  }

  // Nueva estructura con commits del usuario
  const { pullRequests, userCommits, totalUserCommits, repository, author, dateRange } = analysisData
  
  let details = `INFORMACIÓN DEL ANÁLISIS:\n`
  details += `Repositorio: ${repository}\n`
  details += `Autor: @${author}\n`
  details += `Período: ${dateRange.start} a ${dateRange.end}\n`
  details += `Total de PRs: ${pullRequests.length}\n`
  details += `Total de commits del usuario: ${totalUserCommits}\n\n`
  
  // Detalles de commits del usuario (limitados)
  if (userCommits && userCommits.length > 0) {
    details += `COMMITS DEL USUARIO (${userCommits.length}):\n`
    userCommits.forEach((commit, index) => {
      details += `${index + 1}. ${commit.commit.message.split('\n')[0]} - ${commit.commit.author.date.split('T')[0]}\n`
    })
    details += `\n`
  }
  
  // Detalles de PRs (si hay)
  if (pullRequests && pullRequests.length > 0) {
    details += `PULL REQUESTS:\n`
    pullRequests.forEach((pr, index) => {
      details += `PR #${pr.number || (index + 1)}: ${pr.title || 'Sin título'}\n`
      details += `Estado: ${pr.state} | Autor: @${pr.user?.login || 'Unknown'} | Fecha: ${pr.created_at?.split('T')[0] || 'N/A'}\n`
      
      if (pr.labels && pr.labels.length > 0) {
        details += `Etiquetas: ${pr.labels.map(l => l.name || l).join(', ')}\n`
      }
      
      if (pr.commits && pr.commits.length > 0) {
        details += `Commits en PR: ${pr.commits.length}\n`
      }
      
      if (pr.files && pr.files.length > 0) {
        const adds = pr.files.reduce((s, f) => s + (f.additions || 0), 0)
        const dels = pr.files.reduce((s, f) => s + (f.deletions || 0), 0)
        details += `Archivos modificados: ${pr.files.length} (+${adds}, -${dels})\n`
        
        // Listar los archivos modificados (máximo 10 por PR)
        const fileList = pr.files.slice(0, 10).map(f => `  - ${f.filename} (+${f.additions || 0}, -${f.deletions || 0})`).join('\n')
        details += `${fileList}\n`
        if (pr.files.length > 10) {
          details += `  ... y ${pr.files.length - 10} archivos más\n`
        }
      }
      
      details += `\n`
    })
  }
  
  return details
}

// Reglas de formato
function getFormatRules() {
  return `
REGLAS:
1. Títulos con ## para secciones
2. Listas con guiones (-), NO asteriscos
3. Negritas (**) solo para datos clave
4. Máximo 5 items por sección (salvo worklog)
5. NO repetir información
6. Máximo 2 líneas por item
7. NO incluir URLs
8. Lenguaje profesional y técnico
9. Conciso y directo
10. Datos accionables
11. IMPORTANTE: Incluir nombres de archivos modificados en secciones relevantes
12. Usar rutas completas de archivos cuando sea relevante

Sigue EXACTAMENTE esta estructura.`
}

export function getGeminiApiKeyUrl() {
  return 'https://aistudio.google.com/app/apikey'
}

export function isGeminiConfigured() {
  return model !== null
}
