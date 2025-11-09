import { describe, it, expect } from 'vitest'
import {
  validateDateRange,
  validatePullRequest,
  validateCommit,
  sanitizeRepoName,
  validateLimits,
  safeGet,
  safeTruncate
} from '../utils/validation'

describe('Validation Utils', () => {
  describe('validateDateRange', () => {
    it('debe validar un rango de fechas válido', () => {
      const result = validateDateRange('2024-01-01', '2024-01-31')
      expect(result.diffDays).toBeGreaterThan(0)
      expect(result.start).toBeInstanceOf(Date)
      expect(result.end).toBeInstanceOf(Date)
    })

    it('debe lanzar error si la fecha de inicio es posterior a la de fin', () => {
      expect(() => {
        validateDateRange('2024-12-31', '2024-01-01')
      }).toThrow('fecha de inicio debe ser anterior')
    })

    it('debe lanzar error si la fecha es inválida', () => {
      expect(() => {
        validateDateRange('invalid-date', '2024-01-01')
      }).toThrow('inválida')
    })

    it('debe lanzar error si la fecha de fin es futura', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      expect(() => {
        validateDateRange('2024-01-01', futureDate.toISOString().split('T')[0])
      }).toThrow('no puede ser futura')
    })
  })

  describe('validatePullRequest', () => {
    it('debe validar un PR válido', () => {
      const pr = {
        number: 123,
        title: 'Feature: Add login',
        state: 'open',
        user: { login: 'johndoe' },
        created_at: '2024-01-01T00:00:00Z',
        labels: [{ name: 'feature' }],
        commits: [],
        files: []
      }

      const result = validatePullRequest(pr)
      expect(result.number).toBe(123)
      expect(result.title).toBe('Feature: Add login')
      expect(result.user).toBe('johndoe')
    })

    it('debe manejar PR con datos incompletos', () => {
      const pr = {
        number: 456,
        title: 'Bug fix',
        state: 'closed'
        // Falta user, created_at, etc.
      }

      const result = validatePullRequest(pr)
      expect(result.number).toBe(456)
      expect(result.user).toBe('Unknown')
      expect(result.labels).toEqual([])
    })

    it('debe manejar PR sin título', () => {
      const pr = {
        number: 789,
        title: null,
        state: 'open'
      }

      const result = validatePullRequest(pr)
      expect(result.title).toBe('Sin título')
    })
  })

  describe('validateCommit', () => {
    it('debe validar un commit válido', () => {
      const commit = {
        sha: 'abc123',
        commit: {
          message: 'Fix: Authentication bug',
          author: {
            name: 'John Doe',
            date: '2024-01-01T00:00:00Z'
          }
        },
        author: { login: 'johndoe' },
        html_url: 'https://github.com/user/repo/commit/abc123'
      }

      const result = validateCommit(commit)
      expect(result.sha).toBe('abc123')
      expect(result.message).toBe('Fix: Authentication bug')
      expect(result.author).toBe('John Doe')
    })

    it('debe manejar commit con datos incompletos', () => {
      const commit = {
        sha: 'def456',
        commit: {
          message: 'Update docs'
        }
      }

      const result = validateCommit(commit)
      expect(result.sha).toBe('def456')
      expect(result.author).toBe('Unknown')
    })
  })

  describe('sanitizeRepoName', () => {
    it('debe parsear un nombre de repo válido', () => {
      const result = sanitizeRepoName('octocat/Hello-World')
      expect(result.owner).toBe('octocat')
      expect(result.repo).toBe('Hello-World')
      expect(result.fullName).toBe('octocat/Hello-World')
    })

    it('debe lanzar error si el formato es inválido', () => {
      expect(() => {
        sanitizeRepoName('invalid-repo-name')
      }).toThrow('Formato de repositorio inválido')
    })

    it('debe lanzar error si owner o repo están vacíos', () => {
      expect(() => {
        sanitizeRepoName('/repo')
      }).toThrow('no pueden estar vacíos')
      
      expect(() => {
        sanitizeRepoName('owner/')
      }).toThrow('no pueden estar vacíos')
    })

    it('debe rechazar nombres nulos o no strings', () => {
      expect(() => sanitizeRepoName(null)).toThrow('inválido')
      expect(() => sanitizeRepoName(123)).toThrow('inválido')
    })
  })

  describe('validateLimits', () => {
    it('debe validar límites correctos', () => {
      expect(validateLimits(50, 100)).toBe(true)
    })

    it('debe rechazar límites fuera de rango', () => {
      expect(() => validateLimits(0, 50)).toThrow('debe estar entre 1 y 500')
      expect(() => validateLimits(600, 50)).toThrow('debe estar entre 1 y 500')
      expect(() => validateLimits(50, -1)).toThrow('debe estar entre 1 y 500')
    })

    it('debe rechazar límites no enteros', () => {
      expect(() => validateLimits(50.5, 100)).toThrow('debe estar entre 1 y 500')
      expect(() => validateLimits(50, 'invalid')).toThrow('debe estar entre 1 y 500')
    })
  })

  describe('safeGet', () => {
    const obj = {
      user: {
        profile: {
          name: 'John Doe',
          age: 30
        }
      }
    }

    it('debe obtener valores anidados correctamente', () => {
      expect(safeGet(obj, 'user.profile.name')).toBe('John Doe')
      expect(safeGet(obj, 'user.profile.age')).toBe(30)
    })

    it('debe retornar valor por defecto si no existe', () => {
      expect(safeGet(obj, 'user.settings.theme', 'dark')).toBe('dark')
      expect(safeGet(obj, 'missing.path', null)).toBe(null)
    })

    it('debe manejar objetos nulos o undefined', () => {
      expect(safeGet(null, 'any.path', 'default')).toBe('default')
      expect(safeGet(undefined, 'any.path', 'default')).toBe('default')
    })
  })

  describe('safeTruncate', () => {
    it('debe truncar strings largos', () => {
      const longText = 'This is a very long text that should be truncated'
      const result = safeTruncate(longText, 20)
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result).toContain('...')
    })

    it('no debe truncar strings cortos', () => {
      const shortText = 'Short'
      expect(safeTruncate(shortText, 20)).toBe('Short')
    })

    it('debe manejar strings vacíos o nulos', () => {
      expect(safeTruncate('', 20)).toBe('')
      expect(safeTruncate(null, 20)).toBe('')
      expect(safeTruncate(undefined, 20)).toBe('')
    })

    it('debe permitir sufijo personalizado', () => {
      const result = safeTruncate('Long text here', 10, '---')
      expect(result).toContain('---')
    })
  })
})
