import toast from 'react-hot-toast'
import axios from 'axios'

export function handleApiError(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (axios.isAxiosError(error)) {
    const problem = error.response?.data
    // RFC 7807 ProblemDetails format
    if (problem?.detail) return problem.detail
    if (problem?.message) return problem.message
    if (problem?.title) return problem.title
    if (error.response?.status === 429) return 'Too many requests. Please wait a moment.'
    if (error.response?.status === 403) return 'You do not have permission to perform this action.'
    if (error.response?.status === 404) return 'The requested resource was not found.'
    if (error.response?.status === 400) return problem?.errors ? JSON.stringify(problem.errors) : 'Invalid request data.'
  }
  if (error instanceof Error) return error.message
  return fallbackMessage
}

export function toastError(error: unknown, fallbackMessage?: string) {
  toast.error(handleApiError(error, fallbackMessage))
}

export function toastSuccess(message: string) {
  toast.success(message)
}
