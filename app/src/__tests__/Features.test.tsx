import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Features from '../sections/Features'

describe('Features section', () => {
  it('renders the section heading', () => {
    render(<Features />)
    expect(screen.getByText(/features/i)).toBeTruthy()
  })
})
