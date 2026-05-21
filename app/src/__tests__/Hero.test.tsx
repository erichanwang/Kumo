import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from '../sections/Hero'

describe('Hero section', () => {
  it('renders heading', () => {
    render(<Hero />)
    expect(screen.getByText(/Kumo/i)).toBeTruthy()
  })

  it('renders CTA buttons', () => {
    render(<Hero />)
    const buttons = screen.getAllByRole('link')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
